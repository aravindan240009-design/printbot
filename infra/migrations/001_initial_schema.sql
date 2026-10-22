-- Production PostgreSQL Schema for Xerox SaaS Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Print Jobs Table
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    file_name VARCHAR(500) NOT NULL,
    file_storage_path VARCHAR(1000),
    file_size_bytes BIGINT NOT NULL,
    page_count INT NOT NULL,
    options JSONB NOT NULL,
    calculated_price_cents INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_intent_id VARCHAR(255),
    spooler_job_id VARCHAR(100),
    workstation_id VARCHAR(100),
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Composite indexes for high-throughput tenant queues
CREATE INDEX IF NOT EXISTS idx_print_jobs_tenant_status ON print_jobs (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_jobs_payment_intent ON print_jobs (payment_intent_id);

-- 3. Idempotency Key Store (Replay Attack & Duplicate Webhook Protection)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    status_code INT NOT NULL,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- 4. Workstation Hardware Spool Events Ledger
CREATE TABLE IF NOT EXISTS spool_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
    workstation_id VARCHAR(100) NOT NULL,
    printer_name VARCHAR(255) NOT NULL,
    spooler_job_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spool_events_job ON spool_events (job_id, created_at DESC);

-- 5. Row-Level Security (RLS) Configuration for Supabase / PostgreSQL
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE spool_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_print_jobs ON print_jobs
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

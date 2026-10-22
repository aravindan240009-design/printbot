-- ==============================================================================
-- Migration 002: Phase 4 Payment Safety, Two Modes, Escrow Ledger & Outbox Schema
-- ==============================================================================

-- 1. Outbox Events (Transactional publishing to message broker / Valkey)
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON outbox_events (status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_outbox_events_shop ON outbox_events (shop_id, created_at DESC);

-- 2. Merchant Payment Configs (Independent per-shop gateway credentials)
CREATE TABLE IF NOT EXISTS merchant_payment_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('MOCK', 'RAZORPAY', 'CASH')),
    key_id VARCHAR(255) NOT NULL,
    encrypted_key_secret TEXT NOT NULL,
    webhook_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_provider UNIQUE (shop_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_merchant_payment_configs_shop ON merchant_payment_configs (shop_id);

-- 3. Daily Settlement Reconciliations (Gateway vs Ledger reconciliation reports)
CREATE TABLE IF NOT EXISTS daily_settlement_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    total_ledger_captured_paise INT NOT NULL,
    total_ledger_refunded_paise INT NOT NULL,
    total_provider_captured_paise INT NOT NULL,
    total_provider_refunded_paise INT NOT NULL,
    matched_count INT NOT NULL DEFAULT 0,
    unmatched_count INT NOT NULL DEFAULT 0,
    discrepancy_paise INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'BALANCED' CHECK (status IN ('BALANCED', 'DISCREPANCY_DETECTED')),
    report_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_settlement_shop_date UNIQUE (shop_id, reconciliation_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_settlement_shop ON daily_settlement_reconciliations (shop_id, reconciliation_date DESC);

-- 4. Add Phase 4 columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_state VARCHAR(50) NOT NULL DEFAULT 'NONE';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

-- 5. Force Row Level Security (RLS) on new tenant-owned tables
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_outbox_events ON outbox_events;
CREATE POLICY tenant_isolation_outbox_events ON outbox_events
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE merchant_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payment_configs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_merchant_payment_configs ON merchant_payment_configs;
CREATE POLICY tenant_isolation_merchant_payment_configs ON merchant_payment_configs
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE daily_settlement_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_settlement_reconciliations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_daily_settlement_reconciliations ON daily_settlement_reconciliations;
CREATE POLICY tenant_isolation_daily_settlement_reconciliations ON daily_settlement_reconciliations
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

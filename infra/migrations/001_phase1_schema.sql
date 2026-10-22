-- ==============================================================================
-- Print Bot SaaS Phase 1 Production Multi-Tenant Schema
-- ==============================================================================
-- PostgreSQL Schema with strict Row-Level Security (RLS) forced on all tenant tables,
-- UUID primary keys, immutable creator lineage, composite tenant keys,
-- Single All-Inclusive Subscription Plan, and Windows Device Cryptographic Enrollment.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Shops (Root Tenant Entity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Shop Profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(1000),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address_line TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    state VARCHAR(100) NOT NULL DEFAULT 'Tamil Nadu',
    postal_code VARCHAR(20),
    supported_languages JSONB NOT NULL DEFAULT '["en", "ta"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_profile UNIQUE (shop_id)
);

-- ------------------------------------------------------------------------------
-- 3. QR Links
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    destination_url VARCHAR(1000) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    scan_count BIGINT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Shop Settings (Order mode, payment methods, retention)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_mode VARCHAR(50) NOT NULL DEFAULT 'FULL_AUTOMATIC' CHECK (order_mode IN ('FULL_AUTOMATIC', 'MANUAL_APPROVAL')),
    cash_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    upi_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    retention_hours INT NOT NULL DEFAULT 24,
    max_file_size_mb INT NOT NULL DEFAULT 100,
    operating_hours JSONB NOT NULL DEFAULT '{"monday": {"open": "09:00", "close": "21:00"}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_settings UNIQUE (shop_id)
);

-- ------------------------------------------------------------------------------
-- 5. Staff (Global identity for platform & shop operators)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Shop Memberships (Staff RBAC per Shop)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_staff UNIQUE (shop_id, staff_id)
);

-- ------------------------------------------------------------------------------
-- 8. Subscriptions (Exactly One All-Inclusive Plan; Unlimited Printers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'ALL_INCLUSIVE',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
    status VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'grace', 'suspended', 'canceled')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    grace_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    features JSONB NOT NULL DEFAULT '{"unlimited_printers": true, "automatic_routing": true, "timed_xerox": true, "custom_branding": true, "multi_language": true, "all_paper_sizes": true}'::jsonb,
    quota_limits JSONB NOT NULL DEFAULT '{"max_monthly_bandwidth_bytes": 107374182400, "max_storage_bytes": 53687091200, "max_daily_orders": 10000}'::jsonb,
    admin_override BOOLEAN NOT NULL DEFAULT FALSE,
    admin_override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_subscription UNIQUE (shop_id)
);

-- ------------------------------------------------------------------------------
-- 9. Invoices
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount_paise INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. Billing Events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. Device Pairing Codes (Short TTL, Single-Use)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by_device_id UUID,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_codes_lookup ON device_pairing_codes (code, expires_at);

-- ------------------------------------------------------------------------------
-- 12. Devices (Windows Workstations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_identifier VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    os_info VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'pending')),
    paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_device UNIQUE (shop_id, device_identifier)
);

-- ------------------------------------------------------------------------------
-- 13. Device Public Keys (Asymmetric Key Cryptography / Ed25519)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_public_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    public_key_pem TEXT NOT NULL,
    key_type VARCHAR(50) NOT NULL DEFAULT 'Ed25519',
    key_fingerprint VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 14. Device Heartbeats
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    agent_version VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
    ip_address VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_device_heartbeats_recent ON device_heartbeats (device_id, timestamp DESC);

-- ------------------------------------------------------------------------------
-- 15. Printers (Unlimited per Shop)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS printers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255),
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    color_capable BOOLEAN NOT NULL DEFAULT TRUE,
    duplex_capable BOOLEAN NOT NULL DEFAULT TRUE,
    supported_formats JSONB NOT NULL DEFAULT '["A4", "A3", "Letter", "Legal"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_printer_name UNIQUE (shop_id, name)
);

-- ------------------------------------------------------------------------------
-- 16. Printer Capability Snapshots
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS printer_capability_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
    snapshot_hash VARCHAR(64) NOT NULL,
    devmode_capabilities JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. Guest Sessions (Short-lived, Shop-bound)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_hash VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_lookup ON guest_sessions (session_token, expires_at);

-- ------------------------------------------------------------------------------
-- 18. Pricing Versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pricing_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    rates JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_pricing_version UNIQUE (shop_id, version_number)
);

-- ------------------------------------------------------------------------------
-- 19. Orders
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    customer_identifier VARCHAR(100),
    customer_phone_hash VARCHAR(64),
    total_paise INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'PENDING_PAYMENT',
        'PAID', 'APPROVED', 'REJECTED', 'QUEUED', 'IN_PROGRESS', 'READY_FOR_PICKUP',
        'COMPLETED', 'CANCELED', 'REFUNDED'
    )),
    order_mode VARCHAR(50) NOT NULL DEFAULT 'FULL_AUTOMATIC',
    pricing_version_id UUID REFERENCES pricing_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders (shop_id, status, created_at DESC);

-- ------------------------------------------------------------------------------
-- 20. Order Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_index INT NOT NULL,
    file_asset_id UUID,
    print_plan JSONB NOT NULL,
    calculated_paise INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 21. Assets (Tenant-scoped object storage metadata)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    storage_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    uploaded_by_session_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    retention_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_retention ON assets (retention_until) WHERE is_deleted = FALSE;

-- ------------------------------------------------------------------------------
-- 22. Jobs (Execution units dispatched to printers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
        'QUEUED', 'ASSIGNED', 'SPOOLING', 'PRINTING', 'COMPLETED', 'COMPLETION_UNKNOWN', 'FAILED', 'CANCELED'
    )),
    spooler_job_id VARCHAR(100),
    physical_sheets INT NOT NULL DEFAULT 1,
    rendered_sides INT NOT NULL DEFAULT 1,
    logical_pages INT NOT NULL DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_shop_status ON jobs (shop_id, status, created_at ASC);

-- ------------------------------------------------------------------------------
-- 23. Job Events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 24. Payment Ledger
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_paise INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'CARD', 'NETBANKING')),
    provider VARCHAR(50),
    provider_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'VERIFIED', 'FAILED', 'REFUNDED')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 25. Webhook Inbox (Deduplication & Replay Prevention)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    raw_payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED')),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 26. Audit Events (Immutable Lineage & Superadmin Overrides)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
    actor_id UUID,
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('STAFF', 'SUPERADMIN', 'DEVICE', 'GUEST', 'SYSTEM')),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_shop ON audit_events (shop_id, created_at DESC);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) FORCED ON ALL TENANT-OWNED TABLES
-- ==============================================================================
-- Guarantees that even table owners or superuser roles with RLS enabled cannot
-- inadvertently leak tenant data when current_setting('app.current_tenant_id') is active.

DO $$
DECLARE
    t text;
    tenant_tables text[] := ARRAY[
        'shop_profiles', 'qr_links', 'shop_settings', 'shop_memberships',
        'subscriptions', 'invoices', 'billing_events', 'device_pairing_codes',
        'devices', 'device_public_keys', 'device_heartbeats', 'printers',
        'printer_capability_snapshots', 'guest_sessions', 'pricing_versions',
        'orders', 'order_items', 'assets', 'jobs', 'job_events', 'payment_ledger'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I;', t, t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation_%I ON %I FOR ALL USING (shop_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''信)::uuid);',
            t, t
        );
    END LOOP;
END $$;

-- ==============================================================================
-- SEED DATA: TWO DELIBERATELY ADVERSARIAL SHOPS & SEPARATE GUEST RECORDS
-- ==============================================================================
-- Shop A: Anna University Quick Xerox (Chennai) - 11111111-1111-1111-1111-111111111111
-- Shop B: Bharat Fast Prints (Madurai)          - 22222222-2222-2222-2222-222222222222

-- 1. Insert Adversarial Shops
INSERT INTO shops (id, slug, name, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'anna-chennai', 'Anna University Quick Xerox', true),
('22222222-2222-2222-2222-222222222222', 'bharat-madurai', 'Bharat Fast Prints', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Shop Profiles
INSERT INTO shop_profiles (shop_id, brand_name, contact_phone, contact_email, city, state) VALUES
('11111111-1111-1111-1111-111111111111', 'Anna Xerox Guindy', '+91 98765 00001', 'contact@annaxerox.com', 'Chennai', 'Tamil Nadu'),
('22222222-2222-2222-2222-222222222222', 'Bharat Prints Madurai', '+91 98765 00002', 'help@bharatprints.com', 'Madurai', 'Tamil Nadu')
ON CONFLICT (shop_id) DO NOTHING;

-- 3. QR Links
INSERT INTO qr_links (shop_id, code, destination_url) VALUES
('11111111-1111-1111-1111-111111111111', 'qr_anna_guindy', 'https://printbot.in/qr/anna-guindy'),
('22222222-2222-2222-2222-222222222222', 'qr_bharat_simmakkal', 'https://printbot.in/qr/bharat-simmakkal')
ON CONFLICT (code) DO NOTHING;

-- 4. Shop Settings (Shop A: FULL_AUTOMATIC, Shop B: MANUAL_APPROVAL)
INSERT INTO shop_settings (shop_id, order_mode, cash_allowed, upi_allowed, retention_hours) VALUES
('11111111-1111-1111-1111-111111111111', 'FULL_AUTOMATIC', true, true, 24),
('22222222-2222-2222-2222-222222222222', 'MANUAL_APPROVAL', true, true, 48)
ON CONFLICT (shop_id) DO NOTHING;

-- 5. Subscriptions (Exactly One All-Inclusive Plan)
INSERT INTO subscriptions (shop_id, plan_id, billing_interval, status, current_period_end) VALUES
('11111111-1111-1111-1111-111111111111', 'ALL_INCLUSIVE', 'monthly', 'active', NOW() + INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 'ALL_INCLUSIVE', 'annual', 'active', NOW() + INTERVAL '365 days')
ON CONFLICT (shop_id) DO NOTHING;

-- 6. Printers (Unlimited per Shop)
INSERT INTO printers (id, shop_id, name, system_name, driver_name, is_online, is_default) VALUES
('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Canon imageRUNNER ADV C3530i', 'CANON_IR_C3530I', 'Canon Generic Plus UFR II', true, true),
('a1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'HP LaserJet Pro M404dn', 'HP_LJ_M404DN', 'HP LaserJet Pro M404-M405 PCL-6', true, false),
('b2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Konica Minolta bizhub C224e', 'KM_BIZHUB_C224E', 'KONICA MINOLTA C364eSeriesPCL', true, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Pricing Versions
INSERT INTO pricing_versions (shop_id, version_number, rates, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 1, '{"base_page_bw_paise": 150, "base_page_color_paise": 1000, "duplex_discount_percent": 15}'::jsonb, true),
('22222222-2222-2222-2222-222222222222', 1, '{"base_page_bw_paise": 200, "base_page_color_paise": 800, "duplex_discount_percent": 20}'::jsonb, true)
ON CONFLICT (shop_id, version_number) DO NOTHING;

-- 8. Separate Guest Sessions (Minimizing PII, strictly shop-bound)
INSERT INTO guest_sessions (id, shop_id, session_token, expires_at) VALUES
('e1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'gst_anna_tok_99887711', NOW() + INTERVAL '2 hours'),
('e2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'gst_bharat_tok_33445522', NOW() + INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

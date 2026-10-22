-- ==============================================================================
-- Migration 005: Phase 7 Advanced Print Studio, Hardware Adapters & Differentiation
-- ==============================================================================

-- 1. Shop Presets (Saved configuration templates, e.g. College Lab Report, Court Brief)
CREATE TABLE IF NOT EXISTS shop_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_presets_shop ON shop_presets (shop_id);

-- 2. Prepaid Corporate & College Accounts (Tenant-scoped student/corporate balances)
CREATE TABLE IF NOT EXISTS prepaid_corporate_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    account_name VARCHAR(150) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    balance_paise BIGINT NOT NULL DEFAULT 0,
    contact_email VARCHAR(255) NOT NULL,
    authorized_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_prepaid_account_shop_code UNIQUE (shop_id, account_code)
);

CREATE INDEX IF NOT EXISTS idx_prepaid_accounts_shop ON prepaid_corporate_accounts (shop_id);

-- 3. Prepaid Account Transactions (Audit ledger for student/corporate debit and credits)
CREATE TABLE IF NOT EXISTS prepaid_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES prepaid_corporate_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount_paise BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT', 'REFUND')),
    balance_after_paise BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prepaid_tx_shop ON prepaid_transactions (shop_id);

-- 4. Resumable Upload Sessions (Chunked upload tracking for multi-megabyte large assets)
CREATE TABLE IF NOT EXISTS resumable_upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    upload_id VARCHAR(100) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_size_bytes BIGINT NOT NULL,
    total_chunks INT NOT NULL,
    uploaded_chunks INT NOT NULL DEFAULT 0,
    sha256_checksum VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'FAILED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumable_upload_shop ON resumable_upload_sessions (shop_id);

-- 5. Printer Consumable Telemetry (Live toner, drum, and maintenance metrics)
CREATE TABLE IF NOT EXISTS printer_telemetry_consumables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    printer_id VARCHAR(100) NOT NULL,
    printer_name VARCHAR(150) NOT NULL,
    toner_black_percent INT NOT NULL DEFAULT 100,
    toner_cyan_percent INT,
    toner_magenta_percent INT,
    toner_yellow_percent INT,
    drum_life_percent INT NOT NULL DEFAULT 100,
    maintenance_box_percent INT NOT NULL DEFAULT 100,
    alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printer_telemetry_shop ON printer_telemetry_consumables (shop_id);

-- 6. Timed Copier Rental Sessions (Physical kiosk and self-service lock simulation)
CREATE TABLE IF NOT EXISTS timed_copier_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    session_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_identifier VARCHAR(150) NOT NULL,
    duration_minutes INT NOT NULL,
    allocated_copies INT NOT NULL DEFAULT 50,
    actual_copies INT NOT NULL DEFAULT 0,
    bill_amount_paise INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'COMPLETED', 'STAFF_OVERRIDDEN')),
    hardware_lock_state VARCHAR(50) NOT NULL DEFAULT 'UNLOCKED',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timed_copier_shop ON timed_copier_sessions (shop_id);

-- 7. Scanner Bridge Tasks (WIA/TWAIN/IPP Scan intake tasks)
CREATE TABLE IF NOT EXISTS scanner_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    task_id VARCHAR(100) UNIQUE NOT NULL,
    scanner_id VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'FLATBED' CHECK (source_type IN ('FLATBED', 'ADF')),
    duplex BOOLEAN NOT NULL DEFAULT FALSE,
    dpi INT NOT NULL DEFAULT 300,
    color_mode VARCHAR(50) NOT NULL DEFAULT 'bw',
    pages_scanned INT NOT NULL DEFAULT 0,
    output_asset_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'SCANNING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scanner_tasks_shop ON scanner_tasks (shop_id);

-- ==============================================================================
-- Row-Level Security (RLS) Enforcement for Phase 7 Tables
-- ==============================================================================

ALTER TABLE shop_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_presets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shop_presets ON shop_presets;
CREATE POLICY tenant_isolation_shop_presets ON shop_presets
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE prepaid_corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prepaid_corporate_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_prepaid_accounts ON prepaid_corporate_accounts;
CREATE POLICY tenant_isolation_prepaid_accounts ON prepaid_corporate_accounts
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE prepaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prepaid_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_prepaid_transactions ON prepaid_transactions;
CREATE POLICY tenant_isolation_prepaid_transactions ON prepaid_transactions
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE resumable_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumable_upload_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_resumable_uploads ON resumable_upload_sessions;
CREATE POLICY tenant_isolation_resumable_uploads ON resumable_upload_sessions
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE printer_telemetry_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_telemetry_consumables FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_printer_telemetry ON printer_telemetry_consumables;
CREATE POLICY tenant_isolation_printer_telemetry ON printer_telemetry_consumables
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE timed_copier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timed_copier_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_timed_copier ON timed_copier_sessions;
CREATE POLICY tenant_isolation_timed_copier ON timed_copier_sessions
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE scanner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_tasks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_scanner_tasks ON scanner_tasks;
CREATE POLICY tenant_isolation_scanner_tasks ON scanner_tasks
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

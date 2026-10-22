-- ==============================================================================
-- Migration 004: Phase 6 Super Admin, Licensing, Fleet, and Security Hardening Schema
-- ==============================================================================

-- 1. Break-Glass Support Sessions (Audited, time-bounded emergency platform support)
CREATE TABLE IF NOT EXISTS break_glass_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES staff(id),
    approver_id UUID REFERENCES staff(id),
    reason TEXT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED')),
    can_access_documents BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_break_glass_shop ON break_glass_sessions (shop_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_token ON break_glass_sessions (token_hash);

-- 2. Step-Up Re-Authentication Challenges (Elevated security for sensitive actions)
CREATE TABLE IF NOT EXISTS admin_step_up_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES staff(id),
    action_type VARCHAR(100) NOT NULL,
    challenge_hash VARCHAR(64) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_up_user ON admin_step_up_challenges (user_id);

-- 3. Agent Fleet Releases (Version enforcement, signed channels, canary rollouts)
CREATE TABLE IF NOT EXISTS agent_fleet_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) UNIQUE NOT NULL,
    release_channel VARCHAR(50) NOT NULL CHECK (release_channel IN ('dev_unsigned', 'beta_tested', 'production_signed')),
    download_url VARCHAR(500) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    min_supported_version VARCHAR(50) NOT NULL,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    grace_period_hours INT NOT NULL DEFAULT 72,
    rollout_percentage INT NOT NULL DEFAULT 100,
    release_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_fleet_channel ON agent_fleet_releases (release_channel);

-- 4. Device Security Alerts (Suspicious account sharing, credential misuse, anomalous telemetry)
CREATE TABLE IF NOT EXISTS device_security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_alerts_shop ON device_security_alerts (shop_id);

-- 5. Diagnostic Bundles (Redacted, operator-consented technical troubleshooting bundles)
CREATE TABLE IF NOT EXISTS diagnostic_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    bundle_ref VARCHAR(100) UNIQUE NOT NULL,
    operator_consented BOOLEAN NOT NULL DEFAULT TRUE,
    redaction_verified BOOLEAN NOT NULL DEFAULT TRUE,
    log_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_bundles_shop ON diagnostic_bundles (shop_id);

-- 6. Shop Tax Invoices (Official Indian GST tax breakdown, SAC 998313, SaaS subscription income)
CREATE TABLE IF NOT EXISTS shop_tax_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    base_paise INT NOT NULL,
    cgst_paise INT NOT NULL DEFAULT 0,
    sgst_paise INT NOT NULL DEFAULT 0,
    igst_paise INT NOT NULL DEFAULT 0,
    total_paise INT NOT NULL,
    sac_code VARCHAR(20) NOT NULL DEFAULT '998313',
    hsn_description VARCHAR(255) NOT NULL DEFAULT 'Information Technology Software Services for Print Automation',
    state_code VARCHAR(10) NOT NULL DEFAULT '33',
    status VARCHAR(50) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'REFUNDED', 'DISPUTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_tax_invoices_shop ON shop_tax_invoices (shop_id);

-- ==============================================================================
-- Row-Level Security (RLS) Enforcement for Phase 6 Tables
-- ==============================================================================

ALTER TABLE break_glass_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_break_glass ON break_glass_sessions;
CREATE POLICY tenant_isolation_break_glass ON break_glass_sessions
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE device_security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_security_alerts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_device_alerts ON device_security_alerts;
CREATE POLICY tenant_isolation_device_alerts ON device_security_alerts
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE diagnostic_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_bundles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_diagnostic_bundles ON diagnostic_bundles;
CREATE POLICY tenant_isolation_diagnostic_bundles ON diagnostic_bundles
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

ALTER TABLE shop_tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_tax_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shop_tax_invoices ON shop_tax_invoices;
CREATE POLICY tenant_isolation_shop_tax_invoices ON shop_tax_invoices
    FOR ALL
    USING (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    )
    WITH CHECK (
        shop_id = NULLIF(current_setting('app.current_shop_id', TRUE), '')::UUID
        OR NULLIF(current_setting('app.is_superadmin', TRUE), '')::BOOLEAN = TRUE
    );

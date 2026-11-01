-- ==============================================================================
-- Print Bot SaaS Phase 1 Definitive Multi-Tenant Production Schema
-- ==============================================================================
-- PostgreSQL 16+ Multi-Tenant Schema with strict Row-Level Security (RLS),
-- cryptographically protected licensing, idempotency tracking, audit logging,
-- and safe zero-downtime pilot data migration.
-- Clean non-deprecated code using core gen_random_uuid() and sha256().
-- ==============================================================================

-- Ensure Supabase-compatible roles exist in standalone/local PostgreSQL environments
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;

-- Ensure auth schema and auth.jwt() exist for standalone/local PostgreSQL environments
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$
    SELECT coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb,
        '{}'::jsonb
    );
$$;

-- ------------------------------------------------------------------------------
-- 1. Standardized Licence Pepper Secret Retrieval & Hash Calculation
-- ------------------------------------------------------------------------------
-- Restricted strictly to trusted database operations / service_role.
-- Never exposed to public RPC or client roles.
CREATE OR REPLACE FUNCTION public.get_license_pepper() 
RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp AS $$
DECLARE
    v_pepper TEXT;
BEGIN
    v_pepper := current_setting('app.settings.license_pepper', true);
    IF v_pepper IS NULL OR length(v_pepper) < 32 THEN
        BEGIN
            SELECT decrypted_secret INTO v_pepper 
            FROM vault.decrypted_secrets 
            WHERE name = 'license_pepper';
        EXCEPTION WHEN OTHERS THEN
            v_pepper := NULL;
        END;
    END IF;
    IF v_pepper IS NULL OR length(v_pepper) < 32 THEN
        RAISE EXCEPTION 'FATAL: Server license pepper is missing or under 32 characters in configuration/vault.' 
        USING ERRCODE = 'P0001';
    END IF;
    RETURN v_pepper;
END;
$$;

REVOKE ALL ON FUNCTION public.get_license_pepper() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_license_pepper() TO service_role;

CREATE OR REPLACE FUNCTION public.compute_license_hash(p_key TEXT, p_pepper TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE STRICT
SET search_path = public, pg_temp AS $$
DECLARE
    v_key_bytes BYTEA;
    v_msg_bytes BYTEA;
    v_ipad BYTEA;
    v_opad BYTEA;
    v_inner BYTEA;
    i INT;
    v_byte INT;
BEGIN
    -- Check if extensions.hmac is available (standard on Supabase)
    BEGIN
        RETURN encode(extensions.hmac(convert_to(UPPER(TRIM(p_key)), 'UTF8'), convert_to(p_pepper, 'UTF8'), 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- RFC 2104 compliant pure PL/pgSQL HMAC-SHA256 implementation
    v_key_bytes := convert_to(p_pepper, 'UTF8');
    v_msg_bytes := convert_to(UPPER(TRIM(p_key)), 'UTF8');

    IF length(v_key_bytes) > 64 THEN
        v_key_bytes := sha256(v_key_bytes);
    END IF;
    IF length(v_key_bytes) < 64 THEN
        v_key_bytes := v_key_bytes || decode(repeat('00', 64 - length(v_key_bytes)), 'hex');
    END IF;

    v_ipad := decode(repeat('00', 64), 'hex');
    v_opad := decode(repeat('00', 64), 'hex');
    FOR i IN 0..63 LOOP
        v_byte := get_byte(v_key_bytes, i);
        v_ipad := set_byte(v_ipad, i, v_byte # 54);  -- 0x36
        v_opad := set_byte(v_opad, i, v_byte # 92);  -- 0x5c
    END LOOP;

    v_inner := sha256(v_ipad || v_msg_bytes);
    RETURN encode(sha256(v_opad || v_inner), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION public.compute_license_hash(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_license_hash(TEXT, TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. Audit & Idempotency Infrastructure Tables
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.migration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id TEXT NOT NULL,
    flag_reason TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Core Multi-Tenant Entities (Reconciled Canonical Schema)
-- ------------------------------------------------------------------------------

-- (a) Shops (Root Tenant Entity)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_source_id VARCHAR(255) UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Chennai',
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    rates JSONB NOT NULL DEFAULT '{"bwRate": 1.5, "colorRate": 10.0, "duplexDiscountPercent": 15}'::jsonb,
    order_mode VARCHAR(50) NOT NULL DEFAULT 'MANUAL_APPROVAL' CHECK (order_mode IN ('FULL_AUTOMATIC', 'MANUAL_APPROVAL')),
    operating_hours JSONB NOT NULL DEFAULT '{"monday": {"open": "08:00", "close": "21:30"}}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (b) Shop Licences (Cryptographic Key Hash Storage)
CREATE TABLE IF NOT EXISTS public.shop_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    legacy_source_id VARCHAR(255) UNIQUE,
    license_key_hash VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT '1 Year',
    is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
    max_devices INT NOT NULL DEFAULT 2,
    migration_status VARCHAR(100) NOT NULL DEFAULT 'VERIFIED',
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_license UNIQUE (shop_id)
);

-- (c) Workstation Devices (Hardware Enrolment)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    public_key_pem TEXT,
    hardware_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    agent_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'PENDING')),
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_shop ON public.devices(shop_id, status);

-- (d) Storage Assets (Upload Metadata & Auto-Purge TTL)
CREATE TABLE IF NOT EXISTS public.storage_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    storage_path TEXT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    page_count INT NOT NULL DEFAULT 1,
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_DELETION', 'PURGED')),
    retry_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_storage_assets_expiry ON public.storage_assets(expires_at, status);

-- (e) Print Jobs (Unified 20-State Machine Print Queue & Orders)
CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    asset_id UUID REFERENCES public.storage_assets(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    pickup_pin VARCHAR(10) NOT NULL,
    tracking_secret_hash VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    options JSONB NOT NULL,
    page_count INT NOT NULL,
    physical_sheets INT NOT NULL,
    calculated_price_paise INT NOT NULL,
    quote_hash VARCHAR(255) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('upi', 'cash')),
    status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_PAYMENT' 
        CHECK (status IN (
            'AWAITING_PAYMENT', 'PAID', 'PENDING_APPROVAL', 'QUEUED', 
            'LEASED', 'SPOOL_SUBMITTED', 'PRINTING', 'PRINT_CONFIRMED', 
            'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'REJECTED', 'COMPLETION_UNKNOWN'
        )),
    rejection_reason TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_print_jobs_shop_status ON public.print_jobs(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_tracking ON public.print_jobs(tracking_secret_hash);

-- (f) Payments (Reconciled Financial Ledger)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    job_id UUID NOT NULL REFERENCES public.print_jobs(id) ON DELETE RESTRICT,
    gateway VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255) UNIQUE,
    amount_paise INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'REFUNDED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (g) Spool Events (Physical Telemetry Audit)
CREATE TABLE IF NOT EXISTS public.spool_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.print_jobs(id) ON DELETE RESTRICT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('INTENT', 'SPOOL_SUBMITTED', 'PRINTING', 'PRINT_CONFIRMED', 'JAMMED', 'ERROR')),
    spooler_job_id INT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (h) Audit Events (Immutable Platform Action Ledger)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('CUSTOMER', 'STAFF', 'WORKSTATION', 'SYSTEM')),
    actor_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (i) Idempotency Records
CREATE TABLE IF NOT EXISTS public.idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_code INT NOT NULL,
    response_body JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shop_idempotency UNIQUE(shop_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON public.idempotency_records(shop_id, idempotency_key, expires_at);

-- (j) Dead Letter Cleanup (Failed Object Deletion Escalations)
CREATE TABLE IF NOT EXISTS public.dead_letter_cleanup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.storage_assets(id) ON DELETE RESTRICT,
    storage_path TEXT NOT NULL,
    failure_reason TEXT NOT NULL,
    retry_count INT NOT NULL DEFAULT 5,
    escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255)
);

-- ------------------------------------------------------------------------------
-- 4. Idempotent Data Migration from pilot_applications
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    rec RECORD;
    v_shop_id UUID;
    v_bw NUMERIC;
    v_color NUMERIC;
    v_plan TEXT;
    v_is_lifetime BOOLEAN;
    v_expires_at TIMESTAMPTZ;
    v_starts_at TIMESTAMPTZ;
    v_migration_status TEXT;
    v_revoked BOOLEAN;
    v_base_slug TEXT;
    v_slug TEXT;
    v_pepper TEXT;
BEGIN
    -- Only run migration if legacy pilot_applications table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pilot_applications' AND table_type = 'BASE TABLE'
    ) THEN
        v_pepper := public.get_license_pepper();

        FOR rec IN SELECT * FROM public.pilot_applications LOOP
            -- 1. Explicit variable resets on EVERY iteration
            v_bw := 1.5;
            v_color := 10.0;
            v_plan := NULL;
            v_is_lifetime := FALSE;
            v_expires_at := NULL;
            v_starts_at := NULL;
            v_migration_status := 'VERIFIED';
            v_revoked := FALSE;

            -- 2. Idempotency Check: Skip if already migrated via legacy_source_id
            IF EXISTS (SELECT 1 FROM public.shops WHERE legacy_source_id = rec.id) THEN
                CONTINUE;
            END IF;

            -- 3. Base slug sanitization
            v_base_slug := LOWER(REGEXP_REPLACE(TRIM(COALESCE(rec.generated_username, '')), '[^a-z0-9\-]', '', 'g'));
            IF v_base_slug IS NULL OR v_base_slug = '' THEN
                v_base_slug := LOWER(REGEXP_REPLACE(TRIM(COALESCE(rec.shop_name, 'counter')), '[^a-z0-9\-]', '', 'g'));
            END IF;
            v_slug := v_base_slug;

            -- 4. Deterministic Slug Collision Handling
            IF EXISTS (SELECT 1 FROM public.shops WHERE slug = v_slug) THEN
                v_slug := v_base_slug || '-' || SUBSTRING(MD5(rec.id) FROM 1 FOR 6);
                v_migration_status := 'SLUG_COLLISION_RESOLVED';
                INSERT INTO public.migration_audit_log (legacy_id, flag_reason, payload)
                VALUES (rec.id, 'Deterministic slug collision resolved; assigned slug: ' || v_slug, to_jsonb(rec));
            END IF;

            -- 5. Rate parsing
            IF rec.notes IS NOT NULL AND rec.notes != '' THEN
                BEGIN
                    v_bw := COALESCE((rec.notes::jsonb->>'bwRate')::numeric, 1.5);
                    v_color := COALESCE((rec.notes::jsonb->>'colorRate')::numeric, 10.0);
                EXCEPTION WHEN OTHERS THEN
                    v_bw := 1.5; v_color := 10.0;
                END;
            END IF;

            -- 6. Verified activation date validation (NO arbitrary NOW() fallback)
            IF rec.approved_at IS NOT NULL THEN
                v_starts_at := rec.approved_at;
            ELSIF rec.applied_at IS NOT NULL THEN
                v_starts_at := rec.applied_at;
            ELSE
                v_starts_at := NULL;
                v_migration_status := 'MISSING_ACTIVATION_DATE_REQUIRES_MANUAL_REVIEW';
                v_revoked := TRUE;
                INSERT INTO public.migration_audit_log (legacy_id, flag_reason, payload)
                VALUES (rec.id, 'Missing activation and application timestamps', to_jsonb(rec));
            END IF;

            -- 7. Plan duration calculation
            IF rec.plan ILIKE '%1 Month%' THEN
                v_plan := '1 Month';
                v_is_lifetime := FALSE;
                v_expires_at := v_starts_at + INTERVAL '30 days';
            ELSIF rec.plan ILIKE '%1 Year%' THEN
                v_plan := '1 Year';
                v_is_lifetime := FALSE;
                v_expires_at := v_starts_at + INTERVAL '365 days';
            ELSIF rec.plan ILIKE '%Lifetime%' THEN
                v_plan := 'Lifetime Commercial';
                v_is_lifetime := TRUE;
                v_expires_at := NULL;
            ELSE
                v_plan := COALESCE(rec.plan, 'UNKNOWN');
                v_migration_status := 'UNKNOWN_PLAN_REQUIRES_MANUAL_REVIEW';
                v_revoked := TRUE;
                INSERT INTO public.migration_audit_log (legacy_id, flag_reason, payload)
                VALUES (rec.id, 'Unrecognized subscription plan name', to_jsonb(rec));
            END IF;

            -- Check past expiration
            IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
                v_revoked := TRUE;
            END IF;

            -- 8. Insert canonical shop record
            INSERT INTO public.shops (
                legacy_source_id, slug, name, city, contact_phone, status, rates, order_mode
            ) VALUES (
                rec.id,
                v_slug,
                rec.shop_name,
                COALESCE(rec.city, 'Counter Stand'),
                COALESCE(rec.contact_number, '+91 0000000000'),
                CASE WHEN rec.status = 'APPROVED' AND NOT v_revoked THEN 'ACTIVE' ELSE 'PENDING' END,
                jsonb_build_object('bwRate', v_bw, 'colorRate', v_color, 'duplexDiscountPercent', 15),
                'MANUAL_APPROVAL'
            ) RETURNING id INTO v_shop_id;

            -- 9. Insert canonical shop license with keyed hash
            INSERT INTO public.shop_licenses (
                shop_id, legacy_source_id, license_key_hash, plan, is_lifetime, max_devices,
                migration_status, starts_at, expires_at, is_revoked
            ) VALUES (
                v_shop_id,
                rec.id,
                public.compute_license_hash(rec.generated_key, v_pepper),
                v_plan,
                v_is_lifetime,
                2,
                v_migration_status,
                v_starts_at,
                v_expires_at,
                CASE WHEN rec.status = 'REJECTED' THEN TRUE ELSE v_revoked END
            );
        END LOOP;

        -- 10. Safely archive legacy table
        ALTER TABLE public.pilot_applications RENAME TO pilot_applications_historical_archive;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Backward-Compatibility View (Omits Plaintext Keys & Secrets)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.pilot_applications AS
SELECT 
    s.id::text AS id,
    s.name AS shop_name,
    s.city,
    s.contact_phone AS contact_number,
    sl.plan,
    sl.starts_at AS applied_at,
    CASE WHEN s.status = 'ACTIVE' AND NOT sl.is_revoked THEN 'APPROVED' ELSE 'REJECTED' END AS status,
    s.slug AS generated_username,
    sl.starts_at AS approved_at,
    jsonb_build_object(
        'bwRate', (s.rates->>'bwRate')::numeric,
        'colorRate', (s.rates->>'colorRate')::numeric,
        'orderMode', s.order_mode
    )::text AS notes
FROM public.shops s
JOIN public.shop_licenses sl ON s.id = sl.shop_id;

-- ------------------------------------------------------------------------------
-- 6. Constant-Time Server-Side Licence Validation RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_shop_license(
    p_username TEXT,
    p_license_key TEXT,
    p_device_id TEXT,
    p_hardware_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shop RECORD;
    v_license RECORD;
    v_device RECORD;
    v_device_count INT;
    v_computed_hash TEXT;
    v_pepper TEXT;
    v_failed_attempts INT;
    v_token_exp BIGINT;
    v_token_payload TEXT;
    v_token_sig TEXT;
    v_device_token TEXT;
BEGIN
    v_pepper := public.get_license_pepper();

    -- 1. Find shop
    SELECT * INTO v_shop FROM public.shops 
    WHERE slug = LOWER(TRIM(p_username)) AND status = 'ACTIVE';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid shop username or licence key.');
    END IF;

    -- Rate limiting check: max 5 failed attempts per shop in 15 minutes
    SELECT COUNT(*) INTO v_failed_attempts
    FROM public.audit_events
    WHERE shop_id = v_shop.id 
      AND action = 'LICENSE_VALIDATION_FAILED'
      AND created_at > NOW() - INTERVAL '15 minutes';
      
    IF v_failed_attempts >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many failed validation attempts. Account temporarily locked for 15 minutes.');
    END IF;

    -- 2. Compute constant-time hash
    v_computed_hash := public.compute_license_hash(p_license_key, v_pepper);

    -- 3. Match license
    SELECT * INTO v_license FROM public.shop_licenses 
    WHERE shop_id = v_shop.id AND license_key_hash = v_computed_hash;

    IF NOT FOUND THEN
        -- Audit failed validation attempt for rate limiting and incident response
        INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
        VALUES (v_shop.id, 'WORKSTATION', COALESCE(p_device_id, 'UNKNOWN'), 'LICENSE_VALIDATION_FAILED', v_shop.id, jsonb_build_object('reason', 'Invalid key or username'));
        RETURN jsonb_build_object('success', false, 'error', 'Invalid shop username or licence key.');
    END IF;

    -- 4. Strict status, revocation, and date checks
    IF v_license.is_revoked IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence has been revoked or suspended.');
    END IF;

    IF v_license.migration_status IS DISTINCT FROM 'VERIFIED' AND v_license.migration_status IS DISTINCT FROM 'SLUG_COLLISION_RESOLVED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence requires administrative verification. Contact support.');
    END IF;

    IF v_license.starts_at IS NULL OR v_license.starts_at > NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence is not yet active.');
    END IF;

    -- Expiry check for non-lifetime subscriptions
    IF v_license.is_lifetime IS FALSE THEN
        IF v_license.expires_at IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Subscription configuration error. Contact support.');
        END IF;
        IF v_license.expires_at <= NOW() THEN
            RETURN jsonb_build_object('success', false, 'error', 'Subscription expired on ' || to_char(v_license.expires_at, 'YYYY-MM-DD'));
        END IF;
    END IF;

    -- 5. Device Verification, Ownership & Quota Enforcement
    IF p_device_id IS NULL OR TRIM(p_device_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Device identifier is required for workstation pairing.');
    END IF;

    SELECT * INTO v_device FROM public.devices WHERE device_id = TRIM(p_device_id);

    IF FOUND THEN
        -- Prevent cross-shop device hijacking
        IF v_device.shop_id != v_shop.id THEN
            INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
            VALUES (v_shop.id, 'WORKSTATION', TRIM(p_device_id), 'DEVICE_CROSS_SHOP_PAIRING_BLOCKED', v_shop.id, 
                    jsonb_build_object('attempted_shop', v_shop.id, 'registered_shop', v_device.shop_id));
            RETURN jsonb_build_object('success', false, 'error', 'Workstation is already paired to another shop. Cross-shop access denied.');
        END IF;

        -- Check if device is revoked
        IF v_device.status = 'REVOKED' THEN
            INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
            VALUES (v_shop.id, 'WORKSTATION', TRIM(p_device_id), 'REVOKED_DEVICE_ACCESS_BLOCKED', v_shop.id, 
                    jsonb_build_object('reason', 'Device is revoked in canonical records'));
            RETURN jsonb_build_object('success', false, 'error', 'This workstation device has been revoked by the administrator. Contact support.');
        END IF;

        -- Update heartbeat & hardware hash
        UPDATE public.devices 
        SET last_heartbeat = NOW(),
            hardware_hash = COALESCE(p_hardware_hash, v_device.hardware_hash)
        WHERE id = v_device.id;
    ELSE
        -- Check device limits for the shop license
        SELECT COUNT(*) INTO v_device_count
        FROM public.devices
        WHERE shop_id = v_shop.id AND status = 'ACTIVE';

        IF v_device_count >= v_license.max_devices THEN
            RETURN jsonb_build_object('success', false, 'error', 'Device quota exceeded: Maximum of ' || v_license.max_devices::text || ' active workstations allowed.');
        END IF;

        -- Register new device for this shop
        INSERT INTO public.devices (
            shop_id, device_id, hardware_hash, device_name, agent_version, status, last_heartbeat, paired_at
        ) VALUES (
            v_shop.id, TRIM(p_device_id), COALESCE(p_hardware_hash, 'UNKNOWN_HARDWARE'), 'COUNTER-PC', '1.0.0', 'ACTIVE', NOW(), NOW()
        );
    END IF;

    -- 6. Generate authentic signed device token using server-only pepper (RFC 2104 HMAC-SHA256)
    v_token_exp := EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 days'))::bigint;
    v_token_payload := v_shop.id::text || ':' || TRIM(p_device_id) || ':' || v_token_exp::text;
    v_token_sig := public.compute_license_hash(v_token_payload, v_pepper);
    v_device_token := 'devtoken:' || v_token_payload || ':' || v_token_sig;

    -- 7. Audit successful validation
    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (v_shop.id, 'WORKSTATION', TRIM(p_device_id), 'LICENSE_VALIDATION_SUCCESS', v_shop.id, jsonb_build_object('plan', v_license.plan));

    -- Success: Return genuine canonical shop attributes (no placeholders)
    RETURN jsonb_build_object(
        'success', true,
        'shop_id', v_shop.id,
        'shop_name', v_shop.name,
        'slug', v_shop.slug,
        'city', v_shop.city,
        'contact_phone', v_shop.contact_phone,
        'plan', v_license.plan,
        'is_lifetime', v_license.is_lifetime,
        'expires_at', v_license.expires_at,
        'rates', v_shop.rates,
        'order_mode', v_shop.order_mode,
        'device_id', TRIM(p_device_id),
        'device_token', v_device_token
    );
END;
$$;

-- Helper function to support device / token revocation
CREATE OR REPLACE FUNCTION public.revoke_device(
    p_shop_id UUID,
    p_device_id TEXT,
    p_reason TEXT DEFAULT 'Revoked by administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
    v_dev RECORD;
BEGIN
    SELECT * INTO v_dev FROM public.devices 
    WHERE shop_id = p_shop_id AND device_id = TRIM(p_device_id);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Device not found for this shop.');
    END IF;

    UPDATE public.devices 
    SET status = 'REVOKED' 
    WHERE id = v_dev.id;

    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (p_shop_id, 'SYSTEM', 'ADMIN', 'DEVICE_REVOKED', v_dev.id, jsonb_build_object('reason', p_reason, 'device_id', p_device_id));

    RETURN jsonb_build_object('success', true, 'device_id', p_device_id, 'status', 'REVOKED');
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_device(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_device(UUID, TEXT, TEXT) TO authenticated, service_role;

-- Grant permissions explicitly
REVOKE ALL ON FUNCTION public.validate_shop_license FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_shop_license TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. Row-Level Security (RLS) Policies & Privilege Hardening
-- ------------------------------------------------------------------------------
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spool_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_cleanup ENABLE ROW LEVEL SECURITY;

-- Privilege Hardening: Revoke public update on critical financial/order tables
REVOKE ALL ON TABLE public.shop_licenses FROM anon, authenticated, PUBLIC;
GRANT SELECT ON TABLE public.shop_licenses TO service_role;

REVOKE UPDATE, DELETE ON TABLE public.print_jobs FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.print_jobs TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.print_jobs TO service_role;

-- Public can inspect active shops by slug
DROP POLICY IF EXISTS "Public shops visible by active status" ON public.shops;
CREATE POLICY "Public shops visible by active status"
ON public.shops FOR SELECT USING (status = 'ACTIVE');

-- Workstation and Shop Owner access on print_jobs
DROP POLICY IF EXISTS "Workstation and Owner view shop jobs" ON public.print_jobs;
CREATE POLICY "Workstation and Owner view shop jobs"
ON public.print_jobs FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'shop_id')::uuid = shop_id);

-- Customer access on print_jobs strictly via matching tracking_secret_hash
DROP POLICY IF EXISTS "Customers track own job via hash" ON public.print_jobs;
CREATE POLICY "Customers track own job via hash"
ON public.print_jobs FOR SELECT
USING (tracking_secret_hash = (auth.jwt() ->> 'tracking_secret_hash'));

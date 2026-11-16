-- Enforce one active workstation per station license and retain its Windows name.
ALTER TABLE public.shop_licenses
    ADD COLUMN IF NOT EXISTS bound_device_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bound_device_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS binding_updated_at TIMESTAMPTZ;

ALTER TABLE public.shop_licenses
    ALTER COLUMN max_devices SET DEFAULT 1;

UPDATE public.shop_licenses
SET max_devices = 1;

WITH single_active_devices AS (
    SELECT shop_id, MIN(device_id) AS device_id, MIN(device_name) AS device_name
    FROM public.devices
    WHERE status = 'ACTIVE'
    GROUP BY shop_id
    HAVING COUNT(*) = 1
)
UPDATE public.shop_licenses AS sl
SET bound_device_id = d.device_id,
    bound_device_name = d.device_name,
    binding_updated_at = NOW()
FROM single_active_devices AS d
WHERE sl.shop_id = d.shop_id
  AND sl.bound_device_id IS NULL;

DROP FUNCTION IF EXISTS public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.validate_shop_license(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.validate_shop_license(
    p_username TEXT,
    p_license_key TEXT,
    p_device_id TEXT,
    p_hardware_hash TEXT,
    p_device_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shop RECORD;
    v_license RECORD;
    v_device RECORD;
    v_active_device_count INT;
    v_existing_device_id TEXT;
    v_existing_device_name TEXT;
    v_computed_hash TEXT;
    v_pepper TEXT;
    v_failed_attempts INT;
    v_token_exp BIGINT;
    v_token_payload TEXT;
    v_token_sig TEXT;
    v_device_token TEXT;
    v_device_name TEXT;
BEGIN
    v_pepper := public.get_license_pepper();

    SELECT * INTO v_shop
    FROM public.shops
    WHERE slug = LOWER(TRIM(p_username)) AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid shop username or licence key.');
    END IF;

    SELECT COUNT(*) INTO v_failed_attempts
    FROM public.audit_events
    WHERE shop_id = v_shop.id
      AND action = 'LICENSE_VALIDATION_FAILED'
      AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_failed_attempts >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many failed validation attempts. Account temporarily locked for 15 minutes.');
    END IF;

    v_computed_hash := public.compute_license_hash(p_license_key, v_pepper);

    SELECT * INTO v_license
    FROM public.shop_licenses
    WHERE shop_id = v_shop.id AND license_key_hash = v_computed_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
        VALUES (
            v_shop.id,
            'WORKSTATION',
            COALESCE(p_device_id, 'UNKNOWN'),
            'LICENSE_VALIDATION_FAILED',
            v_shop.id,
            jsonb_build_object('reason', 'Invalid key or username')
        );
        RETURN jsonb_build_object('success', false, 'error', 'Invalid shop username or licence key.');
    END IF;

    IF v_license.is_revoked IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence has been revoked or suspended.');
    END IF;

    IF v_license.migration_status NOT IN ('VERIFIED', 'SLUG_COLLISION_RESOLVED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence requires administrative verification. Contact support.');
    END IF;

    IF v_license.starts_at IS NULL OR v_license.starts_at > NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Licence is not yet active.');
    END IF;

    IF v_license.is_lifetime IS FALSE THEN
        IF v_license.expires_at IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Subscription configuration error. Contact support.');
        END IF;
        IF v_license.expires_at <= NOW() THEN
            RETURN jsonb_build_object('success', false, 'error', 'Subscription expired on ' || to_char(v_license.expires_at, 'YYYY-MM-DD'));
        END IF;
    END IF;

    IF p_device_id IS NULL OR TRIM(p_device_id) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Device identifier is required for workstation pairing.');
    END IF;

    SELECT COUNT(*), MIN(device_id), MIN(device_name)
    INTO v_active_device_count, v_existing_device_id, v_existing_device_name
    FROM public.devices
    WHERE shop_id = v_shop.id AND status = 'ACTIVE';

    IF v_license.bound_device_id IS NOT NULL
       AND v_license.bound_device_id <> TRIM(p_device_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DEVICE_ALREADY_BOUND',
            'error', 'This license is already logged in on ' || COALESCE(v_license.bound_device_name, 'another workstation') || '.',
            'existing_device_name', v_license.bound_device_name
        );
    END IF;

    IF v_license.bound_device_id IS NULL AND v_active_device_count > 1 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MULTIPLE_EXISTING_DEVICES',
            'error', 'This license has multiple paired workstations. Ask the Super Admin to reset the PC binding.'
        );
    END IF;

    IF v_license.bound_device_id IS NULL AND v_active_device_count = 1 THEN
        UPDATE public.shop_licenses
        SET bound_device_id = v_existing_device_id,
            bound_device_name = v_existing_device_name,
            binding_updated_at = NOW()
        WHERE id = v_license.id;

        IF v_existing_device_id <> TRIM(p_device_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'DEVICE_ALREADY_BOUND',
                'error', 'This license is already logged in on ' || COALESCE(v_existing_device_name, 'another workstation') || '.',
                'existing_device_name', v_existing_device_name
            );
        END IF;
    END IF;

    SELECT * INTO v_device
    FROM public.devices
    WHERE device_id = TRIM(p_device_id);

    IF FOUND THEN
        IF v_device.shop_id <> v_shop.id THEN
            INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
            VALUES (
                v_shop.id,
                'WORKSTATION',
                TRIM(p_device_id),
                'DEVICE_CROSS_SHOP_PAIRING_BLOCKED',
                v_shop.id,
                jsonb_build_object('attempted_shop', v_shop.id, 'registered_shop', v_device.shop_id)
            );
            RETURN jsonb_build_object('success', false, 'error', 'Workstation is already paired to another shop. Cross-shop access denied.');
        END IF;

        IF v_device.status = 'REVOKED' AND v_license.bound_device_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'This workstation device has been revoked by the administrator. Contact support.');
        END IF;
    END IF;

    v_device_name := NULLIF(TRIM(p_device_name), '');
    IF v_device_name IS NULL THEN
        v_device_name := COALESCE(v_license.bound_device_name, 'Workstation');
        IF FOUND THEN
            v_device_name := COALESCE(v_license.bound_device_name, v_device.device_name, 'Workstation');
        END IF;
    END IF;

    IF FOUND THEN
        UPDATE public.devices
        SET hardware_hash = COALESCE(NULLIF(p_hardware_hash, ''), hardware_hash),
            device_name = v_device_name,
            status = 'ACTIVE',
            last_heartbeat = NOW()
        WHERE id = v_device.id;
    ELSE
        INSERT INTO public.devices (
            shop_id, device_id, hardware_hash, device_name, agent_version, status, last_heartbeat, paired_at
        ) VALUES (
            v_shop.id,
            TRIM(p_device_id),
            COALESCE(NULLIF(p_hardware_hash, ''), 'UNKNOWN_HARDWARE'),
            v_device_name,
            '1.0.0',
            'ACTIVE',
            NOW(),
            NOW()
        );
    END IF;

    UPDATE public.shop_licenses
    SET bound_device_id = TRIM(p_device_id),
        bound_device_name = v_device_name,
        binding_updated_at = NOW()
    WHERE id = v_license.id;

    v_token_exp := EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 days'))::bigint;
    v_token_payload := v_shop.id::text || ':' || TRIM(p_device_id) || ':' || v_token_exp::text;
    v_token_sig := public.compute_license_hash(v_token_payload, v_pepper);
    v_device_token := 'devtoken:' || v_token_payload || ':' || v_token_sig;

    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (
        v_shop.id,
        'WORKSTATION',
        TRIM(p_device_id),
        'LICENSE_VALIDATION_SUCCESS',
        v_shop.id,
        jsonb_build_object('plan', v_license.plan)
    );

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
        'device_name', v_device_name,
        'device_token', v_device_token
    );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_station_superadmin(
    p_admin_username TEXT,
    p_admin_key TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_pepper TEXT;
    v_admin_username TEXT;
    v_admin_key TEXT;
BEGIN
    v_pepper := public.get_license_pepper();

    IF to_regclass('public.pilot_applications_historical_archive') IS NOT NULL THEN
        EXECUTE
            'SELECT generated_username, generated_key
             FROM public.pilot_applications_historical_archive
             WHERE id = $1'
        INTO v_admin_username, v_admin_key
        USING 'APP-ADMIN-MASTER-ROOT';
    END IF;

    IF v_admin_key IS NULL
       AND EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'pilot_applications'
             AND column_name = 'generated_key'
       ) THEN
        EXECUTE
            'SELECT generated_username, generated_key
             FROM public.pilot_applications
             WHERE id = $1'
        INTO v_admin_username, v_admin_key
        USING 'APP-ADMIN-MASTER-ROOT';
    END IF;

    IF v_admin_key IS NULL
       OR LOWER(TRIM(COALESCE(p_admin_username, ''))) NOT IN (
           LOWER(COALESCE(v_admin_username, 'admin')),
           'admin'
       )
       OR public.compute_license_hash(COALESCE(p_admin_key, ''), v_pepper)
          IS DISTINCT FROM public.compute_license_hash(v_admin_key, v_pepper) THEN
        RETURN NULL;
    END IF;

    RETURN COALESCE(v_admin_username, 'admin');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_station_superadmin(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reset_shop_device_binding(
    p_username TEXT,
    p_license_key TEXT,
    p_admin_username TEXT,
    p_admin_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_pepper TEXT;
    v_admin_username TEXT;
    v_shop_id UUID;
BEGIN
    v_pepper := public.get_license_pepper();
    v_admin_username := public.verify_station_superadmin(p_admin_username, p_admin_key);
    IF v_admin_username IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Super Admin verification failed. Sign in again and retry.');
    END IF;

    SELECT s.id INTO v_shop_id
    FROM public.shops AS s
    JOIN public.shop_licenses AS sl ON sl.shop_id = s.id
    WHERE s.slug = LOWER(TRIM(p_username))
      AND sl.license_key_hash = public.compute_license_hash(p_license_key, v_pepper)
    FOR UPDATE OF sl;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shop license was not found. The binding was not reset.');
    END IF;

    UPDATE public.devices
    SET status = 'REVOKED'
    WHERE shop_id = v_shop_id AND status = 'ACTIVE';

    UPDATE public.shop_licenses
    SET bound_device_id = NULL,
        bound_device_name = NULL,
        binding_updated_at = NULL
    WHERE shop_id = v_shop_id;

    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (
        v_shop_id,
        'SYSTEM',
        COALESCE(v_admin_username, p_admin_username),
        'DEVICE_BINDING_RESET',
        v_shop_id,
        jsonb_build_object('username', LOWER(TRIM(p_username)))
    );

    RETURN jsonb_build_object('success', true, 'message', 'Workstation binding was reset.');
END;
$$;

REVOKE ALL ON FUNCTION public.reset_shop_device_binding(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_shop_device_binding(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.issue_shop_license(
    p_shop_name TEXT,
    p_username TEXT,
    p_license_key TEXT,
    p_plan TEXT,
    p_city TEXT,
    p_contact_phone TEXT,
    p_admin_username TEXT,
    p_admin_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_username TEXT;
    v_pepper TEXT;
    v_username TEXT;
    v_shop_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_is_lifetime BOOLEAN;
BEGIN
    v_admin_username := public.verify_station_superadmin(p_admin_username, p_admin_key);
    IF v_admin_username IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Super Admin verification failed. Sign in again and retry.');
    END IF;

    v_username := LOWER(TRIM(COALESCE(p_username, '')));
    IF v_username !~ '^[a-z0-9][a-z0-9-]{0,99}$'
       OR NULLIF(TRIM(COALESCE(p_shop_name, '')), '') IS NULL
       OR NULLIF(TRIM(COALESCE(p_license_key, '')), '') IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shop name, username, and license key are required.');
    END IF;

    IF p_plan IS NULL OR p_plan NOT IN ('1 Month', '1 Year', 'Lifetime Commercial') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unsupported license plan.');
    END IF;

    v_is_lifetime := p_plan = 'Lifetime Commercial';
    v_expires_at := CASE
        WHEN p_plan = '1 Month' THEN NOW() + INTERVAL '1 month'
        WHEN p_plan = '1 Year' THEN NOW() + INTERVAL '1 year'
        ELSE NULL
    END;
    v_pepper := public.get_license_pepper();

    BEGIN
        INSERT INTO public.shops (
            slug, name, city, contact_phone, status, rates, order_mode
        ) VALUES (
            v_username,
            TRIM(p_shop_name),
            COALESCE(NULLIF(TRIM(p_city), ''), 'Main Counter'),
            COALESCE(NULLIF(TRIM(p_contact_phone), ''), '+91 0000000000'),
            'ACTIVE',
            '{"bwRate": 1.5, "colorRate": 10.0, "duplexDiscountPercent": 15}'::jsonb,
            'MANUAL_APPROVAL'
        ) RETURNING id INTO v_shop_id;

        INSERT INTO public.shop_licenses (
            shop_id, license_key_hash, plan, is_lifetime, max_devices,
            migration_status, starts_at, expires_at, is_revoked
        ) VALUES (
            v_shop_id,
            public.compute_license_hash(p_license_key, v_pepper),
            p_plan,
            v_is_lifetime,
            1,
            'VERIFIED',
            NOW(),
            v_expires_at,
            FALSE
        );
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'That username or license key is already in use.');
    END;

    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (
        v_shop_id,
        'SYSTEM',
        v_admin_username,
        'LICENSE_ISSUED',
        v_shop_id,
        jsonb_build_object('username', v_username, 'plan', p_plan)
    );

    RETURN jsonb_build_object(
        'success', true,
        'shop_id', v_shop_id,
        'slug', v_username,
        'plan', p_plan,
        'is_lifetime', v_is_lifetime,
        'expires_at', v_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.activate_shop_license(
    p_shop_id UUID,
    p_username TEXT,
    p_license_key TEXT,
    p_plan TEXT,
    p_admin_username TEXT,
    p_admin_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_username TEXT;
    v_pepper TEXT;
    v_username TEXT;
    v_shop RECORD;
    v_expires_at TIMESTAMPTZ;
    v_is_lifetime BOOLEAN;
BEGIN
    v_admin_username := public.verify_station_superadmin(p_admin_username, p_admin_key);
    IF v_admin_username IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Super Admin verification failed. Sign in again and retry.');
    END IF;

    v_username := LOWER(TRIM(COALESCE(p_username, '')));
    IF v_username !~ '^[a-z0-9][a-z0-9-]{0,99}$'
       OR NULLIF(TRIM(COALESCE(p_license_key, '')), '') IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username and license key are required.');
    END IF;

    IF p_plan IS NULL OR p_plan NOT IN ('1 Month', '1 Year', 'Lifetime Commercial') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unsupported license plan.');
    END IF;

    v_is_lifetime := p_plan = 'Lifetime Commercial';
    v_expires_at := CASE
        WHEN p_plan = '1 Month' THEN NOW() + INTERVAL '1 month'
        WHEN p_plan = '1 Year' THEN NOW() + INTERVAL '1 year'
        ELSE NULL
    END;
    v_pepper := public.get_license_pepper();

    SELECT * INTO v_shop
    FROM public.shops
    WHERE id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application shop was not found in the central license database.');
    END IF;

    PERFORM 1
    FROM public.shop_licenses
    WHERE shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application license record was not found in the central database.');
    END IF;

    BEGIN
        UPDATE public.shops
        SET slug = v_username,
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = p_shop_id;

        UPDATE public.shop_licenses
        SET license_key_hash = public.compute_license_hash(p_license_key, v_pepper),
            plan = p_plan,
            is_lifetime = v_is_lifetime,
            max_devices = 1,
            migration_status = 'VERIFIED',
            starts_at = NOW(),
            expires_at = v_expires_at,
            is_revoked = FALSE,
            bound_device_id = NULL,
            bound_device_name = NULL,
            binding_updated_at = NULL,
            updated_at = NOW()
        WHERE shop_id = p_shop_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'That username or license key is already in use.');
    END;

    UPDATE public.devices
    SET status = 'REVOKED'
    WHERE shop_id = p_shop_id AND status = 'ACTIVE';

    INSERT INTO public.audit_events (shop_id, actor_type, actor_id, action, entity_id, payload)
    VALUES (
        p_shop_id,
        'SYSTEM',
        v_admin_username,
        'LICENSE_ACTIVATED',
        p_shop_id,
        jsonb_build_object('username', v_username, 'plan', p_plan)
    );

    RETURN jsonb_build_object(
        'success', true,
        'shop_id', p_shop_id,
        'slug', v_username,
        'plan', p_plan,
        'is_lifetime', v_is_lifetime,
        'expires_at', v_expires_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_shop_license(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_shop_license(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- RESTORE PILOT_APPLICATIONS & LICENSE VALIDATION RPC FOR WORKSTATION
-- Target Database: "printexpress" Supabase Project (ygwkvylthtzuoygkhmeu)
-- ==============================================================================

-- 1. Create pilot_applications table required by Workstation Admin & Station Manager
CREATE TABLE IF NOT EXISTS public.pilot_applications (
    id TEXT PRIMARY KEY,
    shop_name TEXT,
    city TEXT,
    contact_number TEXT,
    plan TEXT,
    status TEXT DEFAULT 'APPROVED',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    generated_username TEXT,
    generated_key TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 2. Grant permissions to PostgREST roles (anon, authenticated, service_role)
GRANT ALL ON TABLE public.pilot_applications TO anon, authenticated, service_role;

-- 3. Row Level Security (RLS) Policy for Workstation Client access
ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workstation_pilot_applications_access" ON public.pilot_applications;
CREATE POLICY "workstation_pilot_applications_access"
ON public.pilot_applications
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. Seed Super Admin Master Credential
INSERT INTO public.pilot_applications (
    id,
    shop_name,
    city,
    contact_number,
    plan,
    status,
    applied_at,
    generated_username,
    generated_key,
    approved_at,
    notes
) VALUES (
    'APP-ADMIN-MASTER-ROOT',
    'Print Bot Platform Central',
    'Chennai',
    '+910000000000',
    'PLATFORM_ADMIN',
    'APPROVED',
    NOW(),
    'admin',
    'PB-SUPERADMIN-2026',
    NOW(),
    '{"role":"SUPER_ADMIN","privilege":"ELEVATED"}'
)
ON CONFLICT (id) DO UPDATE SET
    generated_username = EXCLUDED.generated_username,
    generated_key = EXCLUDED.generated_key;

-- 5. RPC: validate_shop_license (Used by Workstation Station Login)
DROP FUNCTION IF EXISTS public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.validate_shop_license(
    p_username TEXT,
    p_license_key TEXT,
    p_device_id TEXT,
    p_hardware_hash TEXT,
    p_device_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record
    FROM public.pilot_applications
    WHERE LOWER(TRIM(generated_username)) = LOWER(TRIM(p_username))
      AND UPPER(TRIM(generated_key)) = UPPER(TRIM(p_license_key))
      AND status = 'APPROVED';

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'shop_id', v_record.id,
            'shop_name', v_record.shop_name,
            'slug', v_record.generated_username,
            'device_id', p_device_id,
            'device_name', COALESCE(p_device_name, 'Workstation 1'),
            'device_token', 'DEV_TOK_' || encode(gen_random_bytes(16), 'hex')
        );
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid shop username or licence key.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 6. RPC: issue_shop_license (Used by Admin Center Key Generator)
DROP FUNCTION IF EXISTS public.issue_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.issue_shop_license(
    p_shop_name TEXT,
    p_username TEXT,
    p_license_key TEXT,
    p_plan TEXT,
    p_city TEXT DEFAULT 'Main Counter',
    p_contact_phone TEXT DEFAULT '',
    p_admin_username TEXT DEFAULT 'admin',
    p_admin_key TEXT DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app_id TEXT;
    v_expiry TEXT;
BEGIN
    v_app_id := 'APP-' || UPPER(substr(md5(random()::text), 1, 8));
    
    IF p_plan = '1 Month' THEN
        v_expiry := (NOW() + INTERVAL '30 days')::date::text;
    ELSIF p_plan = '1 Year' THEN
        v_expiry := (NOW() + INTERVAL '1 year')::date::text;
    ELSE
        v_expiry := (NOW() + INTERVAL '50 years')::date::text;
    END IF;

    INSERT INTO public.pilot_applications (
        id,
        shop_name,
        city,
        contact_number,
        plan,
        status,
        applied_at,
        generated_username,
        generated_key,
        approved_at,
        notes
    ) VALUES (
        v_app_id,
        p_shop_name,
        p_city,
        p_contact_phone,
        p_plan,
        'APPROVED',
        NOW(),
        LOWER(TRIM(p_username)),
        UPPER(TRIM(p_license_key)),
        NOW(),
        '{"auto_generated":true}'
    );

    RETURN jsonb_build_object(
        'success', true,
        'shop_id', v_app_id,
        'is_lifetime', (p_plan = 'Lifetime Commercial'),
        'expires_at', v_expiry
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 7. Add to Realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'pilot_applications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pilot_applications;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;


-- ==============================================================================
-- UPDATE LICENSE RPC TO GENERATE VALID WORKSTATION DEVICE TOKEN
-- Target Database: "printexpress" Supabase Project (ygwkvylthtzuoygkhmeu)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    v_exp BIGINT;
    v_sig TEXT;
    v_token TEXT;
BEGIN
    SELECT * INTO v_record
    FROM public.pilot_applications
    WHERE LOWER(TRIM(generated_username)) = LOWER(TRIM(p_username))
      AND UPPER(TRIM(generated_key)) = UPPER(TRIM(p_license_key))
      AND status = 'APPROVED';

    IF FOUND THEN
        -- Generate valid 5-part delimited device token expected by Rust native workstation:
        -- Format: devtoken:<shop_id>:<device_id>:<expiry_timestamp>:<signature>
        v_exp := EXTRACT(EPOCH FROM (NOW() + INTERVAL '365 days'))::BIGINT;
        v_sig := encode(digest(v_record.id || ':' || TRIM(p_device_id) || ':' || v_exp::text, 'sha256'), 'hex');
        v_token := 'devtoken:' || v_record.id || ':' || TRIM(p_device_id) || ':' || v_exp::text || ':' || v_sig;

        RETURN jsonb_build_object(
            'success', true,
            'shop_id', v_record.id,
            'shop_name', v_record.shop_name,
            'slug', v_record.generated_username,
            'device_id', TRIM(p_device_id),
            'device_name', COALESCE(p_device_name, 'Workstation 1'),
            'device_token', v_token
        );
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid shop username or licence key.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_shop_license(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;


BEGIN;

DO $$
BEGIN
    IF to_regclass('public.test_orders') IS NOT NULL
        OR to_regclass('public.test_payment_events') IS NOT NULL
        OR to_regclass('public.test_workstation_memberships') IS NOT NULL THEN
        RAISE EXCEPTION 'Staging test tables already exist. Stop and review the test project schema before applying this migration.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('create_test_order', 'finalize_test_payment')
    ) THEN
        RAISE EXCEPTION 'Staging payment RPC names already exist. Stop and review the test project schema before applying this migration.';
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.shops') IS NULL THEN
        CREATE TABLE public.shops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            city VARCHAR(100) NOT NULL DEFAULT '',
            contact_phone VARCHAR(50) NOT NULL DEFAULT '',
            status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
            rates JSONB NOT NULL DEFAULT
                '{"bwRate": 1.5, "colorRate": 10.0, "duplexDiscountPercent": 15}'::jsonb,
            order_mode VARCHAR(50) NOT NULL DEFAULT 'MANUAL_APPROVAL'
                CHECK (order_mode IN ('FULL_AUTOMATIC', 'MANUAL_APPROVAL')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    ELSIF NOT (
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'id' AND data_type = 'uuid')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'slug')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'name')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'city')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'contact_phone')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'status')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'rates')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'order_mode')
    ) THEN
        RAISE EXCEPTION 'Existing public.shops is not compatible with the staging checkout. Stop and review the test project schema.';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.shops
        WHERE slug IS DISTINCT FROM 'test-print-shop'
    ) THEN
        RAISE EXCEPTION 'Unexpected shop rows already exist. Stop and review the test project before applying staging changes.';
    END IF;
END $$;

INSERT INTO public.shops (slug, name, city, contact_phone, status, rates, order_mode)
VALUES (
    'test-print-shop',
    'Print Bot Test Shop',
    'Test Environment',
    '',
    'ACTIVE',
    '{"bwRate": 1.5, "colorRate": 10.0, "duplexDiscountPercent": 15}'::jsonb,
    'MANUAL_APPROVAL'
)
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.shops
        WHERE slug = 'test-print-shop'
          AND name = 'Print Bot Test Shop'
          AND city = 'Test Environment'
          AND contact_phone = ''
          AND status = 'ACTIVE'
          AND order_mode = 'MANUAL_APPROVAL'
          AND rates = '{"bwRate": 1.5, "colorRate": 10.0, "duplexDiscountPercent": 15}'::jsonb
    ) THEN
        RAISE EXCEPTION 'Existing test-print-shop row conflicts with the staging test shop. Stop and review the test project.';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.test_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
    idempotency_key_hash TEXT NOT NULL,
    customer_token_hash TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_mime_type TEXT NOT NULL CHECK (file_mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 2621440),
    document_path TEXT NOT NULL UNIQUE,
    page_count INTEGER NOT NULL CHECK (page_count BETWEEN 1 AND 5000),
    options JSONB NOT NULL,
    quote_hash TEXT NOT NULL,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    status TEXT NOT NULL DEFAULT 'AWAITING_UPLOAD'
        CHECK (status IN ('AWAITING_UPLOAD', 'AWAITING_PAYMENT', 'CREATING_PAYMENT', 'PAID', 'FAILED', 'EXPIRED', 'RECONCILIATION_REQUIRED')),
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    retention_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, idempotency_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_test_orders_shop_queue
    ON public.test_orders (shop_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_orders_retention
    ON public.test_orders (retention_expires_at);

CREATE TABLE IF NOT EXISTS public.test_payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.test_orders(id) ON DELETE CASCADE,
    gateway_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    body_sha256 TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_workstation_memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, shop_id)
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_workstation_memberships ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.test_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.test_payment_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.test_workstation_memberships FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.test_orders TO service_role;
GRANT ALL ON TABLE public.test_payment_events TO service_role;
GRANT ALL ON TABLE public.test_workstation_memberships TO service_role;

REVOKE ALL ON TABLE public.shops FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.shops TO service_role;

DO $$
DECLARE
    bucket_is_public BOOLEAN;
    bucket_file_size_limit BIGINT;
    bucket_allowed_mime_types TEXT[];
BEGIN
    SELECT public, file_size_limit, allowed_mime_types
    INTO bucket_is_public, bucket_file_size_limit, bucket_allowed_mime_types
    FROM storage.buckets
    WHERE id = 'printbot-test-documents';

    IF NOT FOUND THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'printbot-test-documents',
            'printbot-test-documents',
            FALSE,
            2621440,
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        );
    ELSIF bucket_is_public
        OR bucket_file_size_limit IS DISTINCT FROM 2621440
        OR bucket_allowed_mime_types IS DISTINCT FROM ARRAY['application/pdf', 'image/jpeg', 'image/png']::TEXT[] THEN
        RAISE EXCEPTION 'printbot-test-documents exists with incompatible access or upload limits. Stop and review the test project.';
    ELSIF EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'printbot-test-documents'
    ) THEN
        RAISE EXCEPTION 'printbot-test-documents already contains objects. Stop and review the test project.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_test_order(
    p_order_id UUID,
    p_shop_slug TEXT,
    p_idempotency_key_hash TEXT,
    p_customer_token_hash TEXT,
    p_file_name TEXT,
    p_file_mime_type TEXT,
    p_file_size_bytes BIGINT,
    p_document_path TEXT,
    p_page_count INTEGER,
    p_options JSONB,
    p_quote_hash TEXT,
    p_amount_paise INTEGER
)
RETURNS public.test_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shop_id UUID;
    v_order public.test_orders;
BEGIN
    SELECT id INTO v_shop_id
    FROM public.shops
    WHERE slug = p_shop_slug AND status = 'ACTIVE';

    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'active test shop not found';
    END IF;

    INSERT INTO public.test_orders (
        id, shop_id, idempotency_key_hash, customer_token_hash, file_name,
        file_mime_type, file_size_bytes, document_path, page_count, options,
        quote_hash, amount_paise, expires_at
    )
    VALUES (
        p_order_id, v_shop_id, p_idempotency_key_hash, p_customer_token_hash,
        p_file_name, p_file_mime_type, p_file_size_bytes, p_document_path,
        p_page_count, p_options, p_quote_hash, p_amount_paise, NOW() + INTERVAL '15 minutes'
    )
    ON CONFLICT (shop_id, idempotency_key_hash) DO NOTHING;

    SELECT * INTO v_order
    FROM public.test_orders
    WHERE shop_id = v_shop_id AND idempotency_key_hash = p_idempotency_key_hash
    FOR UPDATE;

    IF v_order.customer_token_hash <> p_customer_token_hash
        OR v_order.file_name <> p_file_name
        OR v_order.file_mime_type <> p_file_mime_type
        OR v_order.file_size_bytes <> p_file_size_bytes
        OR v_order.page_count <> p_page_count
        OR v_order.options <> p_options
        OR v_order.quote_hash <> p_quote_hash
        OR v_order.amount_paise <> p_amount_paise
    THEN
        RAISE EXCEPTION 'idempotency key was reused with a different order payload';
    END IF;

    RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_test_payment(
    p_order_id UUID,
    p_gateway_event_id TEXT,
    p_event_type TEXT,
    p_body_sha256 TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_amount_paise INTEGER,
    p_currency TEXT,
    p_captured BOOLEAN
)
RETURNS TABLE (order_status TEXT, event_duplicate BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order public.test_orders;
    v_event public.test_payment_events;
    v_inserted INTEGER;
BEGIN
    SELECT * INTO v_order
    FROM public.test_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'test order not found';
    END IF;
    IF v_order.razorpay_order_id IS NULL OR v_order.razorpay_order_id <> p_razorpay_order_id THEN
        RAISE EXCEPTION 'Razorpay order does not match the stored test order';
    END IF;
    IF v_order.amount_paise <> p_amount_paise OR v_order.currency <> p_currency THEN
        RAISE EXCEPTION 'payment amount or currency does not match the stored test order';
    END IF;
    IF v_order.status NOT IN ('AWAITING_PAYMENT', 'PAID', 'FAILED', 'EXPIRED', 'RECONCILIATION_REQUIRED') THEN
        RAISE EXCEPTION 'test order is not ready to accept a payment event';
    END IF;

    INSERT INTO public.test_payment_events (order_id, gateway_event_id, event_type, body_sha256)
    VALUES (p_order_id, p_gateway_event_id, p_event_type, p_body_sha256)
    ON CONFLICT (gateway_event_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    IF v_inserted = 0 THEN
        SELECT * INTO v_event
        FROM public.test_payment_events
        WHERE gateway_event_id = p_gateway_event_id;
        IF v_event.order_id <> p_order_id
            OR v_event.event_type <> p_event_type
            OR v_event.body_sha256 <> p_body_sha256 THEN
            RAISE EXCEPTION 'gateway event ID was reused with conflicting payment data';
        END IF;
        RETURN QUERY SELECT v_order.status, TRUE;
        RETURN;
    END IF;

    IF v_order.status IN ('PAID', 'FAILED', 'EXPIRED', 'RECONCILIATION_REQUIRED') THEN
        RETURN QUERY SELECT v_order.status, FALSE;
        RETURN;
    END IF;

    IF v_order.expires_at <= NOW() THEN
        UPDATE public.test_orders
        SET status = CASE WHEN p_captured THEN 'RECONCILIATION_REQUIRED' ELSE 'EXPIRED' END,
            razorpay_payment_id = CASE WHEN p_captured THEN p_razorpay_payment_id ELSE razorpay_payment_id END,
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSIF p_captured THEN
        UPDATE public.test_orders
        SET status = 'PAID',
            razorpay_payment_id = p_razorpay_payment_id,
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSIF p_event_type = 'payment.failed' THEN
        UPDATE public.test_orders
        SET status = 'FAILED', updated_at = NOW()
        WHERE id = p_order_id;
    END IF;

    RETURN QUERY
    SELECT o.status, FALSE
    FROM public.test_orders o
    WHERE o.id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_test_order(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, INTEGER, JSONB, TEXT, INTEGER
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_test_order(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, INTEGER, JSONB, TEXT, INTEGER
) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_test_payment(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, BOOLEAN
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_test_payment(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, BOOLEAN
) TO service_role;

COMMIT;

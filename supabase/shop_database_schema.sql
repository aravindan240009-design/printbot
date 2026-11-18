-- ==============================================================================
-- PRINTEXPRESS SHARED SHOP DATABASE SCHEMA
-- Target Database: "printexpress" Supabase Project
-- Purpose: Shared Multi-Tenant Operational Data for all shops with strict shop_id isolation
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. CUSTOMERS TABLE (Scoped per shop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,                        -- Links to shop in Admin DB
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Walk-in Customer',
    notes TEXT DEFAULT '',
    total_orders_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customer_per_shop UNIQUE (shop_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(shop_id, phone_number);

-- ==============================================================================
-- 2. PRINTING PRICES TABLE (Price per page config per shop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.printing_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    paper_size VARCHAR(20) NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4', 'A3', 'LEGAL', 'LETTER')),
    print_type VARCHAR(20) NOT NULL DEFAULT 'BW' CHECK (print_type IN ('BW', 'COLOR')),
    is_duplex BOOLEAN NOT NULL DEFAULT FALSE,      -- Single-sided vs Back-to-Back
    price_per_page_paise INT NOT NULL,            -- e.g. 200 = ₹2.00, 1000 = ₹10.00
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_shop_pricing UNIQUE (shop_id, paper_size, print_type, is_duplex)
);

CREATE INDEX IF NOT EXISTS idx_printing_prices_shop ON public.printing_prices(shop_id, is_active);

-- ==============================================================================
-- 3. ORDERS TABLE (Core shop orders)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    order_number BIGSERIAL,                        -- Sequential tracking number
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_phone VARCHAR(20) NOT NULL DEFAULT '',
    source VARCHAR(50) NOT NULL DEFAULT 'QR_WEB'   -- 'QR_WEB', 'WALK_IN', 'WHATSAPP'
        CHECK (source IN ('QR_WEB', 'WALK_IN', 'WHATSAPP')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED')),
    total_amount_paise BIGINT NOT NULL DEFAULT 0,
    pickup_code VARCHAR(10),                       -- 4-digit code for quick shop counter pickup
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_order_number_per_shop UNIQUE (shop_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON public.orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_shop_created ON public.orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON public.orders(shop_id, pickup_code);

-- ==============================================================================
-- 4. DOCUMENT REFERENCES / ORDER ITEMS TABLE (Files uploaded for printing)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.document_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,                       -- Supabase Storage object path
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    page_count INT NOT NULL DEFAULT 1 CHECK (page_count > 0),
    copies INT NOT NULL DEFAULT 1 CHECK (copies > 0),
    paper_size VARCHAR(20) NOT NULL DEFAULT 'A4',
    print_type VARCHAR(20) NOT NULL DEFAULT 'BW',
    is_duplex BOOLEAN NOT NULL DEFAULT FALSE,
    item_total_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_shop_order ON public.document_references(shop_id, order_id);

-- ==============================================================================
-- 5. PAYMENT RECORDS TABLE (Transactions per shop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL,
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'UPI'
        CHECK (payment_mode IN ('CASH', 'UPI', 'ONLINE_RAZORPAY')),
    gateway_payment_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS'
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_shop ON public.payment_records(shop_id, paid_at DESC);

-- ==============================================================================
-- 6. ORDER HISTORY / AUDIT LOG (Status transitions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    actor VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',   -- 'CUSTOMER', 'WORKSTATION', 'STAFF', 'SYSTEM'
    message TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_shop_order ON public.order_history(shop_id, order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict shop_id isolation using custom session context or JWT app_metadata
-- ==============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printing_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Helper function to extract current active shop_id from Supabase JWT claims or local app variable
CREATE OR REPLACE FUNCTION public.current_shop_id() 
RETURNS UUID AS $$
BEGIN
    -- 1. Try reading from JWT claims (auth.jwt() -> 'app_metadata' -> 'shop_id')
    IF NULLIF(current_setting('request.jwt.claims', true), '') IS NOT NULL THEN
        RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'shop_id')::UUID;
    END IF;

    -- 2. Fallback to session variable set by backend / workstation
    IF NULLIF(current_setting('app.current_shop_id', true), '') IS NOT NULL THEN
        RETURN current_setting('app.current_shop_id', true)::UUID;
    END IF;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RLS Isolation Policy: Only rows where shop_id matches the active shop can be seen/modified
CREATE POLICY rls_customers_shop_isolation ON public.customers
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');

CREATE POLICY rls_prices_shop_isolation ON public.printing_prices
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');

CREATE POLICY rls_orders_shop_isolation ON public.orders
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');

CREATE POLICY rls_documents_shop_isolation ON public.document_references
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');

CREATE POLICY rls_payments_shop_isolation ON public.payment_records
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');

CREATE POLICY rls_order_history_shop_isolation ON public.order_history
    FOR ALL
    USING (shop_id = public.current_shop_id() OR auth.role() = 'service_role')
    WITH CHECK (shop_id = public.current_shop_id() OR auth.role() = 'service_role');


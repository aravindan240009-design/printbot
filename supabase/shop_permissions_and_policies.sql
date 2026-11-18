-- ==============================================================================
-- PRINTEXPRESS SHARED SHOP DATABASE SCHEMA (UPDATED WITH PERMISSIONS & POLICIES)
-- Target Database: "printexpress" Supabase Project (ygwkvylthtzuoygkhmeu)
-- ==============================================================================

-- 1. Grant PostgREST schema and table permissions to anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Drop overly restrictive policies if they exist so we can recreate clean ones
DROP POLICY IF EXISTS rls_prices_public_read ON public.printing_prices;
DROP POLICY IF EXISTS rls_orders_customer_insert ON public.orders;
DROP POLICY IF EXISTS rls_orders_read ON public.orders;
DROP POLICY IF EXISTS rls_documents_customer_insert ON public.document_references;
DROP POLICY IF EXISTS rls_documents_read ON public.document_references;

-- 3. Public / Customer Web Access Policies:
-- Any customer can view active printing prices of shops
CREATE POLICY rls_prices_public_read ON public.printing_prices
    FOR SELECT
    USING (is_active = true);

-- Customers can place/insert new print orders
CREATE POLICY rls_orders_customer_insert ON public.orders
    FOR INSERT
    WITH CHECK (true);

-- Customers / Workstation can read order details
CREATE POLICY rls_orders_read ON public.orders
    FOR SELECT
    USING (true);

-- Customers can attach print files / document references to an order
CREATE POLICY rls_documents_customer_insert ON public.document_references
    FOR INSERT
    WITH CHECK (true);

-- Read documents for order processing
CREATE POLICY rls_documents_read ON public.document_references
    FOR SELECT
    USING (true);


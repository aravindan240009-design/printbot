-- ==============================================================================
-- Print Bot SaaS Phase 1 Safe Data-Preserving Rollback / Recovery Script
-- ==============================================================================
-- NON-DESTRUCTIVE RECOVERY:
-- Never drops tables containing customer orders, physical print queues, or payments.
-- Restores legacy pilot_applications view to point back to the historical archive,
-- and safely revokes incoming writes without destroying business data.
-- ==============================================================================

BEGIN;

-- 1. Restore legacy view to point to historical archive
DROP VIEW IF EXISTS public.pilot_applications;
CREATE OR REPLACE VIEW public.pilot_applications AS 
SELECT * FROM public.pilot_applications_historical_archive;

-- 2. Freeze incoming writes on canonical order and payment tables during incident response
-- (DO NOT DROP TABLES - Preserves all customer records, payments and audit logs intact)
REVOKE INSERT ON public.print_jobs FROM anon, authenticated;
REVOKE INSERT ON public.payments FROM anon, authenticated;

-- 3. If running in a pre-traffic staging/development rollback where no user data exists:
-- Drop newly introduced tables in reverse dependency order (child before parent, NO CASCADE)
-- DROP TABLE IF EXISTS public.dead_letter_cleanup;
-- DROP TABLE IF EXISTS public.idempotency_records;
-- DROP TABLE IF EXISTS public.audit_events;
-- DROP TABLE IF EXISTS public.spool_events;
-- DROP TABLE IF EXISTS public.payments;
-- DROP TABLE IF EXISTS public.print_jobs;
-- DROP TABLE IF EXISTS public.storage_assets;
-- DROP TABLE IF EXISTS public.devices;
-- DROP TABLE IF EXISTS public.shop_licenses;
-- DROP TABLE IF EXISTS public.migration_audit_log;
-- DROP TABLE IF EXISTS public.shops;

COMMIT;

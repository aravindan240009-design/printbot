-- Restore writable public.pilot_applications for website + workstation clients.
--
-- Live symptom: Admin Center shows Cloud Offline / empty applications.
-- Cause: Phase 1 replaced the table with a view over shops/shop_licenses.
-- The anon key received 401 42501 "permission denied for view pilot_applications".
--
-- Run this in the Supabase SQL editor, then click Sync Cloud (or restart the app).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'pilot_applications'
    ) THEN
        DROP VIEW public.pilot_applications;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'pilot_applications_historical_archive'
          AND table_type = 'BASE TABLE'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'pilot_applications'
          AND table_type = 'BASE TABLE'
    ) THEN
        ALTER TABLE public.pilot_applications_historical_archive
            RENAME TO pilot_applications;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pilot_applications (
    id TEXT PRIMARY KEY,
    shop_name TEXT,
    city TEXT,
    contact_number TEXT,
    plan TEXT,
    status TEXT,
    applied_at TIMESTAMPTZ,
    generated_username TEXT,
    generated_key TEXT,
    approved_at TIMESTAMPTZ,
    notes TEXT
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pilot_applications TO anon, authenticated;
GRANT ALL ON TABLE public.pilot_applications TO service_role;

ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "printbot_clients_pilot_applications" ON public.pilot_applications;
CREATE POLICY "printbot_clients_pilot_applications"
ON public.pilot_applications
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

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

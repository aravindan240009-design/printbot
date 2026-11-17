BEGIN;

DROP POLICY IF EXISTS "printbot_clients_pilot_applications"
    ON public.pilot_applications;

REVOKE ALL PRIVILEGES ON TABLE public.pilot_applications
    FROM anon, authenticated;

COMMIT;

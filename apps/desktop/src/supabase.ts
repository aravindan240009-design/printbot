/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://kiseniigikzncpzczurp.supabase.co';

// Desktop Workstation Super Admin client requires administrative authorization to
// delete records, modify pricing plans, and provision shop credentials without RLS restrictions.
const supabaseKey =
  env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc2VuaWlnaWt6bmNwemN6dXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjAwMjQsImV4cCI6MjEwODgzNjAyNH0.QeezKAySr31yrvGgXs9OO8Tj-nX0vdV275RGpfBp-H4';

export const supabase = createClient(supabaseUrl, supabaseKey);



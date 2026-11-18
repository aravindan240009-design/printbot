/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

export const TEST_MODE = import.meta.env.VITE_PRINTBOT_TEST_MODE === 'true';
export const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL || (TEST_MODE ? '' : 'https://ygwkvylthtzuoygkhmeu.supabase.co'),
).trim().replace(/\/+$/, '');

// Desktop client strictly uses public anonymous key. Privileged administrative
// operations are routed exclusively through server-authorized backend endpoints.
export const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || (TEST_MODE ? '' : 'sb_publishable_97nqNuD9ABAXTlyVAL3tEw__PLfnJCi'),
).trim();

if (TEST_MODE && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  throw new Error('Test mode requires the isolated test Supabase URL and public anon key.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

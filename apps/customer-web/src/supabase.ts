/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://ygwkvylthtzuoygkhmeu.supabase.co';

const supabaseKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_97nqNuD9ABAXTlyVAL3tEw__PLfnJCi';

export const supabase = createClient(supabaseUrl, supabaseKey);

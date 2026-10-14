import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Credenciales públicas de Supabase para ELIS 5.0
const DEFAULT_SUPABASE_URL = 'https://jvwotxlpznafkuodyfhg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6mfFgnK1h64UxjBmtK5A2A_rvLygOGC';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

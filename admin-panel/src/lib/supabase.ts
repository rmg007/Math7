import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta.env.MODE === 'test' && import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
  ? import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseAdmin = (import.meta.env.MODE === 'test' && import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
  ? createClient<Database>(supabaseUrl, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

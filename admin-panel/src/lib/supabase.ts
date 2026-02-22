import { env } from '@/config/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabaseUrl = env.supabaseUrl;
export const supabaseKey = env.supabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

import { env } from '@/config/env';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabaseUrl = env.supabaseUrl;
export const supabaseKey = env.supabaseAnonKey;

// Lazy initialization to support test environments where env vars may not be available at import time
let _supabase: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (_supabase) return _supabase;

  // In test/CI environments without proper env vars, create a placeholder client
  // that will fail gracefully when used (tests mock network calls anyway)
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseKey || 'placeholder-key';

  _supabase = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _supabase;
}

// Export a proxy that lazily initializes the client on first access
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return Reflect.get(getSupabaseClient(), prop);
  },
});

import { env } from '@/config/env';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@questerix/core/types/database';

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
      // Enhanced storage handling with fallback
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.warn(`Storage access failed for key ${key}:`, e);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn(`Storage write failed for key ${key}:`, e);
            // Fail silently - session will be lost but app continues to work
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Storage removal failed for key ${key}:`, e);
            // Fail silently
          }
        },
      },
    },
    global: {
      fetch: (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), env.apiTimeout);

        // If options already has a signal (from manual AbortController), we need to handle both.
        // But for simplicity and SSoT reliability, we prioritize the global session timeout
        // while allowing the browser's native fetch to handle the merge if possible.
        return fetch(url, {
          ...options,
          signal: options?.signal || controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      },
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

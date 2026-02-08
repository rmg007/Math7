import { z } from 'zod';

// Server-only env (Node in CI, scripts, or server runtimes). Never import this in browser code.
const ServerEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
});

// Client env (Vite injects import.meta.env.VITE_*)
const ClientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function getServerEnv(src: NodeJS.ProcessEnv = process.env): ServerEnv {
  return ServerEnvSchema.parse({
    SUPABASE_URL: src.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: src.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: src.NODE_ENV as 'development' | 'test' | 'production' | undefined,
  });
}

export function getClientEnv(src: Record<string, unknown> = import.meta.env): ClientEnv {
  return ClientEnvSchema.parse({
    VITE_SUPABASE_URL: src.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: src.VITE_SUPABASE_ANON_KEY,
  });
}

// Convenience combined loader for isomorphic modules that differentiate at call sites
export const env = {
  server: () => getServerEnv(),
  client: () => getClientEnv(),
};

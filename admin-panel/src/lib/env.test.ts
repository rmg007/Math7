import { describe, it, expect } from 'vitest';
import { getServerEnv, getClientEnv } from './env';

describe('env loaders', () => {
  it('validates server env', () => {
    const env = getServerEnv({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'sbp_xxx',
      NODE_ENV: 'test',
    } as Record<string, string>);
    expect(env.SUPABASE_URL).toContain('https://');
  });

  it('throws on invalid server env', () => {
    expect(() => getServerEnv({} as Record<string, string>)).toThrow();
  });

  it('validates client env', () => {
    const env = getClientEnv({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon_xxx',
    });
    expect(env.VITE_SUPABASE_ANON_KEY).toBeTypeOf('string');
  });
});

/**
 * Unit tests for env.ts - Preventative test for import.meta.env issues
 *
 * CONTEXT: On 2026-02-28, E2E tests crashed with "Cannot read properties of undefined
 * (reading 'TEST_VITE_APP_VERSION')" because import.meta.env was undefined in Playwright's
 * Node.js context. This test ensures the env module handles missing import.meta.env gracefully.
 *
 * @see docs/LEARNING_LOG.md - "E2E import.meta.env crash"
 */
import { describe, expect, it } from 'vitest';

describe('env.ts', () => {
  describe('safe import.meta.env access', () => {
    it('should export env object without crashing', async () => {
      const { env } = await import('@/config/env');
      expect(env).toBeDefined();
      expect(typeof env.appVersion).toBe('string');
      expect(typeof env.appName).toBe('string');
      expect(typeof env.mode).toBe('string');
      expect(typeof env.isProduction).toBe('boolean');
      expect(typeof env.isDevelopment).toBe('boolean');
    });

    it('should export getMetaEnv helper', async () => {
      const { getMetaEnv } = await import('@/config/env');
      expect(typeof getMetaEnv).toBe('function');

      // Should not throw when accessing any key
      expect(() => getMetaEnv('VITE_NONEXISTENT_KEY')).not.toThrow();
      expect(() => getMetaEnv('RANDOM_KEY')).not.toThrow();
    });

    it('should export isDevMode helper', async () => {
      const { isDevMode } = await import('@/config/env');
      expect(typeof isDevMode).toBe('function');
      expect(typeof isDevMode()).toBe('boolean');
    });

    it('should provide fallback values for missing env vars', async () => {
      const { env } = await import('@/config/env');

      // These should have fallback values, not undefined
      expect(env.appVersion).not.toBeUndefined();
      expect(env.appName).not.toBeUndefined();
      expect(env.mode).not.toBeUndefined();
    });

    it('should handle validateEnv without crashing', async () => {
      const { validateEnv, env } = await import('@/config/env');

      // In test environment, validateEnv should either pass or throw a clear error
      // It should NOT crash with "Cannot read properties of undefined"
      if (env.supabaseUrl && env.supabaseAnonKey) {
        expect(() => validateEnv()).not.toThrow();
      } else {
        expect(() => validateEnv()).toThrow(/Missing required environment variables/);
      }
    });
  });

  describe('EnvRecord type safety', () => {
    it('getMetaEnv should return string, boolean, or undefined', async () => {
      const { getMetaEnv } = await import('@/config/env');

      const result = getMetaEnv('VITE_APP_VERSION');
      expect(
        result === undefined || typeof result === 'string' || typeof result === 'boolean'
      ).toBe(true);
    });
  });
});

describe('Architecture: No direct import.meta.env access', () => {
  /**
   * This test scans the codebase to ensure no files directly access import.meta.env
   * outside of the env.ts module. All env access should go through the safe helpers.
   */
  it('should not have direct import.meta.env access outside env.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    // @ts-expect-error — glob v7 ships no bundled types; @types/glob is not installed
    const glob = (await import('glob')) as {
      sync: (pattern: string, opts?: { cwd?: string; ignore?: string | string[] }) => string[];
    };

    const srcDir = path.resolve(__dirname, '../../');
    const files = glob.sync('**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: ['**/node_modules/**', '**/__tests__/**', '**/config/env.ts', '**/*.d.ts'],
    });

    const violations: string[] = [];
    const allowedPattern = /import\.meta\.env\.(MODE|DEV|PROD|BASE_URL|SSR)/;
    const directAccessPattern = /import\.meta\.env\.[A-Z_]+/g;

    for (const file of files) {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      const matches = content.match(directAccessPattern);

      if (matches) {
        const badMatches = matches.filter((m) => !allowedPattern.test(m));
        if (badMatches.length > 0) {
          violations.push(`${file}: ${badMatches.join(', ')}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Direct import.meta.env access found outside env.ts!\n` +
          `Use getMetaEnv() or isDevMode() from @/config/env instead.\n\n` +
          `Violations:\n${violations.join('\n')}`
      );
    }
  });
});

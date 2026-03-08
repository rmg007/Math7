/**
 * Playwright Smoke Test Configuration
 *
 * OPTIMIZED for pre-push hooks and CI gates. Runs only essential smoke tests
 * with minimal overhead. Full test suite should run in CI after push.
 *
 * Key optimizations:
 * - Single project (desktop only) - no mobile/tablet variants
 * - Reuses existing auth state if fresh (< 30 min old)
 * - Shorter timeouts for faster failure detection
 * - No video/trace recording (saves ~2s per test)
 * - Parallel workers for read-only tests
 */
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const AUTH_DIR = path.resolve(__dirname, '.auth');
const authState = (role: string) => path.join(AUTH_DIR, `${role}.json`);

// Check if auth state is fresh (< 30 min old)
function isAuthFresh(): boolean {
  const superAdminAuth = authState('super-admin');
  if (!fs.existsSync(superAdminAuth)) return false;

  const stats = fs.statSync(superAdminAuth);
  const ageMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);
  return ageMinutes < 30;
}

export default defineConfig({
  testDir: './tests',
  // Skip global setup if auth is fresh - saves ~10-15 seconds
  globalSetup: isAuthFresh() ? undefined : './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // Smoke tests are read-only, safe to parallelize
  fullyParallel: true,
  workers: 4, // Parallel for speed

  // Shorter timeouts for faster failure detection
  timeout: 30000, // 30 seconds per test (vs 60s in full config)
  expect: {
    timeout: 5000, // 5 seconds for assertions (vs 10s)
  },

  // Minimal reporting for speed
  reporter: [['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    // No trace/video/screenshot - saves significant time
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 10000, // 10s action timeout (vs 15s)
  },

  projects: [
    {
      name: 'smoke',
      // Matches smoke-verify.spec.ts (infra smoke) AND any *.smoke.spec.ts files
      testMatch: [/smoke-verify\.spec\.ts$/, /\.smoke\.spec\.ts$/],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: authState('super-admin'),
      },
    },
  ],

  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5000',
    reuseExistingServer: true, // Always reuse if running
    timeout: 60000, // 1 minute (vs 2 minutes)
  },
});

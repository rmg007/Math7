/**
 * Playwright Global Setup
 *
 * Authenticates once per CI run for each role and saves browser storage state to disk.
 * All E2E tests use these pre-authenticated sessions instead of hitting the login UI.
 *
 * ⚠️  JWT TTL: Supabase JWTs expire. This setup re-authenticates fresh on every run.
 *     Do NOT commit storageState JSON files to git — they contain session cookies.
 *     Set JWT_EXPIRY generously in the test environment (>= 1 hour) to cover long CI runs.
 *
 * ⚠️  Unauthenticated tests (auth-flow, rbac-guards RBAC-003, MENTOR-006) must use:
 *     test.use({ storageState: { cookies: [], origins: [] } })
 *     They live in the 'unauthenticated' Playwright project which has no storageState.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

const ROLES = [
  {
    name: 'super-admin',
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'mhalim80@hotmail.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'mhalim80@hotmail.com',
  },
  {
    name: 'admin',
    email: process.env.TEST_ADMIN_EMAIL || 'testadmin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'testadmin@example.com',
  },
  {
    name: 'mentor',
    email: process.env.TEST_MENTOR_EMAIL || 'testmentor@example.com',
    password: process.env.TEST_MENTOR_PASSWORD || 'testmentor@example.com',
  },
  {
    name: 'student',
    email: process.env.TEST_STUDENT_EMAIL || 'teststudent@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'teststudent@example.com',
  },
] as const;

async function authenticateRole(
  browser: import('@playwright/test').Browser,
  role: (typeof ROLES)[number],
  baseURL: string
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.fill('#login-email', role.email);
  await page.fill('#login-password', role.password);
  await page.click('button[type="submit"]');

  // Wait for successful auth — sidebar nav or redirection confirms we're in
  // We accept both /dashboard and /domains as redirection targets
  await page.waitForURL(/\/((dashboard)|(domains))/, { timeout: 20000 });

  const statePath = path.join(AUTH_DIR, `${role.name}.json`);
  await context.storageState({ path: statePath });
  await context.close();

  console.log(`[globalSetup] ✅ ${role.name} authenticated → ${statePath}`);
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5000';
  const browser = await chromium.launch();

  try {
    for (const role of ROLES) {
      await authenticateRole(browser, role, baseURL);
    }
  } finally {
    await browser.close();
  }

  console.log('[globalSetup] ✅ All role state files written. Tests will skip login UI.');
}

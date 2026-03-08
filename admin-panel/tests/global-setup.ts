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

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.secrets') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

const ROLES = [
  {
    name: 'super-admin',
    email: process.env.TEST_SUPER_ADMIN_EMAIL!,
    password: process.env.TEST_SUPER_ADMIN_PASSWORD!,
  },
  {
    name: 'admin',
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  },
  {
    name: 'mentor',
    email: process.env.TEST_MENTOR_EMAIL!,
    password: process.env.TEST_MENTOR_PASSWORD!,
  },
  {
    name: 'student',
    email: process.env.TEST_STUDENT_EMAIL!,
    password: process.env.TEST_STUDENT_PASSWORD!,
  },
] as const;

/**
 * Decode a JWT payload without verifying the signature.
 * Used only to read the `exp` claim for logging/validation.
 */
function decodeJwtExpiry(token: string): Date | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as {
      exp?: number;
    };
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

/**
 * Validate that the saved storageState contains a non-expired Supabase session.
 * We warn (not throw) on expiry problems — a failed probe is already a hard failure above.
 *
 * @param statePath - Path to the saved .auth/<role>.json file
 * @param role      - Role name for log messages
 * @param minTtlMs  - Minimum required remaining TTL in ms (default: 60 minutes)
 */
function validateStateExpiry(
  statePath: string,
  role: string,
  minTtlMs = 60 * 60 * 1000 // 1 hour — enough for any CI run
): void {
  try {
    const raw = fs.readFileSync(statePath, 'utf-8');

    // Guard: empty or skeleton file
    if (!raw || raw.length < 50) {
      console.warn(
        `[globalSetup] ⚠️  ${role}: state file is empty or suspiciously small (${raw.length} bytes).`
      );
      return;
    }

    const state = JSON.parse(raw) as {
      origins?: Array<{
        origin: string;
        localStorage?: Array<{ name: string; value: string }>;
      }>;
    };

    // Locate the Supabase auth token in localStorage origins
    let accessToken: string | null = null;
    for (const origin of state.origins ?? []) {
      for (const item of origin.localStorage ?? []) {
        if (item.name.endsWith('-auth-token')) {
          try {
            const parsed = JSON.parse(item.value) as { access_token?: string };
            accessToken = parsed.access_token ?? null;
          } catch {
            // Not JSON — skip
          }
        }
      }
    }

    if (!accessToken) {
      console.warn(
        `[globalSetup] ⚠️  ${role}: no Supabase auth token found in saved state. Tests may hit auth errors.`
      );
      return;
    }

    const expiry = decodeJwtExpiry(accessToken);
    if (!expiry) {
      console.warn(`[globalSetup] ⚠️  ${role}: could not decode JWT expiry.`);
      return;
    }

    const ttlMs = expiry.getTime() - Date.now();
    const ttlMin = Math.round(ttlMs / 60000);

    if (ttlMs < minTtlMs) {
      console.warn(
        `[globalSetup] ⚠️  ${role}: JWT expires in ${ttlMin}min (${expiry.toISOString()}) — ` +
          `less than the required ${Math.round(minTtlMs / 60000)}min window. ` +
          'Increase Supabase JWT_EXPIRY in the test project settings or reduce CI run duration.'
      );
    } else {
      console.log(
        `[globalSetup] ✅ ${role}: JWT valid for ${ttlMin}min (expires ${expiry.toISOString()})`
      );
    }
  } catch (e) {
    console.warn(`[globalSetup] ⚠️  ${role}: could not validate state file:`, e);
  }
}

async function authenticateRole(
  browser: import('@playwright/test').Browser,
  role: (typeof ROLES)[number],
  baseURL: string,
  attempt = 1
): Promise<void> {
  const MAX_ATTEMPTS = 2;
  const context = await browser.newContext();
  const page = await context.newPage();
  // Guard: track whether we've already closed this context in the retry branch
  // so the finally block doesn't attempt a second close (which throws Target closed).
  let contextClosed = false;

  try {
    await page.goto(`${baseURL}/login`);
    await page.fill('#login-email', role.email);
    await page.fill('#login-password', role.password);
    await page.click('button[type="submit"]');

    // Wait for successful auth — sidebar nav or redirection confirms we're in
    // We accept both /dashboard and /domains as redirection targets
    await page.waitForURL(/\/((dashboard)|(domains))/, { timeout: 30000 });

    // ── Bypass AuthGuard Eviction ──────────────────────────────────────────
    // The AuthGuard will sign out if both questerix_remember_me and
    // questerix_session_active are absent (which happens in fresh contexts).
    // We explicitly set them here to ensure the saved state is valid for tests.
    await page.evaluate(() => {
      localStorage.setItem('questerix_remember_me', '1');
      sessionStorage.setItem('questerix_session_active', '1');
    });

    const statePath = path.join(AUTH_DIR, `${role.name}.json`);
    await context.storageState({ path: statePath });

    // ── Token expiry validation ──────────────────────────────────────────────
    // Decode the saved JWT and warn if it won't last the full CI run window.
    validateStateExpiry(statePath, role.name);

    console.log(`[globalSetup] ✅ ${role.name} authenticated → ${statePath}`);
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      // Close context before recursing — mark it closed so finally doesn't double-close.
      contextClosed = true;
      await context.close();
      console.warn(`[globalSetup] ⚠️  ${role.name} auth attempt ${attempt} failed, retrying…`);
      return authenticateRole(browser, role, baseURL, attempt + 1);
    }
    throw new Error(
      `[globalSetup] ❌ ${role.name} authentication failed after ${MAX_ATTEMPTS} attempts: ${String(err)}`
    );
  } finally {
    // Only close if not already closed by the retry branch.
    if (!contextClosed) {
      await context.close();
    }
  }
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
      try {
        await authenticateRole(browser, role, baseURL);
      } catch (e) {
        console.warn(
          `[globalSetup] ⚠️  Skipping role '${role.name}' due to authentication failure:`,
          String(e)
        );
        // We do NOT throw. Tests that strictly require this role's storageState will fail
        // during their own execution, which is more granular than failing the entire setup.
      }
    }
    console.log('[globalSetup] ✅ Authentication phase complete.');
  } finally {
    await browser.close();
  }
}

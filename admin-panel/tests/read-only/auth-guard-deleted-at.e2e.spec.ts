/**
 * auth-guard-deleted-at.e2e.spec.ts
 *
 * Verifies the `deleted_at` profile check behaviour in AuthGuard.
 *
 * The AuthGuard fetches `profiles.deleted_at` on every page load after a valid
 * Supabase JWT is found. If the profile has a non-null `deleted_at`, the user
 * must be signed out and redirected to /login immediately — even though their
 * JWT is still technically valid.
 *
 * ─── Why page.route() not a real soft-deleted user? ──────────────────────────
 * We use page.route() to intercept the Supabase REST query for the profiles
 * table. This avoids:
 *   - Creating/restoring a real soft-deleted test user between runs (data mutation)
 *   - Race conditions with auth state cleanup
 *   - Dependency on live DB state
 *
 * The interceptor only stubs the specific `profiles?id=eq.*&select=deleted_at`
 * request. All other requests pass through normally (including the JWT validation
 * via GoTrue — the session MUST be valid for AuthGuard to even reach the profile
 * check).
 *
 * Tests:
 *   AUTH-GUARD-001: deleted_at present → forces sign-out → redirect to /login
 *   AUTH-GUARD-002: deleted_at null    → no redirect, page loads normally
 *   AUTH-GUARD-003: profiles query network error (transient) → AuthGuard logs
 *                   warning but ALLOWS access (fail-open design)
 *   AUTH-GUARD-004: profiles returns 404 (profile missing) → AuthGuard logs
 *                   warning but ALLOWS access
 *
 * @tag @logic — not a smoke test, tests a specific security invariant
 */

import { expect, test } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, '..', '..', '.auth');

// Use the super-admin storageState so we have a real, valid JWT to start from.
// AuthGuard only runs the deleted_at check when there IS a session.
test.use({ storageState: path.join(AUTH_DIR, 'super-admin.json') });

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Intercepts the Supabase REST call for the profiles deleted_at check and
 * returns a mocked response.
 *
 * Pattern matched: /rest/v1/profiles?id=eq.*&select=deleted_at*
 */
async function stubProfilesDeletedAt(
  page: import('@playwright/test').Page,
  responseBody: Record<string, unknown>[] | null,
  status = 200
) {
  await page.route(
    (url) =>
      url.pathname.endsWith('/rest/v1/profiles') &&
      url.searchParams.has('id') &&
      (url.searchParams.get('select') ?? '').includes('deleted_at'),
    async (route) => {
      if (responseBody === null) {
        // Simulate network failure
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      });
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-GUARD-001: User with deleted_at set → forced sign-out → /login
// ─────────────────────────────────────────────────────────────────────────────
test(
  'AUTH-GUARD-001: soft-deleted user is forced to /login after AuthGuard check @logic',
  async ({ page }) => {
    // Stub profiles to return a deleted_at timestamp — simulates soft-deleted user
    await stubProfilesDeletedAt(page, [{ deleted_at: '2024-01-01T00:00:00Z' }]);

    // Intercept /auth/v1/logout and return 204 so signOut() doesn't throw.
    // We use waitForRequest() (not a boolean flag) to avoid a race condition:
    // the URL can change to /login before the signOut HTTP request is dispatched,
    // so asserting a flag immediately after toHaveURL can be a false negative.
    await page.route(
      (url) => url.pathname.includes('/auth/v1/logout'),
      async (route) => {
        await route.fulfill({ status: 204, body: '' });
      }
    );

    // Start listening for the logout request BEFORE navigating — prevents missing it
    const logoutRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/auth/v1/logout'),
      { timeout: 10000 }
    );

    // Navigate to a protected route — AuthGuard will run
    await page.goto('/dashboard');

    // Must redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Await the actual logout HTTP request — this is the definitive proof that
    // supabase.auth.signOut() was called, not just that the URL changed.
    await logoutRequestPromise;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-GUARD-002: User with deleted_at null → no redirect, access granted
// ─────────────────────────────────────────────────────────────────────────────
test(
  'AUTH-GUARD-002: active user (deleted_at null) is allowed through AuthGuard @logic',
  async ({ page }) => {
    // Stub profiles to return deleted_at: null — simulates a normal active user
    await stubProfilesDeletedAt(page, [{ deleted_at: null }]);

    await page.goto('/dashboard');

    // Must NOT be redirected to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    // Must land on /dashboard (or stay on a valid protected page)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-GUARD-003: Transient network error on profiles fetch → fail-open
// AuthGuard logs and allows access — does not sign the user out
// ─────────────────────────────────────────────────────────────────────────────
test(
  'AUTH-GUARD-003: transient profile fetch error → fail-open (no forced logout) @logic',
  async ({ page }) => {
    // Simulate network failure on the profiles query
    await stubProfilesDeletedAt(page, null);

    await page.goto('/dashboard');

    // AuthGuard design: on network error, it warns but ALLOWS access.
    // The user should NOT be on /login.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

    // The page must remain on a valid authenticated route
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-GUARD-004: profiles returns 406 (no row / PGRST116) → fail-open
// Same as network error — AuthGuard allows access, does not sign out
// ─────────────────────────────────────────────────────────────────────────────
test(
  'AUTH-GUARD-004: profiles 406/PGRST116 (missing profile row) → fail-open @logic',
  async ({ page }) => {
    // Supabase returns 406 + PGRST116 when .single() finds no rows
    await stubProfilesDeletedAt(
      page,
      [{ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }],
      406
    );

    await page.goto('/dashboard');

    // AuthGuard's error branch: logs warning and proceeds (no logout)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }
);

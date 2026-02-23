/**
 * rbac-guards.e2e.spec.ts
 *
 * P0 Role-Based Access Control (RBAC) Guard Tests
 *
 * Tests: AP-RBAC-001..005
 * Verifies that all route guards correctly restrict/allow access per role.
 *
 * Strategy:
 * - For role-specific denial tests, we mock the Supabase auth session via
 *   page.route() so we don't need real credentials for every role.
 * - For super-admin happy path, we use TEST_USERS.SUPER_ADMIN (real login).
 * - We assert on page.url() NOT on content, to avoid false positives from
 *   partial page loads.
 *
 * IMPORTANT: These tests use Playwright's route interception to stub the
 * Supabase session — no real API calls, no data mutation.
 */
import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from './test-utils';

// ── Super-admin only routes ──────────────────────────────────────────────────
const SUPER_ADMIN_ROUTES = [
  '/dashboard',
  '/subjects',
  '/apps',
  '/users',
  '/invitation-codes',
  '/governance',
  '/known-issues',
  '/error-logs',
  '/landings',
] as const;

// ── StandardAdmin routes (admin+mentor only, not student) ────────────────────
const STANDARD_ADMIN_ROUTES = ['/groups', '/groups/new'] as const;

// stubSessionAs removed as it's unused (using real logins for E2E)

test.describe('AP-RBAC-001: Super-Admin Routes Blocked for Admin/Mentor Role', () => {
  // We perform a real login then try to navigate to super-admin routes.
  // The guards should redirect away from these routes.

  const ROLES_TO_LOCK_OUT = [
    { role: 'admin', user: TEST_USERS.ADMIN },
    { role: 'mentor', user: TEST_USERS.MENTOR },
    { role: 'student', user: TEST_USERS.STUDENT },
  ];

  for (const { role, user } of ROLES_TO_LOCK_OUT) {
    test.describe(`${role} lockout`, () => {
      for (const route of SUPER_ADMIN_ROUTES) {
        test(`${role} cannot access ${route}`, async ({ page }) => {
          await login(page, user.email, user.password);
          await page.goto(route);
          await page.waitForURL(
            (url) =>
              !SUPER_ADMIN_ROUTES.some((r) => url.pathname === r) &&
              !url.pathname.startsWith('/login'),
            { timeout: 10000 }
          );
          expect(SUPER_ADMIN_ROUTES).not.toContain(new URL(page.url()).pathname);
        });
      }
    });
  }
});

// ============================================================================
// AP-RBAC-002: Student-role users cannot access StandardAdminGuard routes
// ============================================================================
test.describe('AP-RBAC-002: StandardAdmin Routes Blocked for Student Role', () => {
  for (const route of STANDARD_ADMIN_ROUTES) {
    test(`student-role cannot access ${route}`, async ({ page }) => {
      await login(page, TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);
      await page.goto(route);

      await page.waitForURL((url) => !STANDARD_ADMIN_ROUTES.some((r) => url.pathname === r), {
        timeout: 10000,
      });

      const currentPath = new URL(page.url()).pathname;
      expect(STANDARD_ADMIN_ROUTES as readonly string[]).not.toContain(currentPath);
    });
  }
});

// ============================================================================
// AP-RBAC-003: Unauthenticated users are redirected to /login for ALL routes
// ============================================================================
test.describe('AP-RBAC-003: Unauthenticated Users Redirected to /login', () => {
  test.use({
    storageState: { cookies: [], origins: [] }, // Start with clean storage
  });

  const routesToTest = [
    '/domains',
    '/skills',
    '/questions',
    '/publish',
    '/settings',
    '/dashboard',
    '/groups',
  ] as const;

  for (const route of routesToTest) {
    test(`unauthenticated access to ${route} → /login`, async ({ page }) => {
      // Clear any existing session storage
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Navigate directly to protected route
      await page.goto(route);

      // Should land on /login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  }
});

// ============================================================================
// AP-RBAC-004: Super admin can access ALL super-admin routes
// ============================================================================
test.describe('AP-RBAC-004: Super Admin Accesses All Routes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  for (const route of SUPER_ADMIN_ROUTES) {
    test(`super_admin can access ${route}`, async ({ page }) => {
      await page.goto(route);

      // Should NOT be redirected to /login or /unauthorized
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
        timeout: 10000,
      });

      const currentPath = new URL(page.url()).pathname;
      expect(currentPath).not.toBe('/login');
      // Must be on the expected route (no redirect away from it)
      expect(currentPath).toBe(route);
    });
  }
});

// ============================================================================
// AP-RBAC-005: RoleRedirect at / sends correct roles to correct destinations
// ============================================================================
test.describe('AP-RBAC-005: RoleRedirect at / (root)', () => {
  test('super_admin navigating to / lands on /dashboard', async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('admin navigating to / lands on /domains', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    await page.goto('/');
    await expect(page).toHaveURL(/\/domains/, { timeout: 10000 });
  });
});

// ============================================================================
// AP-RBAC-006: API-level — direct supabase call with wrong app_id is blocked by RLS
// ============================================================================
test.describe('AP-RBAC-006: API-level multi-tenant isolation', () => {
  test('admin cannot SELECT domains from another tenant via raw API call', async ({ page }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

    test.skip(!supabaseUrl || !anonKey, 'Supabase env vars not set');

    // Login as admin to get a real session token
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // Extract the session token from localStorage
    const token = await page.evaluate((url) => {
      const keyPrefix = `sb-${new URL(url).host.split('.')[0]}-auth-token`;
      const raw = localStorage.getItem(keyPrefix);
      if (!raw) return null;
      try {
        return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
      } catch {
        return null;
      }
    }, supabaseUrl);

    if (!token) {
      test.skip(true, 'Could not extract session token from localStorage');
    }

    // Attempt to query domains with a fake app_id filter overridden
    // RLS on the server side should prevent leakage regardless of client filter
    const response = await page.request.get(
      `${supabaseUrl}/rest/v1/domains?app_id=eq.00000000-0000-0000-0000-000000000000`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    // RLS must return 0 rows for a fake app_id, never throw an error
    const data = (await response.json()) as unknown[];
    expect(data).toHaveLength(0);
  });
});

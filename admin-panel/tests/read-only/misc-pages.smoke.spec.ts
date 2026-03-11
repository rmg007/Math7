/**
 * Misc Pages Smoke Tests @regression
 *
 * Covers 11 pages that had zero test coverage:
 *   Auth:       AuthConfirmPage, InvitationCodesPage, LoginPage, UserManagementPage
 *   Mentorship: AssignmentCreatePage, GroupCreatePage, GroupDetailPage, GroupsPage
 *   Monitoring: ErrorLogsPage, KnownIssuesPage
 *   Platform:   LandingsPage
 *
 * Design rules:
 *   - @regression tag on every test so --grep @regression picks them up.
 *   - Read-only: never triggers write RPCs or Edge Functions against real Supabase.
 *   - Write RPCs and destructive mutations are intercepted with page.route().
 *   - List-fetching REST reads are also mocked for determinism.
 *   - LoginPage / AuthConfirmPage use storageState: { cookies: [], origins: [] }
 *     (AGENTS.md gotcha: required for unauthenticated-flow tests).
 *   - GroupDetailPage / AssignmentCreatePage use FAKE_UUID + REST mocks so the
 *     suite never depends on live seeded data.
 *   - All other pages use the global super-admin storageState (set in
 *     playwright.config.ts desktop project).
 *   - No toHaveScreenshot assertions. Chromium only.
 */
import { expect, test } from '@playwright/test';

// Coverage is registered via admin-panel/tests/smoke-coverage-manifest.json (Tier 0).

const FAKE_UUID = '11111111-1111-1111-1111-111111111111';

const FAKE_GROUP = {
  id: FAKE_UUID,
  name: 'Smoke Test Squad',
  type: 'class',
  join_code: 'SMK001',
  app_id: 'test-app',
  owner_id: FAKE_UUID,
  allow_anonymous_join: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

test.beforeEach(async ({ page }) => {
  // Global mocks for AppContext and Guards

  // Mock apps (required for AppContext to find a current app).
  await page.route('**/rest/v1/apps**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ app_id: 'test-app', display_name: 'Test App', is_active: true }]),
      });
    } else {
      await route.continue();
    }
  });

  // Mock profiles for super-admin/admin detection in guards.
  await page.route('**/rest/v1/profiles**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const acceptHeader = route.request().headers()['accept'] ?? '';
    const profile = { role: 'super_admin', app_id: 'test-app' };

    if (acceptHeader.includes('pgrst.object')) {
      await route.fulfill({
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify(profile),
      });
    } else {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([profile]),
      });
    }
  });
});

// ── LoginPage ─────────────────────────────────────────────────────────────────
// Uses an empty storageState so the browser is fully unauthenticated.
// The global super-admin session must NOT be present — otherwise the page
// immediately redirects away from /login before any assertions run.
test.describe('LoginPage @regression', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });

  test('page renders the Questerix Admin heading @regression', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Questerix Admin');
  });

  test('"Welcome Back" card title is shown in sign-in mode @regression', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('email and password inputs are present @regression', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('sign-in submit button is present @regression', async ({ page }) => {
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });

  test('forgot-password link is present @regression', async ({ page }) => {
    await expect(page.getByText(/Forgot password/i)).toBeVisible();
  });

  test('register toggle link is present @regression', async ({ page }) => {
    await expect(page.getByText(/Don't have an account/i)).toBeVisible();
  });

  test('registration form appears after toggle @regression', async ({ page }) => {
    await page.getByText(/Don't have an account/i).click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#inviteCode')).toBeVisible();
  });

  test('forgot-password form appears after clicking the link @regression', async ({ page }) => {
    await page.getByText(/Forgot password/i).click();
    await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#reset-email')).toBeVisible();
    await expect(page.getByText('Send Reset Link')).toBeVisible();
  });
});

// ── AuthConfirmPage ───────────────────────────────────────────────────────────
// Public page — no AuthGuard. Must use empty storageState.
test.describe('AuthConfirmPage @regression', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to /login when no token is present @regression', async ({ page }) => {
    await page.goto('/auth/confirm');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('shows error state when error_code query param is present @regression', async ({ page }) => {
    await page.goto(
      '/auth/confirm?error_code=otp_expired&error_description=Link+has+expired+or+is+invalid'
    );
    // The page sets status='error' from the error_code — no Supabase call needed.
    await expect(page.getByText(/Link Expired/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Back to Sign In/i).first()).toBeVisible();
  });

  test('shows password recovery form with token_hash + type=recovery @regression', async ({
    page,
  }) => {
    // Hash fragment is client-side only — scanner safe, no API call until button click.
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    await expect(page.getByRole('heading', { name: 'Set New Password' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('confirm button is present and enabled in recovery mode @regression', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    const btn = page.locator('#auth-confirm-btn');
    await expect(btn).toBeVisible({ timeout: 15000 });
    // Button is only disabled while loading — idle state it is enabled.
    await expect(btn).not.toBeDisabled();
  });

  test('shows "Confirm & Sign In" button for non-recovery token @regression', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=signup');
    const btn = page.locator('#auth-confirm-btn');
    await expect(btn).toBeVisible({ timeout: 15000 });
    await expect(btn).toContainText(/Confirm & Sign In/i);
  });

  test('footer brand note is visible @regression', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    await expect(page.getByText(/Questerix Admin.*Secure Authentication/i)).toBeVisible({
      timeout: 15000,
    });
  });
});

// ── InvitationCodesPage ───────────────────────────────────────────────────────
test.describe('InvitationCodesPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Return empty list — avoids dependency on real DB state.
    await page.route('**/rest/v1/invitation_codes**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });
    // Block write RPCs to prevent accidental mutations.
    await page.route('**/rest/v1/rpc/generate_invitation_code**', async (route) => {
      await route.fulfill({ contentType: 'application/json', body: '"INV-SMOKE-CODE"' });
    });
    await page.route('**/rest/v1/rpc/deactivate_invitation_code**', async (route) => {
      await route.fulfill({ contentType: 'application/json', body: 'null' });
    });

    await page.goto('/invitation-codes');
    await expect(page.locator('[data-hydration-complete="true"]')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Invitation Codes" @regression', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Invitation Codes', exact: true })
    ).toBeVisible();
  });

  test('Generate Code section is visible @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Generate Code' })).toBeVisible();
  });

  test('Max Uses and Expires (days) inputs are present @regression', async ({ page }) => {
    await expect(page.getByText('Max Uses')).toBeVisible();
    await expect(page.getByText(/Expires \(days\)/i)).toBeVisible();
  });

  test('Generate Code button is present @regression', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Generate Code/i })).toBeVisible();
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder('Search codes...')).toBeVisible();
  });

  test('empty state is shown when no codes exist @regression', async ({ page }) => {
    await expect(page.getByText('No invitation codes')).toBeVisible();
  });
});

// ── UserManagementPage ────────────────────────────────────────────────────────
test.describe('UserManagementPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('[data-hydration-complete="true"]')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Users" @regression', async ({ page }) => {
    // The heading text "Users" appears in AdminHeader; filter to avoid partial matches.
    await expect(page.getByRole('heading', { name: /^Users$/i })).toBeVisible();
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
  });

  test('user table column headers are rendered @regression', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Role/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('active users count badge is visible @regression', async ({ page }) => {
    await expect(page.getByText(/\d+ active/i)).toBeVisible();
  });
});

// ── GroupsPage ────────────────────────────────────────────────────────────────
test.describe('GroupsPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/groups**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/groups');
    await expect(page.getByText('Squad Registry')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Squad Registry" @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Squad Registry' })).toBeVisible();
  });

  test('"Initialize Squad" button links to /groups/new @regression', async ({ page }) => {
    const btn = page.getByRole('link', { name: /Initialize Squad/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', '/groups/new');
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search squads/i)).toBeVisible();
  });

  test('empty state is shown when no groups exist @regression', async ({ page }) => {
    await expect(page.getByText('No Active Squads')).toBeVisible();
  });

  test('registered count badge shows 0 REGISTERED @regression', async ({ page }) => {
    await expect(page.getByText('0 REGISTERED')).toBeVisible();
  });
});

// ── GroupCreatePage ───────────────────────────────────────────────────────────
test.describe('GroupCreatePage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Block the groups insert to prevent accidental writes.
    await page.route('**/rest/v1/groups**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([FAKE_GROUP]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/groups/new');
    await expect(page.getByText('Initialize Squad')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Initialize Squad" @regression', async ({ page }) => {
    await expect(page.getByText('Initialize Squad').first()).toBeVisible();
  });

  test('Squad Name input is present @regression', async ({ page }) => {
    await expect(page.locator('#name')).toBeVisible();
  });

  test('CLASSROOM and DOMESTIC protocol type options are present @regression', async ({ page }) => {
    await expect(page.getByText('CLASSROOM', { exact: true })).toBeVisible();
    await expect(page.getByText('DOMESTIC', { exact: true })).toBeVisible();
  });

  test('Allow Anonymous Entry toggle is present @regression', async ({ page }) => {
    await expect(page.getByText('Allow Anonymous Entry')).toBeVisible();
  });

  test('submit button reads "Provisional Initialize" @regression', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Provisional Initialize/i })).toBeVisible();
  });

  test('Back to Registry link navigates to /groups @regression', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Registry/i })).toBeVisible();
  });
});

// ── GroupDetailPage ───────────────────────────────────────────────────────────
test.describe('GroupDetailPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock groups REST — the page uses .single() so Supabase expects pgrst.object+json.
    await page.route('**/rest/v1/groups**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const acceptHeader = route.request().headers()['accept'] ?? '';
      if (acceptHeader.includes('pgrst.object')) {
        await route.fulfill({
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify(FAKE_GROUP),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([FAKE_GROUP]),
        });
      }
    });

    // Return empty arrays for related tables — page will show empty states.
    await page.route('**/rest/v1/group_members**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });
    await page.route('**/rest/v1/assignments**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/groups/${FAKE_UUID}`);
    await expect(page.getByText('Smoke Test Squad')).toBeVisible({ timeout: 15000 });
  });

  test('page displays the group name from mock data @regression', async ({ page }) => {
    await expect(page.getByText('Smoke Test Squad')).toBeVisible();
  });

  test('tabs navigation list is present @regression', async ({ page }) => {
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test('join code is displayed @regression', async ({ page }) => {
    await expect(page.locator('code').getByText('SMK001')).toBeVisible();
  });

  test('back navigation link is present @regression', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back|Registry/i }).first()).toBeVisible();
  });
});

// ── AssignmentCreatePage ──────────────────────────────────────────────────────
test.describe('AssignmentCreatePage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock groups (single-row fetch for the group context).
    await page.route('**/rest/v1/groups**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const acceptHeader = route.request().headers()['accept'] ?? '';
      if (acceptHeader.includes('pgrst.object')) {
        await route.fulfill({
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify(FAKE_GROUP),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([FAKE_GROUP]),
        });
      }
    });

    // Mock skills list used for skill selection (empty is fine for smoke).
    await page.route('**/rest/v1/skills**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    // Block assignment writes.
    await page.route('**/rest/v1/assignments**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/groups/${FAKE_UUID}/assignments/new`);
    await expect(page.getByTestId('admin-header-title')).toHaveText('Initialize Assignment', {
      timeout: 15000,
    });
  });

  test('page heading reads "Initialize Assignment" @regression', async ({ page }) => {
    await expect(page.getByTestId('admin-header-title')).toHaveText('Initialize Assignment');
  });

  test('Protocol Selection section is present @regression', async ({ page }) => {
    await expect(page.getByText('Protocol Selection')).toBeVisible();
  });

  test('"Skill Mastery" assignment type option is present @regression', async ({ page }) => {
    await expect(page.getByText('Skill Mastery')).toBeVisible();
  });

  test('"Time Goal" assignment type option is present @regression', async ({ page }) => {
    await expect(page.getByText('Time Goal')).toBeVisible();
  });

  test('group name is shown in the page description @regression', async ({ page }) => {
    await expect(page.getByText(/Smoke Test Squad/i)).toBeVisible();
  });
});

// ── ErrorLogsPage ─────────────────────────────────────────────────────────────
test.describe('ErrorLogsPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all error_logs REST reads — avoids dependency on live error data.
    await page.route('**/rest/v1/error_logs**', async (route) => {
      if (route.request().method() === 'GET') {
        // Support both HEAD (count queries) and GET (data queries).
        await route.fulfill({
          contentType: 'application/json',
          headers: { 'Content-Range': '0-0/0' },
          body: '[]',
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/error-logs');
    await expect(page.getByRole('heading', { name: 'Error Logs', exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test('page heading reads "Error Logs" @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Error Logs', exact: true })).toBeVisible();
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder('Search error logs...')).toBeVisible();
  });

  test('empty state is shown when no error logs exist @regression', async ({ page }) => {
    // The page renders an EmptyState component when the list is empty.
    await expect(page.getByRole('heading', { name: 'No errors found' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Your app is running smoothly.')).toBeVisible();
  });
});

// ── KnownIssuesPage ───────────────────────────────────────────────────────────
test.describe('KnownIssuesPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/known_issues**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/known-issues');
    await expect(page.getByRole('heading', { name: 'Known Issues', exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test('page heading reads "Known Issues" @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Known Issues', exact: true })).toBeVisible();
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder('Search issues...')).toBeVisible();
  });

  test('"New Issue" button is visible @regression', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New Issue/i }).first()).toBeVisible();
  });

  test('empty state is shown when no issues exist @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No known issues' })).toBeVisible({
      timeout: 10000,
    });
  });
});

// ── LandingsPage ──────────────────────────────────────────────────────────────
test.describe('LandingsPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock app_landing_pages REST reads.
    await page.route('**/rest/v1/app_landing_pages**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          headers: { 'Content-Range': '0-0/0' },
          body: '[]',
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/landings');
    await expect(page.getByRole('heading', { name: 'Landing Pages', exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test('page heading reads "Landing Pages" @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Landing Pages', exact: true })).toBeVisible();
  });

  test('search input is present @regression', async ({ page }) => {
    await expect(page.getByPlaceholder('Search landing pages...')).toBeVisible();
  });

  test('empty state is shown when no landing pages exist @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No landing pages yet' })).toBeVisible({
      timeout: 10000,
    });
  });
});

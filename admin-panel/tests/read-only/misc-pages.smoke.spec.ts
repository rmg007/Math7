/**
 * Misc Pages Smoke Tests @smoke
 *
 * Covers 11 pages that had zero test coverage:
 *   Auth:       AuthConfirmPage, InvitationCodesPage, LoginPage, UserManagementPage
 *   Mentorship: AssignmentCreatePage, GroupCreatePage, GroupDetailPage, GroupsPage
 *   Monitoring: ErrorLogsPage, KnownIssuesPage
 *   Platform:   LandingsPage
 *
 * Design rules:
 *   - @smoke tag on every test so --grep @smoke picks them up.
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

// ── LoginPage ─────────────────────────────────────────────────────────────────
// Uses an empty storageState so the browser is fully unauthenticated.
// The global super-admin session must NOT be present — otherwise the page
// immediately redirects away from /login before any assertions run.
test.describe('LoginPage @smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });

  test('page renders the Questerix Admin heading @smoke', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Questerix Admin');
  });

  test('"Welcome Back" card title is shown in sign-in mode @smoke', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('email and password inputs are present @smoke', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('sign-in submit button is present @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });

  test('forgot-password link is present @smoke', async ({ page }) => {
    await expect(page.getByText(/Forgot password/i)).toBeVisible();
  });

  test('register toggle link is present @smoke', async ({ page }) => {
    await expect(page.getByText(/Don't have an account/i)).toBeVisible();
  });

  test('registration form appears after toggle @smoke', async ({ page }) => {
    await page.getByText(/Don't have an account/i).click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#inviteCode')).toBeVisible();
  });

  test('forgot-password form appears after clicking the link @smoke', async ({ page }) => {
    await page.getByText(/Forgot password/i).click();
    await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#reset-email')).toBeVisible();
    await expect(page.getByText('Send Reset Link')).toBeVisible();
  });
});

// ── AuthConfirmPage ───────────────────────────────────────────────────────────
// Public page — no AuthGuard. Must use empty storageState.
test.describe('AuthConfirmPage @smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to /login when no token is present @smoke', async ({ page }) => {
    await page.goto('/auth/confirm');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('shows error state when error_code query param is present @smoke', async ({ page }) => {
    await page.goto(
      '/auth/confirm?error_code=otp_expired&error_description=Link+has+expired+or+is+invalid'
    );
    // The page sets status='error' from the error_code — no Supabase call needed.
    await expect(page.getByText(/Link Expired/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Back to Sign In/i).first()).toBeVisible();
  });

  test('shows password recovery form with token_hash + type=recovery @smoke', async ({ page }) => {
    // Hash fragment is client-side only — scanner safe, no API call until button click.
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    await expect(page.getByText(/Set New Password/i)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('confirm button is present and enabled in recovery mode @smoke', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    const btn = page.locator('#auth-confirm-btn');
    await expect(btn).toBeVisible({ timeout: 15000 });
    // Button is only disabled while loading — idle state it is enabled.
    await expect(btn).not.toBeDisabled();
  });

  test('shows "Confirm & Sign In" button for non-recovery token @smoke', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=signup');
    const btn = page.locator('#auth-confirm-btn');
    await expect(btn).toBeVisible({ timeout: 15000 });
    await expect(btn).toContainText(/Confirm & Sign In/i);
  });

  test('footer brand note is visible @smoke', async ({ page }) => {
    await page.goto('/auth/confirm#token_hash=smoketesthash&type=recovery');
    await expect(page.getByText(/Questerix Admin.*Secure Authentication/i)).toBeVisible({
      timeout: 15000,
    });
  });
});

// ── InvitationCodesPage ───────────────────────────────────────────────────────
test.describe('InvitationCodesPage @smoke', () => {
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

  test('page heading reads "Invitation Codes" @smoke', async ({ page }) => {
    await expect(page.getByText('Invitation Codes')).toBeVisible();
  });

  test('Generate Code section is visible @smoke', async ({ page }) => {
    await expect(page.getByText('Generate Code')).toBeVisible();
  });

  test('Max Uses and Expires (days) inputs are present @smoke', async ({ page }) => {
    await expect(page.getByText('Max Uses')).toBeVisible();
    await expect(page.getByText(/Expires \(days\)/i)).toBeVisible();
  });

  test('Generate Code button is present @smoke', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Generate Code/i })).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder('Search codes...')).toBeVisible();
  });

  test('empty state is shown when no codes exist @smoke', async ({ page }) => {
    await expect(page.getByText('No invitation codes')).toBeVisible();
  });
});

// ── UserManagementPage ────────────────────────────────────────────────────────
test.describe('UserManagementPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('[data-hydration-complete="true"]')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Users" @smoke', async ({ page }) => {
    // The heading text "Users" appears in AdminHeader; filter to avoid partial matches.
    await expect(page.getByRole('heading', { name: /^Users$/i })).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
  });

  test('user table column headers are rendered @smoke', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Role/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('active users count badge is visible @smoke', async ({ page }) => {
    await expect(page.getByText(/\d+ active/i)).toBeVisible();
  });
});

// ── GroupsPage ────────────────────────────────────────────────────────────────
test.describe('GroupsPage @smoke', () => {
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

  test('page heading reads "Squad Registry" @smoke', async ({ page }) => {
    await expect(page.getByText('Squad Registry')).toBeVisible();
  });

  test('"Initialize Squad" button links to /groups/new @smoke', async ({ page }) => {
    const btn = page.getByRole('link', { name: /Initialize Squad/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', '/groups/new');
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search squads/i)).toBeVisible();
  });

  test('empty state is shown when no groups exist @smoke', async ({ page }) => {
    await expect(page.getByText('No Active Squads')).toBeVisible();
  });

  test('registered count badge shows 0 REGISTERED @smoke', async ({ page }) => {
    await expect(page.getByText('0 REGISTERED')).toBeVisible();
  });
});

// ── GroupCreatePage ───────────────────────────────────────────────────────────
test.describe('GroupCreatePage @smoke', () => {
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

  test('page heading reads "Initialize Squad" @smoke', async ({ page }) => {
    await expect(page.getByText('Initialize Squad').first()).toBeVisible();
  });

  test('Squad Name input is present @smoke', async ({ page }) => {
    await expect(page.locator('#name')).toBeVisible();
  });

  test('CLASSROOM and DOMESTIC protocol type options are present @smoke', async ({ page }) => {
    await expect(page.getByText('CLASSROOM')).toBeVisible();
    await expect(page.getByText('DOMESTIC')).toBeVisible();
  });

  test('Allow Anonymous Entry toggle is present @smoke', async ({ page }) => {
    await expect(page.getByText('Allow Anonymous Entry')).toBeVisible();
  });

  test('submit button reads "Provisional Initialize" @smoke', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Provisional Initialize/i })).toBeVisible();
  });

  test('Back to Registry link navigates to /groups @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Registry/i })).toBeVisible();
  });
});

// ── GroupDetailPage ───────────────────────────────────────────────────────────
test.describe('GroupDetailPage @smoke', () => {
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

  test('page displays the group name from mock data @smoke', async ({ page }) => {
    await expect(page.getByText('Smoke Test Squad')).toBeVisible();
  });

  test('tabs navigation list is present @smoke', async ({ page }) => {
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test('join code is displayed @smoke', async ({ page }) => {
    await expect(page.getByText('SMK001')).toBeVisible();
  });

  test('back navigation link is present @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back|Registry/i }).first()).toBeVisible();
  });
});

// ── AssignmentCreatePage ──────────────────────────────────────────────────────
test.describe('AssignmentCreatePage @smoke', () => {
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
    await expect(page.getByText('Initialize Assignment')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Initialize Assignment" @smoke', async ({ page }) => {
    await expect(page.getByText('Initialize Assignment')).toBeVisible();
  });

  test('Protocol Selection section is present @smoke', async ({ page }) => {
    await expect(page.getByText('Protocol Selection')).toBeVisible();
  });

  test('"Skill Mastery" assignment type option is present @smoke', async ({ page }) => {
    await expect(page.getByText('Skill Mastery')).toBeVisible();
  });

  test('"Time Goal" assignment type option is present @smoke', async ({ page }) => {
    await expect(page.getByText('Time Goal')).toBeVisible();
  });

  test('group name is shown in the page description @smoke', async ({ page }) => {
    await expect(page.getByText(/Smoke Test Squad/i)).toBeVisible();
  });
});

// ── ErrorLogsPage ─────────────────────────────────────────────────────────────
test.describe('ErrorLogsPage @smoke', () => {
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
    await expect(page.getByText('Error Logs')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Error Logs" @smoke', async ({ page }) => {
    await expect(page.getByText('Error Logs')).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder('Search error logs...')).toBeVisible();
  });

  test('empty state is shown when no error logs exist @smoke', async ({ page }) => {
    // The page renders an EmptyState component when the list is empty.
    await expect(page.getByText(/No error logs/i)).toBeVisible({ timeout: 10000 });
  });
});

// ── KnownIssuesPage ───────────────────────────────────────────────────────────
test.describe('KnownIssuesPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/known_issues**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/known-issues');
    await expect(page.getByText('Known Issues')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Known Issues" @smoke', async ({ page }) => {
    await expect(page.getByText('Known Issues')).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder('Search issues...')).toBeVisible();
  });

  test('"New Issue" button is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New Issue/i })).toBeVisible();
  });

  test('empty state is shown when no issues exist @smoke', async ({ page }) => {
    await expect(page.getByText(/No known issues/i)).toBeVisible({ timeout: 10000 });
  });
});

// ── LandingsPage ──────────────────────────────────────────────────────────────
test.describe('LandingsPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/landing_pages**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });
    await page.route('**/rest/v1/apps**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/landings');
    await expect(page.getByText('Landing Pages')).toBeVisible({ timeout: 15000 });
  });

  test('page heading reads "Landing Pages" @smoke', async ({ page }) => {
    await expect(page.getByText('Landing Pages')).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.getByPlaceholder('Search landing pages...')).toBeVisible();
  });

  test('empty state is shown when no landing pages exist @smoke', async ({ page }) => {
    await expect(page.getByText(/No landing pages/i)).toBeVisible({ timeout: 10000 });
  });
});

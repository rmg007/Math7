/**
 * DashboardPage Smoke Tests @regression
 *
 * Covers: admin-panel/src/features/dashboard/pages/DashboardPage.tsx
 * Route:  /dashboard  (SuperAdminGuard — requires super-admin session)
 *
 * Design rules:
 *   - @regression tag on every test so --grep @regression picks them up.
 *   - Read-only: does not trigger any write RPCs or Edge Functions.
 *   - Uses global storageState (super-admin authenticated) — no auth override needed.
 *   - Supabase REST count queries are mocked with page.route() for determinism:
 *       domains    → count 42  (HEAD, Content-Range: *\/42)
 *       skills     → count 128 (HEAD, Content-Range: *\/128)
 *       questions  → count 307 (HEAD) + type distribution data (GET)
 *       error_logs → count 3   (HEAD, Content-Range: *\/3)
 *   - Assert on stable post-load state — NOT transient loading skeletons.
 *   - No toHaveScreenshot assertions. Chromium only.
 *
 * Coverage registered in admin-panel/tests/smoke-coverage-manifest.json (Tier 0).
 */
import { expect, test } from '@playwright/test';

test.describe('DashboardPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    // Supabase count queries with { head: true } send a HEAD HTTP request;
    // the response count is conveyed via the Content-Range header (e.g. *\/42).
    // The question type distribution query uses GET and returns an array.

    await page.route('**/rest/v1/domains**', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': '*/42',
        },
        body: '[]',
      });
    });

    await page.route('**/rest/v1/skills**', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': '*/128',
        },
        body: '[]',
      });
    });

    await page.route('**/rest/v1/questions**', (route) => {
      if (route.request().method() === 'HEAD') {
        // Count query: head:true → HEAD method, count returned via Content-Range
        route.fulfill({
          status: 200,
          headers: { 'Content-Range': '*/307' },
          body: '',
        });
      } else {
        // Type distribution query: select('type') → GET, returns array of rows
        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': '0-2/307',
          },
          body: JSON.stringify([
            { type: 'multiple_choice' },
            { type: 'boolean' },
            { type: 'text_input' },
          ]),
        });
      }
    });

    await page.route('**/rest/v1/error_logs**', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Range': '*/3',
        },
        body: '[]',
      });
    });

    await page.goto('/dashboard');
    // AdminHeader title "Dashboard" only renders after statsLoading resolves;
    // waiting for it confirms the page has left the loading-skeleton state.
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('page loads with "Dashboard" heading @smoke', async ({ page }) => {
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });

  test('stat card for Domains is visible @regression', async ({ page }) => {
    // StatCard with title="Domains" is always rendered post-load
    await expect(page.getByText('Domains').first()).toBeVisible();
  });

  test('stat card for Skills is visible @regression', async ({ page }) => {
    await expect(page.getByText('Skills').first()).toBeVisible();
  });

  test('stat card for Questions is visible @regression', async ({ page }) => {
    await expect(page.getByText('Questions').first()).toBeVisible();
  });

  test('view toggle (Current App / All Apps) is present for super-admin @regression', async ({
    page,
  }) => {
    // Rendered only when isSuperAdmin === true; global storageState is super-admin
    await expect(page.getByRole('button', { name: 'Current App' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All Apps' })).toBeVisible();
  });

  test('charts section renders Activity AreaChart and Question Types PieChart @regression', async ({
    page,
  }) => {
    // CardTitle "Activity" wraps the AreaChart card — use .first() to handle any duplicate text matches
    await expect(page.getByText('Activity').first()).toBeVisible();
    // CardTitle "Question Types" wraps the PieChart card — appears twice on page (CardTitle + RegistryItem)
    await expect(page.getByText('Question Types').first()).toBeVisible();
  });

  test('Curriculum Summary section is visible @regression', async ({ page }) => {
    await expect(page.getByText('Curriculum Summary')).toBeVisible();
  });

  test('Platform Health section is visible @regression', async ({ page }) => {
    await expect(page.getByText('Platform Health')).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

// Use same mock auth pattern or assume global state
// The user instructed "Do NOT use the production database or user pool yet. Create temporary local mock data or placeholders if you need to."
// So we'll mock the necessary dashboard data for the visual screenshot to be deterministic.

test.use({ storageState: '.auth/super-admin.json' });

test.describe('Visual Layout Regression Tests (The AI Eye)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Dashboard Data for Deterministic Layout
    await page.route('**/rest/v1/apps**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Content-Range': '0-0/1' },
        body: JSON.stringify([
          { id: 'bd6c18f1-8f55-46ff-a5bd-b11111111111', name: 'Mock Core App', is_active: true },
        ]),
      });
    });

    await page.route('**/rest/v1/user_apps**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            app_id: 'bd6c18f1-8f55-46ff-a5bd-b11111111111',
            role: 'owner',
            apps: { id: 'bd6c18f1-8f55-46ff-a5bd-b11111111111', name: 'Mock Core App' },
          },
        ]),
      });
    });

    await page.route('**/rest/v1/domains**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Content-Range': '*/42' }, body: '[]' });
    });
    await page.route('**/rest/v1/skills**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Content-Range': '*/128' }, body: '[]' });
    });
    await page.route('**/rest/v1/questions**', async (route) => {
      if (route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, headers: { 'Content-Range': '*/307' }, body: '' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Content-Range': '0-2/307' },
          body: JSON.stringify([
            { type: 'multiple_choice' },
            { type: 'boolean' },
            { type: 'text_input' },
          ]),
        });
      }
    });
    await page.route('**/rest/v1/error_logs**', async (route) => {
      await route.fulfill({ status: 200, headers: { 'Content-Range': '*/3' }, body: '[]' });
    });
    await page.route('**/rest/v1/profiles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ role: 'super_admin' }]),
      });
    });

    // 1. Storage state provides auth. Navigate to dashboard directly.
    await page.goto('/dashboard');
  });

  test('Dashboard layout visually matches golden image', async ({ page }) => {
    // Wait until network is idle to ensure all charts/data are loaded
    await page.waitForLoadState('networkidle');

    // Also explicitly wait for the Title text to be visible so we know it's not the loader
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 15000 });

    // Hide any dynamic elements like timestamps or charts with animations if they are volatile
    // e.g. `<div class="recharts-wrapper">` using masking

    // Take screenshot and compare with 2% Max Diff Pixel Ratio
    await expect(page).toHaveScreenshot('dashboard-layout.png', {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
      // Masking animated charts if needed to prevent false positives
      mask: [page.locator('.recharts-wrapper')],
    });
  });
});

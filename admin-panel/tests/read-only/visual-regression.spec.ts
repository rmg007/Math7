import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS } from '../test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

/**
 * Visual Regression Tests — Tier 2
 *
 * These tests capture screenshots of key pages and compare them against
 * stored baselines. They catch CSS regressions, layout shifts, and
 * responsive breakpoint issues.
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test tests/visual-regression.spec.ts --update-snapshots
 */

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#login-email', TEST_USERS.SUPER_ADMIN.email);
  await page.fill('#login-password', TEST_USERS.SUPER_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  // Wait for any loading animations to settle
  await page.waitForTimeout(1500);
}

test.describe('Visual Regression — Key Pages @responsive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      mask: [
        page.locator('main'), // Dashboard content is highly dynamic (counters, charts, feeds)
      ],
    });
  });

  test('Domains List', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('domains-list.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('tbody')],
    });
  });

  test('Skills List', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('skills-list.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('tbody')],
    });
  });

  test('Questions List', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('questions-list.png', {
      fullPage: true,
      mask: [
        page.locator('time'),
        page.locator('tbody'), // mask dynamic table data
      ],
    });
  });

  test('Login Page (logged out)', async ({ page }) => {
    // Navigate to login without being logged in
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-page.png');
  });
});

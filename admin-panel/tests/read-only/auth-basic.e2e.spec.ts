import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

/**
 * Basic Authentication Tests — @smoke
 * Tests the core login/logout flow and route protection.
 *
 * ⚠️ Runs in 'unauthenticated' project (no global storageState).
 */
test.describe('Authentication @smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Admin/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Platform Overview/i).first()).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Find and click logout button
    const getLogoutBtn = () =>
      page
        .locator(
          '#logout-button, #logout-button-desktop, #logout-button-mobile, [aria-label="Sign Out"], [title="Sign Out"]'
        )
        .filter({ visible: true })
        .first();

    const logoutBtn = getLogoutBtn();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    } else {
      // Fallback
      const anySignOut = page
        .locator('button:has-text("Sign Out")')
        .filter({ visible: true })
        .first();
      if (await anySignOut.isVisible()) {
        await anySignOut.click();
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      }
    }
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/domains');
    await expect(page).toHaveURL(/\/login/);
  });
});

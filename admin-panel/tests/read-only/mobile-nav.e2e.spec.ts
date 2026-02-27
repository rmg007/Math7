import { expect, test } from '@playwright/test';
import { ensureMobileMenuOpen } from '../test-utils';

/**
 * Mobile Navigation Tests — @responsive
 * Verifies hamburger menu and mobile-specific navigation patterns.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('Mobile Navigation @responsive', () => {
  test.skip(({ isMobile }) => !isMobile, 'Only runs on mobile viewports');

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/dashboard');

    const menuBtn = page.locator('button[aria-label*="menu"], button[class*="md:hidden"]').first();
    await expect(menuBtn).toBeVisible();

    await menuBtn.click();
    await page.waitForTimeout(600); // Animation

    // Verify menu items are visible
    await expect(
      page.locator('a[href="/domains"]').filter({ visible: true }).first()
    ).toBeVisible();

    // Close menu (clicking outside or close button if it exists)
    // Here we can click the menu button again if it's a toggle
    await menuBtn.click();
    await page.waitForTimeout(600);

    await expect(
      page.locator('a[href="/domains"]').filter({ visible: true }).first()
    ).not.toBeVisible();
  });

  test('should navigate via mobile menu', async ({ page }) => {
    await page.goto('/dashboard');
    await ensureMobileMenuOpen(page);

    const questionsLink = page.locator('a[href="/questions"]').filter({ visible: true }).first();
    await questionsLink.click();

    await expect(page).toHaveURL(/\/questions/);
  });
});

import { expect, test } from '@playwright/test';
import { ensureMobileMenuOpen } from '../test-utils';

/**
 * Dashboard & Navigation Tests — @smoke
 * Tests the heartbeat of the admin panel: dashboard loading and primary navigation.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('Dashboard & Navigation @smoke', () => {
  test('should load dashboard @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for either the dashboard header or the platform overview text
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Platform overview/i)).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to different sections from dashboard @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await ensureMobileMenuOpen(page);

    const domainsLink = page.locator('a[href="/domains"]').filter({ visible: true }).first();
    await domainsLink.scrollIntoViewIfNeeded().catch(() => {});
    await domainsLink.click({ force: true, timeout: 10000 });
    await expect(page).toHaveURL(/\/domains/, { timeout: 10000 });

    await page.goto('/dashboard');
    await ensureMobileMenuOpen(page);
    const skillsLink = page.locator('a[href="/skills"]').filter({ visible: true }).first();
    await skillsLink.scrollIntoViewIfNeeded().catch(() => {});
    await skillsLink.click({ force: true, timeout: 10000 });
    await expect(page).toHaveURL(/\/skills/, { timeout: 10000 });

    await page.goto('/dashboard');
    await ensureMobileMenuOpen(page);
    const questionsLink = page.locator('a[href="/questions"]').filter({ visible: true }).first();
    await questionsLink.scrollIntoViewIfNeeded().catch(() => {});
    await questionsLink.click({ force: true, timeout: 10000 });
    await expect(page).toHaveURL(/\/questions/, { timeout: 10000 });
  });
});
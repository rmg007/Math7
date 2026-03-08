import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

test.describe('Grid Layout Standards @responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    // Use selectors matching admin-panel.e2e.spec.ts
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Subjects table should not have icons before title @responsive', async ({ page }) => {
    await page.goto('/subjects');

    // Wait for table to load
    await page.waitForSelector('table');

    // Ensure we have rows. If not, this test can't verify the structure.
    // In a real scenario we'd seed data, but here we assume the env has data or previous tests ran.
    // Failing that, we check if rows exist.
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      test.skip('No subjects found to verify layout');
      return;
    }

    // Check first row's title cell
    const firstRow = page.locator('tbody tr').first();

    // The previous implementation had a div with 12x12 classes (w-12 h-12) containing an icon before the title
    // We want to ensure there is NO such icon container in the title cell
    const titleCell = firstRow.locator('td').nth(0); // Title is first column

    // Check for the specific icon container class structure we want to remove
    const iconContainer = titleCell.locator('.w-12.h-12');
    await expect(iconContainer).not.toBeVisible();
  });

  test('Domains table status column should be single line @responsive', async ({ page }) => {
    await page.goto('/domains');

    // Wait for table to load
    await page.waitForSelector('table');

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      test.skip('No domains found to verify layout');
      return;
    }

    const firstRow = page.locator('tbody tr').first();
    // Status is the 6th column (index 5) in DomainList.tsx
    const statusCell = firstRow.locator('td').nth(5);

    // Verify whitespace-nowrap class exists
    await expect(statusCell).toHaveClass(/whitespace-nowrap/);
  });
});

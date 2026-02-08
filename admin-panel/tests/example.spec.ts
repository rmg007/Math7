import { test, expect } from '@playwright/test';

test('admin panel loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Admin/);
});

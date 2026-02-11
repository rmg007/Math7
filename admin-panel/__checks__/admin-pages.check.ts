import { test, expect } from '@playwright/test';

// Admin Panel CRUD Pages Readability Check
// P1 Important: Verifies logged-in admin can view all key management pages
// Read-only checks - no data mutations

const adminUrl = process.env.ADMIN_URL || 'https://questerix-admin.pages.dev';

test('Admin CRUD pages — verify all management pages load', async ({ page }) => {
  // Login first
  const email = process.env.MONITOR_USER_EMAIL || '';
  const password = process.env.MONITOR_USER_PASSWORD || '';
  await page.goto(`${adminUrl}/login`);
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Check Domains page
  await page.goto(`${adminUrl}/domains`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Curriculum Domains')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();

  // Check Skills page
  await page.goto(`${adminUrl}/skills`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Curriculum Skills')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();

  // Check Questions page
  await page.goto(`${adminUrl}/questions`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Question Registry')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();

  // Check AI Import page
  await page.goto(`${adminUrl}/ai-import`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Curriculum Nexus')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();

  // Verify still logged in after navigation
  await expect(page.locator('#login-email')).not.toBeVisible();
});

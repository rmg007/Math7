import { test, expect } from '@playwright/test';

// Admin Panel Login Flow Check
// P0 Critical: Verifies a real user can log in and access the dashboard
// Adapted from admin-panel.e2e.spec.ts but production-safe

const adminUrl = process.env.ADMIN_URL || 'https://questerix-admin.pages.dev';

test('Admin login flow — login and reach dashboard', async ({ page }) => {
  const email = process.env.MONITOR_USER_EMAIL || '';
  const password = process.env.MONITOR_USER_PASSWORD || '';

  if (!email || !password) {
    throw new Error('MONITOR_USER_EMAIL and MONITOR_USER_PASSWORD environment variables must be set');
  }

  await page.goto(`${adminUrl}/login`);

  // Fill login form
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Verify dashboard loaded
  await expect(page.getByText('Curriculum Domains')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15000 });

  // Verify we're actually logged in (no login form visible)
  await expect(page.locator('#login-email')).not.toBeVisible();
  await expect(page.locator('#login-password')).not.toBeVisible();

  // Check for any error messages
  await expect(page.locator('[role="alert"]')).not.toBeVisible();
});

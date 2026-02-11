import { test, expect } from '@playwright/test';

// Admin Panel Login Flow Check
// P0 Critical: Verifies a real user can log in and access the dashboard
// Adapted from admin-panel.e2e.spec.ts but production-safe

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Use production URL from environment variable
    const adminUrl = process.env.ADMIN_URL || 'https://questerix-admin.pages.dev';
    await page.goto(`${adminUrl}/login`);
  });

  test('should allow admin to login and reach dashboard', async ({ page }) => {
    // Use dedicated monitoring account (not super admin)
    const email = process.env.MONITOR_USER_EMAIL || '';
    const password = process.env.MONITOR_USER_PASSWORD || '';

    if (!email || !password) {
      throw new Error('MONITOR_USER_EMAIL and MONITOR_USER_PASSWORD environment variables must be set');
    }

    // Fill login form
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    
    // Verify dashboard loaded - look for key navigation elements
    await expect(page.getByText('Curriculum Domains')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15000 });
    
    // Verify we're actually logged in (no login form visible)
    await expect(page.locator('#login-email')).not.toBeVisible();
    await expect(page.locator('#login-password')).not.toBeVisible();
    
    // Check for any error messages
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    // Test with invalid credentials to verify error handling
    await page.fill('#login-email', 'invalid@example.com');
    await page.fill('#login-password', 'invalidpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message, not redirect
    await expect(page.locator('[role="alert"], .error, .alert')).toBeVisible({ timeout: 10000 });
    
    // Should still be on login page
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });
});

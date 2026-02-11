import { test, expect } from '@playwright/test';

// Admin Panel CRUD Pages Readability Check
// P1 Important: Verifies logged-in admin can view all key management pages
// Read-only checks - no data mutations

test.describe('Admin CRUD Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display domains list page', async ({ page }) => {
    await page.goto('/domains');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify key elements are present
    await expect(page.getByText('Curriculum Domains')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'New Domain' })).toBeVisible({ timeout: 15000 });
    
    // Verify table structure (even if empty)
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check for no error messages
    await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();
  });

  test('should display skills list page', async ({ page }) => {
    await page.goto('/skills');
    
    await page.waitForLoadState('networkidle');
    
    // Verify key elements
    await expect(page.getByText('Curriculum Skills')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'New Skill' })).toBeVisible({ timeout: 15000 });
    
    // Verify table structure
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check for no errors
    await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();
  });

  test('should display questions list page', async ({ page }) => {
    await page.goto('/questions');
    
    await page.waitForLoadState('networkidle');
    
    // Verify key elements
    await expect(page.getByText('Question Registry')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'New Question' })).toBeVisible({ timeout: 15000 });
    
    // Verify table structure
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10000 });
    
    // Check for no errors
    await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();
  });

  test('should display AI import page', async ({ page }) => {
    await page.goto('/ai-import');
    
    await page.waitForLoadState('networkidle');
    
    // Verify AI import interface
    await expect(page.getByText('Curriculum Nexus')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'AI Prompt' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'CSV Upload' })).toBeVisible({ timeout: 15000 });
    
    // Check for no errors
    await expect(page.locator('[role="alert"], .error, .alert')).not.toBeVisible();
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Test that navigation works and doesn't break authentication
    await page.goto('/domains');
    await expect(page.getByText('Curriculum Domains')).toBeVisible();
    
    await page.goto('/skills');
    await expect(page.getByText('Curriculum Skills')).toBeVisible();
    
    await page.goto('/questions');
    await expect(page.getByText('Question Registry')).toBeVisible();
    
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Should still be logged in (no redirect to login)
    await expect(page.locator('#login-email')).not.toBeVisible();
  });
});

// Helper to login before each test
async function login(page: import('@playwright/test').Page) {
  const adminUrl = process.env.ADMIN_URL || 'https://questerix-admin.pages.dev';
  const email = process.env.MONITOR_USER_EMAIL || '';
  const password = process.env.MONITOR_USER_PASSWORD || '';

  await page.goto(`${adminUrl}/login`);
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

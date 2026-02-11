import { test, expect } from '@playwright/test';

// Landing Pages Check
// P1 Important: Verifies public-facing pages load correctly and render content
// No authentication required

test.describe('Landing Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.log('Console error:', message.text());
      }
    });
  });

  test('should display home page correctly', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(landingUrl);
    
    await page.waitForLoadState('networkidle');
    
    // Verify page loads with proper title
    await expect(page).toHaveTitle(/Questerix/i);
    
    // Verify key hero section elements
    await expect(page.locator('h1, .hero, .hero-title').first()).toBeVisible({ timeout: 15000 });
    
    // Check for navigation
    await expect(page.locator('nav, .navigation, .navbar').first()).toBeVisible({ timeout: 10000 });
    
    // Verify no major console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForTimeout(2000); // Wait for any async errors
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404'))).toHaveLength(0);
  });

  test('should display about page', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(`${landingUrl}/about`);
    
    await page.waitForLoadState('networkidle');
    
    // Verify about page content
    await expect(page.locator('h1, h2').filter({ hasText: /about/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Should have meaningful content
    await expect(page.locator('p, .content').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display how-it-works page', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(`${landingUrl}/how-it-works`);
    
    await page.waitForLoadState('networkidle');
    
    // Verify how it works content
    await expect(page.locator('h1, h2').filter({ hasText: /how it works/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Should have steps or process description
    await expect(page.locator('.step, .process, .feature').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display privacy policy', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(`${landingUrl}/privacy`);
    
    await page.waitForLoadState('networkidle');
    
    // Verify privacy policy
    await expect(page.locator('h1, h2').filter({ hasText: /privacy/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Should have privacy content
    await expect(page.locator('p, .content').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display terms of service', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(`${landingUrl}/terms`);
    
    await page.waitForLoadState('networkidle');
    
    // Verify terms page
    await expect(page.locator('h1, h2').filter({ hasText: /terms/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Should have terms content
    await expect(page.locator('p, .content').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle navigation correctly', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    await page.goto(landingUrl);
    
    // Test navigation links work
    const aboutLink = page.locator('a[href*="about"], a:has-text("About")').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/);
    }
    
    // Test back navigation
    await page.goBack();
    await expect(page).toHaveURL(landingUrl + '/');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(landingUrl);
    
    await page.waitForLoadState('networkidle');
    
    // Verify mobile menu or navigation works
    await expect(page.locator('nav, .navigation, .navbar, .mobile-menu').first()).toBeVisible({ timeout: 15000 });
    
    // Content should still be readable
    await expect(page.locator('h1, .hero, .hero-title').first()).toBeVisible({ timeout: 10000 });
  });
});

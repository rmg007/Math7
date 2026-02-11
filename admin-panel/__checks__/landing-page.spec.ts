import { test, expect } from '@playwright/test';

// Landing Pages Check
// P1 Important: Verifies public-facing pages load correctly and render content
// No authentication required

const landingUrl = process.env.LANDING_URL || 'https://questerix-landing.pages.dev';

test('Landing pages — verify home and key pages load', async ({ page }) => {
  // Track console errors
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Check home page
  await page.goto(landingUrl);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Questerix/i);
  await expect(page.locator('h1, .hero, .hero-title').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('nav, .navigation, .navbar').first()).toBeVisible({ timeout: 10000 });

  // Check how-it-works page
  await page.goto(`${landingUrl}/how-it-works`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });

  // Check mobile responsiveness
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(landingUrl);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1, .hero, .hero-title').first()).toBeVisible({ timeout: 10000 });

  // Verify no critical console errors (ignore favicon/404)
  const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
  expect(criticalErrors).toHaveLength(0);
});

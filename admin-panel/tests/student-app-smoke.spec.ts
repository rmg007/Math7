import { expect, test } from '@playwright/test';

/**
 * Student App Smoke Suite
 *
 * Target URL is set via BASE_URL env var during deployment.
 * These tests are strictly read-only and check for critical failures
 * not caught by static analysis.
 */

test.describe('Student App Infrastructure @student-smoke', () => {
  test('Homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Flutter web can have title either from index.html (student_app) or set by Flutter (Questerix)
    await expect(page).toHaveTitle(/(student_app|Questerix)/);
  });

  test('No critical JavaScript errors in console', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
      console.error('Page Error:', err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Specifically catch known project bugs.
        if (
          text.includes('NoSuchMethodError') ||
          text.includes('PostgrestException') ||
          text.includes('column') ||
          text.includes('method not found')
        ) {
          errors.push(text);
          console.error('Console Error:', text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Give Flutter time to boot and trigger any initialization errors
    await page.waitForTimeout(7000);

    // Fail if any critical errors appeared
    expect(errors, `Found critical errors in console: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('Supabase RPC pull_changes succeeds', async ({ page }) => {
    const rpcFailures: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/rpc/pull_changes')) {
        if (response.status() >= 400) {
          rpcFailures.push(`${url} returned ${response.status()}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // The sync service usually triggers shortly after boot
    await page.waitForTimeout(7000);

    // Filter out expected errors (like 401 if unauthenticated, though usually it's a 200 with empty data)
    // Actually our RPC hardening allows anon read, but pull_changes might require auth.
    // If it's a 401, it's not a SCHEMA error (5xx or column error).
    const criticalFailures = rpcFailures.filter((f) => !f.includes('401'));

    expect(
      criticalFailures,
      `RPC pull_changes failed with schema/network error: ${criticalFailures.join(', ')}`
    ).toHaveLength(0);
  });

  test('Main shell or Login renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(7000);

    // Flutter Web renders into a custom element called <flt-glass-pane>
    const flutterPane = page.locator('flt-glass-pane');
    await expect(flutterPane).toBeAttached({ timeout: 15000 });
  });
});

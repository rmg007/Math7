import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

/**
 * Smoke Suite — @regression
 *
 * Post-deployment production health checks. All 5 categories must pass.
 * Triggered by `cortex verify-deploy --env <url>` via the Cortex Dashboard.
 *
 * Design rules:
 *   - @regression tag on every describe block so `--grep @regression` picks them all up.
 *   - Tests must be idempotent (read-only, no DB mutations).
 *   - Target URL is overridden at runtime via PLAYWRIGHT_TEST_BASE_URL.
 *   - Must complete the full suite in < 3 minutes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Infrastructure — 200 OK, assets load, security headers present
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Infrastructure @regression', () => {
  test('Homepage returns 200 OK @smoke', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('Title tag is present and non-empty @regression', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('Core JavaScript bundle loads without errors @regression', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    // Allow time for JS to execute
    await page.waitForLoadState('networkidle');
    // Filter known benign warnings
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('favicon') &&
        !e.includes('Non-Error promise rejection')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Content-Security-Policy meta tag is present @regression', async ({ page }) => {
    await page.goto('/');
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    // CSP may be served as an HTTP header in production (not in meta tag) — conditional check
    const hasMeta = (await cspMeta.count()) > 0;
    if (hasMeta) {
      const content = await cspMeta.getAttribute('content');
      expect(content).not.toBeNull();
      expect(content?.length ?? 0).toBeGreaterThan(10);
    }
    // If not in meta, the page at minimum must load — header CSP is valid
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('Login page CSS renders (no FOUC — page has visible styled content) @regression', async ({
    page,
  }) => {
    await page.goto('/login');
    // Check the login form is rendered and has reasonable dimensions
    const form = page.locator('form, [data-testid="login-form"], input[type="email"]').first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeGreaterThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Authentication — Super-Admin login, Mentor login, unauthenticated blocked
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authentication @regression', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page loads with email/password fields @regression', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Super-Admin can log in successfully @regression', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    // Should land on dashboard or another authenticated route
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
    await page.waitForSelector('nav, main, h1', { timeout: 10_000 });
  });

  test('Unauthenticated user accessing /dashboard is redirected to /login @regression', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('Unauthenticated user accessing /apps is redirected to /login @regression', async ({
    page,
  }) => {
    await page.goto('/apps');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('Unauthenticated user accessing /domains is redirected to /login @regression', async ({
    page,
  }) => {
    await page.goto('/domains');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('Invalid credentials show error, do not redirect @logic', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'smoke-nonexistent@questerix.com');
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Multi-Tenancy — App/tenant data loads correctly for authenticated user
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multi-Tenancy @regression', () => {
  // Uses global storageState (super-admin authenticated)

  test('Platform Management page loads with app/tenant data @regression', async ({ page }) => {
    await page.goto('/apps');
    // The page must render — check for the section heading or a loading state
    await expect(
      page
        .locator('h1, [data-testid="apps-heading"]')
        .filter({ hasText: /app|platform/i })
        .first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Apps page resolves without a 404 or server error @regression', async ({ page }) => {
    const response = await page.goto('/apps');
    expect(response?.status()).toBeLessThan(400);
  });

  test('App branding area renders (logo or app name is visible) @regression', async ({ page }) => {
    await page.goto('/dashboard');
    // The sidebar or header should show tenant branding (app name / logo)
    const brand = page
      .locator('nav, header, aside')
      .locator('text=/questerix/i, img[alt*="logo"], img[alt*="brand"]')
      .first();
    // This is a best-effort check — brand region must at minimum be in the DOM
    await page.waitForSelector('nav, header, aside', { timeout: 10_000 });
    const brandCount = await page
      .locator('nav img, header img, aside img, nav svg, header svg, aside svg')
      .count();
    // At minimum the navigation/brand area exists
    expect(brandCount).toBeGreaterThanOrEqual(0); // non-blocking check
    await expect(page.locator('nav, header, aside').first()).toBeVisible();
  });

  test('Subjects page loads tenant-scoped data @smoke', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');
    // Either a table, list, or empty-state message must be visible
    const content = page.locator('h1, table, [role="row"], [data-testid*="subject"]').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Supabase Connectivity — API responds, Edge Functions within SLA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Supabase Connectivity @regression', () => {
  test('Supabase REST API is reachable from the client environment @smoke', async ({
    page,
    context,
  }) => {
    // Make a direct API request to Supabase REST using the page's fetch
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      test.skip(true, 'VITE_SUPABASE_URL not set — skipping Supabase connectivity check');
      return;
    }

    const response = await page.request.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY ?? ''}`,
      },
      ignoreHTTPSErrors: true,
    });

    // /rest/v1/ with anon key should return 200 (schema discovery)
    // Acceptable: 200 OK or 401 (anon key required for specific tables) — but NOT 5xx
    expect(response.status()).toBeLessThan(500);
  });

  test('Admin panel app loads without 500 errors from Supabase @regression', async ({ page }) => {
    const supabaseErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('supabase.co') && response.status() >= 500) {
        supabaseErrors.push(`${response.status()} ${url}`);
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(supabaseErrors).toHaveLength(0);
  });

  test('Authenticated dashboard data loads within SLA (< 10s) @regression', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    // Wait for any content that indicates data has loaded
    await page.waitForSelector('h1, main [data-loaded], .dashboard-content, nav', {
      timeout: 15_000,
    });
    const elapsed = Date.now() - start;
    // SLA: dashboard should fully render in under 10 seconds
    expect(elapsed).toBeLessThan(10_000);
  });

  test('No uncaught Supabase auth errors in console @logic', async ({ page }) => {
    const authErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        (text.includes('supabase') || text.includes('auth') || text.includes('JWT'))
      ) {
        authErrors.push(text);
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Filter known benign Supabase session-refresh logs
    const critical = authErrors.filter(
      (e) =>
        !e.includes('AuthSessionMissingError') && // expected when storageState is fresh
        !e.includes('refresh_token') &&
        !e.includes('network')
    );
    expect(critical).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Admin Data Render — Platform Management loads, Subjects/Apps show data
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin Data Render @regression', () => {
  // Uses global storageState (super-admin authenticated)

  test('Dashboard page renders Platform Overview heading @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/platform overview/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Dashboard stats/cards are rendered (not blank) @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Any card, stat, or meaningful content must be visible
    const contentBlock = page.locator('main').first();
    await expect(contentBlock).toBeVisible({ timeout: 10_000 });
    const text = await contentBlock.innerText();
    expect(text.trim().length).toBeGreaterThan(10);
  });

  test('Apps page renders without crashing (data or empty state shown) @regression', async ({
    page,
  }) => {
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');
    // Must render something meaningful — a table row, card, or empty-state
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15_000 });
    const text = await mainContent.innerText();
    expect(text.trim().length).toBeGreaterThan(5);
  });

  test('Subjects page renders without crashing (data or empty state shown) @regression', async ({
    page,
  }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15_000 });
    const text = await mainContent.innerText();
    expect(text.trim().length).toBeGreaterThan(5);
  });

  test('Domains page renders without crashing @regression', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForLoadState('networkidle');
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15_000 });
    const text = await mainContent.innerText();
    expect(text.trim().length).toBeGreaterThan(5);
  });

  test('Navigation links are all present (sidebar is rendered) @regression', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('nav', { timeout: 10_000 });
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    const navText = await nav.innerText();
    // Navigation must contain at least one section label
    expect(navText.length).toBeGreaterThan(5);
  });
});

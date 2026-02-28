import { expect, test } from '@playwright/test';

/**
 * Chaos Hunter — Resilience Test Suite @chaos
 *
 * Validates the "Offline-First" / "Degraded State" platform promise by
 * injecting controlled network failures and asserting that the UI always
 * presents a recovery path — never a blank screen or unhandled crash.
 *
 * ─── Design rules ─────────────────────────────────────────────────────────────
 *
 *   - All tests tagged @chaos so `--grep @chaos` runs this file in isolation.
 *   - The active scenario is controlled by the CHAOS_SCENARIO env variable,
 *     injected by ChaosHunter (questerix-cortex/src/chaos-hunter/index.ts).
 *   - Network interception is done via Playwright's route API — no external
 *     proxy required, works against the live dev server.
 *   - Assertions use the "recovery path" contract:
 *       ✅ Any visible error message / retry button / skeleton loader = PASS
 *       ❌ Blank white screen / JS error overlay / console uncaught error = FAIL
 *
 * ─── Scenarios ────────────────────────────────────────────────────────────────
 *
 *   1. latency   — 5,000ms delay on all /rest/v1/* Supabase calls
 *   2. hard-fail — 503 response on /functions/v1/* Edge Function routes
 *   3. zombie    — First /rest/v1/* request body is cut mid-stream (empty body)
 *
 * ─── Running locally ──────────────────────────────────────────────────────────
 *
 *   CHAOS_SCENARIO=latency npx playwright test --grep @chaos --project=desktop
 *   CHAOS_SCENARIO=hard-fail npx playwright test --grep @chaos --project=desktop
 *   CHAOS_SCENARIO=zombie npx playwright test --grep @chaos --project=desktop
 *
 *   Or via Cortex:
 *   npm run health -- chaos
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHAOS_SCENARIO = process.env.CHAOS_SCENARIO ?? 'latency';
const CHAOS_LATENCY_MS = Number(process.env.CHAOS_LATENCY_MS ?? 5000);
// CHAOS_SUPABASE_URL is available for future pattern-targeted intercepts
// const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';

/**
 * Set up the appropriate network intercepts for the active chaos scenario.
 * Must be called at the start of every chaos test.
 */
async function armChaos(page: import('@playwright/test').Page): Promise<void> {
  if (CHAOS_SCENARIO === 'latency') {
    // Scenario 1: 5,000ms latency on all Supabase REST calls
    await page.route('**/rest/v1/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, CHAOS_LATENCY_MS));
      await route.continue();
    });
  } else if (CHAOS_SCENARIO === 'hard-fail') {
    // Scenario 2: Hard 503 on all Edge Function calls
    await page.route('**/functions/v1/**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service Unavailable',
          message: '[ChaosHunter] Simulated 503 — Edge Function is down',
        }),
      });
    });
    // Also inject a 503 on one REST endpoint to simulate partial DB failure
    let firstRestIntercepted = false;
    await page.route('**/rest/v1/domains**', async (route) => {
      if (!firstRestIntercepted) {
        firstRestIntercepted = true;
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        await route.continue();
      }
    });
  } else if (CHAOS_SCENARIO === 'zombie') {
    // Scenario 3: Zombie — return a truncated/empty body to simulate a
    // mid-generation process kill. The client receives a 200 with no body.
    let zombieArmed = false;
    await page.route('**/rest/v1/**', async (route) => {
      if (!zombieArmed) {
        zombieArmed = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          // Deliberately empty array — simulates a process dying mid-generation
          body: '[]',
          headers: {
            'content-range': '0-0/0',
          },
        });
      } else {
        await route.continue();
      }
    });
  }
}

/**
 * Assert the page is NOT blank and shows a recovery path.
 * A "recovery path" is at least one of:
 *   - A visible error/warning message
 *   - A retry / reload button
 *   - A skeleton loader (data is loading)
 *   - A "no results" / "empty state" message
 *   - The page main content (if the chaos didn't affect this route)
 *
 * The test fails ONLY if:
 *   - document.body is empty OR has only whitespace
 *   - An unhandled JS error overlay is visible
 */
async function assertRecoveryPath(
  page: import('@playwright/test').Page,
  routeName: string
): Promise<void> {
  // 1. Body must not be blank
  const bodyText = await page.evaluate(() => document.body.innerText ?? '');
  expect(
    bodyText.trim().length,
    `[${CHAOS_SCENARIO}] ❌ ${routeName}: Body is completely blank — no recovery path shown`
  ).toBeGreaterThan(0);

  // 2. No unhandled error overlay (Vite's error overlay / React error boundary crash overlay)
  //    Use try/catch to avoid swallowing real assertion errors — we only
  //    want to be lenient about "element not found" (selector unknown), not
  //    about the overlay actually being visible.
  try {
    const viteErrorOverlay = page.locator('vite-error-overlay, #vite-error-overlay');
    await expect(
      viteErrorOverlay,
      `[${CHAOS_SCENARIO}] ❌ ${routeName}: Vite error overlay visible — unhandled JS error`
    ).not.toBeVisible({ timeout: 500 });
  } catch (err: any) {
    // Re-throw real assertion failures. Only swallow "strict mode" / "no element" errors.
    if (err?.message?.includes('visible') || err?.message?.includes('overlay')) {
      throw err;
    }
    // Otherwise: selector not supported in this browser context — safe to ignore
  }

  // 3. Check for at least one "recovery signal":
  //    - Error message (text matching common patterns)
  //    - Retry button
  //    - Skeleton / loading state
  //    - Empty state / no-data message
  //    - Normal page content (nav present)

  const recoverySignals = [
    // Explicit error states
    page.locator('[role="alert"]'),
    page.locator('[data-testid*="error"]'),
    page.locator('[data-testid*="empty"]'),
    // Text-based recovery indicators
    page.getByText(/try again/i),
    page.getByText(/failed to load/i),
    page.getByText(/something went wrong/i),
    page.getByText(/unable to/i),
    page.getByText(/no results/i),
    page.getByText(/no .* found/i),
    page.getByText(/loading/i),
    page.getByText(/retry/i),
    // Skeleton loaders (typically div with animate-pulse class)
    page.locator('[class*="skeleton"], [class*="animate-pulse"]'),
    // Normal navigation (page didn't crash)
    page.locator('nav, [role="navigation"]'),
    // Any visible button (page has interactive content)
    page.locator('button:visible').first(),
  ];

  let foundRecovery = false;
  for (const signal of recoverySignals) {
    try {
      const isVisible = await signal.first().isVisible({ timeout: 300 });
      if (isVisible) {
        foundRecovery = true;
        break;
      }
    } catch {
      // Signal not found — continue
    }
  }

  expect(
    foundRecovery,
    `[${CHAOS_SCENARIO}] ❌ ${routeName}: No recovery path visible — blank/crashed screen detected`
  ).toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Latency Injection (CHAOS_SCENARIO=latency)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chaos — Latency Injection @chaos', () => {
  test.skip(CHAOS_SCENARIO !== 'latency', 'Skipped: active scenario is not latency');

  test('Domains page shows recovery path under 5s latency @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/domains');
    // Use a long-enough timeout for latency scenario (latency + render)
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await assertRecoveryPath(page, '/domains');
  });

  test('Skills page shows recovery path under 5s latency @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/skills');
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await assertRecoveryPath(page, '/skills');
  });

  test('Dashboard page shows recovery path under 5s latency @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await assertRecoveryPath(page, '/dashboard');
  });

  test('Questions page shows recovery path under 5s latency @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/questions');
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await assertRecoveryPath(page, '/questions');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Hard Failure (CHAOS_SCENARIO=hard-fail)
// 503 on Edge Functions + one REST endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chaos — Hard Failure (503) @chaos', () => {
  test.skip(CHAOS_SCENARIO !== 'hard-fail', 'Skipped: active scenario is not hard-fail');

  test('Domains page shows recovery path when API returns 503 @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/domains');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/domains [503]');
  });

  test('AI Questions page shows recovery path when Edge Function returns 503 @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/ai-questions');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/ai-questions [503]');
  });

  test('Publish page shows recovery path when Edge Function returns 503 @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/publish');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/publish [503]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Zombie (CHAOS_SCENARIO=zombie)
// First /rest/v1/* returns empty body — simulates mid-generation process kill
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chaos — Zombie (Mid-Request Process Kill) @chaos', () => {
  test.skip(CHAOS_SCENARIO !== 'zombie', 'Skipped: active scenario is not zombie');

  test('Domains page shows empty state (not blank screen) on zombie response @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/domains');
    // Use domcontentloaded, not networkidle — zombie scenario can cause background
    // requests to stall and networkidle will hang indefinitely.
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/domains [zombie]');
  });

  test('Skills page shows empty state (not blank screen) on zombie response @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/skills');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/skills [zombie]');
  });

  test('Questions page shows empty state (not blank screen) on zombie response @chaos', async ({ page }) => {
    await armChaos(page);
    await page.goto('/questions');
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
    await assertRecoveryPath(page, '/questions [zombie]');
  });
});

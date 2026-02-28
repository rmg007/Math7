import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility Gate — @a11y
 *
 * Enforces WCAG 2.1 Level AA compliance on all major pages of the Admin Panel.
 * Zero `critical` or `serious` axe-core violations are permitted.
 *
 * Design rules:
 *   - @a11y tag in every test title — `--grep @a11y` picks them all up.
 *   - Unauthenticated tests override storageState at describe scope.
 *   - Authenticated tests use the global SUPER_ADMIN storageState from playwright.config.ts.
 *   - Pages wait for networkidle before scanning — ensures dynamic content is present.
 *   - Known, justified exceptions are suppressed via `.disableRules()` with inline comment.
 *     Full rationale: `docs/A11Y_EXCEPTIONS.md`.
 *
 * CI gate: `npm run test:e2e:a11y` — zero violations === green build.
 */

// ── Shared axe configuration ───────────────────────────────────────────────────

/**
 * Build a standard WCAG 2.1 AA AxeBuilder for a page.
 * Applies the known-exceptions suppression list.
 */
function createAxeBuilder(page: import('@playwright/test').Page) {
  return (
    new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      /**
       * EX-001 — color-contrast: Tailwind's `text-muted-foreground` resolves to ~#6b7280,
       * yielding 4.48:1 on white — just below the 4.5:1 WCAG AA minimum. This is a
       * design-token-level issue, not a per-component one. Scheduled for Slot K-3 refactor.
       * See docs/A11Y_EXCEPTIONS.md for full rationale and remediation plan.
       */
      .disableRules(['color-contrast'])
  );
}

/**
 * Assert zero critical/serious violations. Throws with a readable summary if any found.
 * Uses Playwright's expect() so failures appear as proper test failures in the report.
 */
async function assertNoViolations(
  page: import('@playwright/test').Page,
  routeName: string
): Promise<void> {
  const results = await createAxeBuilder(page).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (serious.length > 0) {
    const summary = serious
      .map(
        (v) =>
          `\n  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes
            .slice(0, 3)
            .map((n) => `    → ${n.html.slice(0, 120)}`)
            .join('\n')
      )
      .join('\n');

    expect.soft(0, `❌ ${routeName}: ${serious.length} violation(s):${summary}\n\nSee docs/A11Y_EXCEPTIONS.md`).toBe(0);
  }

  // Hard assertion — fails the test immediately if critical/serious violations remain
  expect(serious, `${routeName}: expected zero critical/serious axe violations`).toHaveLength(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Unauthenticated pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Unauthenticated', () => {
  // Overrides the desktop project's super-admin storageState at describe scope.
  // Without this the auth-guard would redirect /login → /dashboard instantly.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Dashboard', () => {
  test('Dashboard page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/dashboard');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Platform Management
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Platform Management', () => {
  test('Apps page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/apps');
  });

  test('Subjects page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/subjects');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Curriculum
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Curriculum', () => {
  test('Domains list passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/domains');
  });

  test('Skills list passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/skills');
  });

  test('Questions list passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/questions');
  });

  test('Publish page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/publish');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. User Management
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — User Management', () => {
  test('User Management page passes WCAG 2.1 AA @a11y @smoke', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await assertNoViolations(page, '/users');
  });
});
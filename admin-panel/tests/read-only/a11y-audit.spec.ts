import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility Gate — @a11y
 *
 * Enforces WCAG 2.1 Level AA compliance on all major pages of the Admin Panel.
 * Zero `critical` or `serious` axe-core violations are permitted.
 *
 * Design rules:
 *   - @a11y tag on every test so `--grep @a11y` picks them all up.
 *   - Unauthenticated tests use empty storageState.
 *   - Authenticated tests use the default SUPER_ADMIN storageState from playwright.config.ts.
 *   - Each page waits for networkidle before scanning — ensures dynamic content is present.
 *   - Known, justified exceptions are suppressed via `.disableRules()` with a comment.
 *     Full rationale is in `docs/A11Y_EXCEPTIONS.md`.
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
       * color-contrast: Tailwind's `text-muted-foreground` (#6b7280 on white #fff)
       * yields a 4.5:1 ratio on dark mode backgrounds but falls below 4.5:1 on
       * light mode `bg-muted` (#f1f5f9) for some secondary labels.
       * Tracked in docs/A11Y_EXCEPTIONS.md — EX-001.
       * Remediation: swap `text-muted-foreground` for `text-foreground/70` on
       * form helper text. Scheduled for Slot K-3 design token refactor.
       */
      .disableRules(['color-contrast'])
  );
}

/**
 * Assert zero critical/serious violations. Provide a readable failure message.
 */
function expectNoViolations(violations: import('axe-core').Result[], page: string) {
  const serious = violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (serious.length > 0) {
    const summary = serious
      .map(
        (v) =>
          `\n  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
          v.nodes
            .slice(0, 3)
            .map((n) => `    → ${n.html.slice(0, 100)}`)
            .join('\n')
      )
      .join('\n');

    throw new Error(
      `❌ ${page}: ${serious.length} critical/serious a11y violation(s) found:${summary}\n\nSee docs/A11Y_EXCEPTIONS.md for exception policy.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Unauthenticated pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Unauthenticated @a11y', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login page has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/login');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Authenticated — Core navigation pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Dashboard @a11y', () => {
  test('Dashboard has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/dashboard');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Platform Management pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Platform Management @a11y', () => {
  test('Apps page has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/apps');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });

  test('Subjects page has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/subjects');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Curriculum pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — Curriculum @a11y', () => {
  test('Domains list has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/domains');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });

  test('Skills list has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/skills');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });

  test('Questions list has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/questions');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });

  test('Publish (Curriculum Release) page has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/publish');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. User Management
// ─────────────────────────────────────────────────────────────────────────────

test.describe('A11y — User Management @a11y', () => {
  test('User Management page has zero critical/serious violations @a11y', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    const results = await createAxeBuilder(page).analyze();
    expectNoViolations(results.violations, '/users');
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
  });
});

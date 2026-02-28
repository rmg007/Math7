import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

/**
 * Accessibility Tests — Tier 3
 *
 * Runs axe-core against key pages to catch WCAG violations.
 * We fail on critical and serious violations only.
 *
 *   npx playwright test tests/accessibility.spec.ts
 */

// Note: Authenticated pages rely on global storageState (super-admin) configured in playwright.config.ts

interface AxeNode {
  html: string;
}

interface AxeViolation {
  id: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  helpUrl: string;
  nodes: AxeNode[];
}

function filterViolations(violations: AxeViolation[]) {
  // Only fail on critical and serious — minor/moderate are logged but not blockers
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n: AxeNode) => `    → ${n.html}`).join('\n');
      return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}

test.describe('Accessibility Audit @logic', () => {
  test('Login page @smoke', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = filterViolations(results.violations);
    if (serious.length > 0) {
      console.log('Accessibility violations:\n' + formatViolations(serious));
    }
    expect(
      serious,
      `Found ${serious.length} critical/serious violations on /login:\n${formatViolations(serious)}`
    ).toHaveLength(0);
  });

  test.describe('Authenticated pages', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticated via storageState
    });

    test('Dashboard @smoke', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = filterViolations(results.violations);
      if (serious.length > 0) {
        console.log('Dashboard violations:\n' + formatViolations(serious));
      }
      expect(
        serious,
        `Found ${serious.length} critical/serious violations on /dashboard:\n${formatViolations(serious)}`
      ).toHaveLength(0);
    });

    test('Domains List @logic', async ({ page }) => {
      await page.goto('/domains');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = filterViolations(results.violations);
      if (serious.length > 0) {
        console.log('Domains violations:\n' + formatViolations(serious));
      }
      expect(
        serious,
        `Found ${serious.length} critical/serious violations on /domains:\n${formatViolations(serious)}`
      ).toHaveLength(0);
    });

    test('Questions List @logic', async ({ page }) => {
      await page.goto('/questions');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = filterViolations(results.violations);
      if (serious.length > 0) {
        console.log('Questions violations:\n' + formatViolations(serious));
      }
      expect(
        serious,
        `Found ${serious.length} critical/serious violations on /questions:\n${formatViolations(serious)}`
      ).toHaveLength(0);
    });

    test('Bulk Import @logic', async ({ page }) => {
      await page.goto('/ai-import');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = filterViolations(results.violations);
      if (serious.length > 0) {
        console.log('Bulk Import violations:\n' + formatViolations(serious));
      }
      expect(
        serious,
        `Found ${serious.length} critical/serious violations on /ai-import:\n${formatViolations(serious)}`
      ).toHaveLength(0);
    });
  });
});
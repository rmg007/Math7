/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from '@playwright/test';
import {
  createDomain,
  createMCQQuestion,
  createSkill,
  loginAs,
  publishCurriculum,
} from './actions/curriculum';

/**
 * curriculum-lifecycle.e2e.spec.ts (POM Edition)
 *
 * P0 Curriculum Happy Path (E2E)
 * Covers: AP-CURR-001, 004, 005, 007
 *
 * Refactored from direct page.locator() calls to POM + Actions layer.
 * The spec now reads as a business-level story, not DOM queries.
 */

test.describe('Curriculum Lifecycle (P0)', () => {
  test.describe.configure({ mode: 'serial' });
  const timestamp = Date.now();
  const domainSlug = `test_domain_${timestamp}`;
  const skillSlug = `test_skill_${timestamp}`;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'SUPER_ADMIN');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot: ${screenshotPath}`);
    }
  });

  test('AP-CURR-001: Create Domain', async ({ page }) => {
    const title = await createDomain(page, {
      title: `E2E Domain ${timestamp}`,
      slug: domainSlug,
      description: 'Created by Playwright E2E',
    });
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test('AP-CURR-004: Create Skill', async ({ page }) => {
    await createSkill(page, {
      title: `E2E Skill ${timestamp}`,
      slug: skillSlug,
      description: 'Created by Playwright E2E',
      domainName: new RegExp(`E2E Domain ${timestamp}`, 'i'),
    });
    await expect(page.getByText(`E2E Skill ${timestamp}`).first()).toBeVisible();
  });

  test('AP-CURR-005: Create Question (Multiple Choice)', async ({ page }) => {
    await createMCQQuestion(page, {
      questionText: `What is ${timestamp} + 1?`,
      skillName: new RegExp(`E2E Skill ${timestamp}`, 'i'),
      options: [`${timestamp + 1}`, `${timestamp + 2}`, `${timestamp + 3}`, `${timestamp + 4}`],
      correctIndex: 0,
    });
    await expect(page.getByText(`What is ${timestamp} + 1?`).first()).toBeVisible();
  });

  test('AP-CURR-007: Publish Curriculum', async ({ page }) => {
    await publishCurriculum(page);
    await expect(page.getByText(/Deployment Succeeded/i)).toBeVisible({ timeout: 30_000 });
  });
});

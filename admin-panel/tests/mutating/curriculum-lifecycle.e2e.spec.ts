import { expect, test } from '@playwright/test';
import {
  createDomain,
  createMCQQuestion,
  createSkill,
  publishCurriculum,
} from '../actions/curriculum';
import { VersionHistoryPage } from '../pages/VersionHistoryPage';

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
    // Rely on global storageState (SUPER_ADMIN)
    await page.goto('/dashboard');
    await expect(page.getByText(/Platform Overview/i)).toBeVisible();
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
      status: 'live',
    });
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test('AP-CURR-004: Create Skill', async ({ page }) => {
    await createSkill(page, {
      title: `E2E Skill ${timestamp}`,
      slug: skillSlug,
      description: 'Created by Playwright E2E',
      domainName: new RegExp(`E2E Domain ${timestamp}`, 'i'),
      status: 'live',
    });
    await expect(page.getByText(`E2E Skill ${timestamp}`).first()).toBeVisible();
  });

  test('AP-CURR-005: Create Question (Multiple Choice)', async ({ page }) => {
    await createMCQQuestion(page, {
      questionText: `What is ${timestamp} + 1?`,
      skillName: new RegExp(`E2E Skill ${timestamp}`, 'i'),
      options: [`${timestamp + 1}`, `${timestamp + 2}`, `${timestamp + 3}`, `${timestamp + 4}`],
      correctIndex: 0,
      status: 'live',
    });
    await expect(page.getByText(`What is ${timestamp} + 1?`).first()).toBeVisible();
  });

  test('AP-CURR-007: Publish Curriculum and Verify Snapshot', async ({ page }) => {
    // 1. Get current versions to compare
    const vhPage = new VersionHistoryPage(page);
    await vhPage.goto();
    let initialVersion = 0;
    try {
      initialVersion = await vhPage.getLatestVersionNumber();
    } catch (e) {
      // Might be first version
    }

    // 2. Publish
    await publishCurriculum(page);
    await expect(page.getByText(/Deployment Succeeded/i)).toBeVisible({ timeout: 30_000 });

    // 3. Verify Version Bumped
    await vhPage.goto();
    const newVersion = await vhPage.getLatestVersionNumber();
    expect(newVersion).toBeGreaterThan(initialVersion);

    // 4. Verify Counts (at least 1 of each since we just created them)
    const counts = await vhPage.getLatestSnapshotCounts();
    expect(counts.domains).toBeGreaterThanOrEqual(1);
    expect(counts.skills).toBeGreaterThanOrEqual(1);
    expect(counts.questions).toBeGreaterThanOrEqual(1);
  });
});

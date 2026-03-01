/**
 * BulkImportPage Smoke Tests @smoke
 *
 * Covers: admin-panel/src/features/ai-content/pages/BulkImportPage.tsx
 * Route:  /ai-import
 *
 * Design rules:
 *   - @smoke tag on every test so --grep @smoke picks them up.
 *   - Read-only / non-mutating: no real AI calls, no DB writes.
 *   - Edge Function and Workers AI endpoints are mocked via page.route().
 *   - Uses global storageState (super-admin authenticated) — no auth override.
 *   - Must complete in < 30 seconds total (smoke config timeout).
 */
import { expect, test } from '@playwright/test';

const EDGE_FN_PATTERN = '**/functions/v1/parse-import-prompt';
const WORKERS_AI_PATTERN = '**/ai/parse-import-prompt';

const EMPTY_AI_RESPONSE = JSON.stringify({ questions: [] });

test.describe('BulkImportPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Mock both AI endpoints to prevent real network calls
    await page.route(EDGE_FN_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_AI_RESPONSE })
    );
    await page.route(WORKERS_AI_PATTERN, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: EMPTY_AI_RESPONSE })
    );

    await page.goto('/ai-import');
    await expect(page.locator('[data-testid="bulk-import-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Curriculum Nexus heading @smoke', async ({ page }) => {
    await expect(page.getByText('Curriculum Nexus')).toBeVisible();
  });

  test('CSV upload dropzone is present in DOM @smoke', async ({ page }) => {
    // The file input is opacity-0 (hidden behind dropzone overlay) — use toBeAttached, not toBeVisible
    await expect(page.locator('[data-testid="bulk-import-file-upload"]')).toBeAttached();
  });

  test('dropzone container shows "Drop CSV Artifact" prompt @smoke', async ({ page }) => {
    // The CSV tab is active by default — verify the visible drop-zone inner label is rendered
    await expect(page.getByText(/Drop CSV Artifact/i)).toBeVisible();
  });

  test('commit button is disabled when import queue is empty @smoke', async ({ page }) => {
    // On fresh load the importQueue is empty, so the Execute button must be disabled
    await expect(page.locator('[data-testid="bulk-import-commit-btn"]')).toBeDisabled();
  });

  test('both CSV Matrix and AI Synthesis tabs are visible @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="bulk-import-tab-csv"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-import-tab-ai"]')).toBeVisible();
  });

  test('AI Synthesis sync button is disabled when prompt textarea is empty @smoke', async ({
    page,
  }) => {
    await page.locator('[data-testid="bulk-import-tab-ai"]').click();
    // Textarea starts empty → sync button must be disabled (guarded by !importPrompt.trim())
    await expect(page.locator('[data-testid="bulk-import-sync-btn"]')).toBeDisabled();
  });

  test('download template button is visible @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="bulk-import-template-btn"]')).toBeVisible();
  });

  test('skill selector is rendered @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="bulk-import-skill-select"]')).toBeVisible();
  });

  test('nexus buffer card is rendered with 0 pending units on load @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="bulk-import-buffer-card"]')).toBeVisible();
    await expect(page.getByText(/0 Pending Ingestion Units/i)).toBeVisible();
  });

  test('AI import with mocked Edge Function populates buffer @smoke', async ({ page }) => {
    // Override the mock to return one question
    await page.route(EDGE_FN_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              type: 'multiple_choice',
              content: 'Smoke Test: What is 1+1?',
              options: [
                { text: '2', is_correct: true },
                { text: '3', is_correct: false },
              ],
              points: 1,
              is_published: false,
              skill_id: '00000000-0000-0000-0000-000000000000',
            },
          ],
        }),
      })
    );
    await page.route(WORKERS_AI_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              type: 'multiple_choice',
              content: 'Smoke Test: What is 1+1?',
              options: [
                { text: '2', is_correct: true },
                { text: '3', is_correct: false },
              ],
              points: 1,
              is_published: false,
              skill_id: '00000000-0000-0000-0000-000000000000',
            },
          ],
        }),
      })
    );

    await page.locator('[data-testid="bulk-import-tab-ai"]').click();
    await page.locator('[data-testid="bulk-import-ai-textarea"]').fill('Generate a test question');
    await page.locator('[data-testid="bulk-import-sync-btn"]').click();

    await expect(page.getByText('Smoke Test: What is 1+1?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/1 Pending Ingestion Units/i)).toBeVisible();
    // Commit button should now be enabled
    await expect(page.locator('[data-testid="bulk-import-commit-btn"]')).toBeEnabled();
  });
});

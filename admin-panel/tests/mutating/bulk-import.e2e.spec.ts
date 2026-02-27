import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

// Valid mock question matching QueuedQuestionSchema (Zod discriminated union)
function mockQuestion(content: string) {
  return {
    type: 'multiple_choice',
    content,
    options: [
      { text: 'Yes', is_correct: true },
      { text: 'No', is_correct: false },
    ],
    points: 1,
    is_published: true,
    skill_id: '00000000-0000-0000-0000-000000000000',
  };
}

test.describe('Bulk Import Feature (Golden Path) @logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    // App redirects to '/' after login, not '/dashboard'
    await page.waitForURL(/^\/$|\/dashboard|\/domains/, { timeout: 15000 });

    await page.goto('/ai-import');
    await expect(page.getByText('Curriculum Nexus')).toBeVisible({ timeout: 15000 });
  });

  test('should allow downloading the CSV template', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Template/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('bulk_import_template');
  });

  test('should successfully parse questions from AI prompt', async ({ page }) => {
    await page.route('**/functions/v1/parse-import-prompt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [mockQuestion('Oracle Test Question: What is 2+2?')],
        }),
      });
    });

    await page.getByRole('tab', { name: /AI Synthesis/i }).click();
    await page.fill('textarea', 'Generate a question for testing.');
    await page.getByRole('button', { name: /Sync AI Wisdom/i }).click();

    await expect(page.getByText('Oracle Test Question: What is 2+2?')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/1 Pending Ingestion Units/i)).toBeVisible();
  });

  test('should commit buffer to production matrix (Real Import)', async ({ page }) => {
    // Mock AI extraction
    await page.route('**/functions/v1/parse-import-prompt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [mockQuestion('Commit Test Question')],
        }),
      });
    });

    // Mock the RPC
    await page.route('**/*import_questions_bulk*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            inserted_count: 1,
            skipped_count: 0,
            success: true,
          },
        ]),
      });
    });

    // Fill and submit AI prompt
    await page.getByRole('tab', { name: /AI Synthesis/i }).click();
    await page.fill('textarea', 'Test commit');
    await page.getByRole('button', { name: /Sync AI Wisdom/i }).click();
    await expect(page.getByText('Commit Test Question')).toBeVisible({ timeout: 10000 });

    // Toggle dry run OFF → Production mode
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="bulk-import-dryrun-switch"]');
      if (el instanceof HTMLElement) el.click();
    });
    await expect(page.getByText(/Live Production/i)).toBeVisible({ timeout: 15000 });

    // Execute Commit — then immediately check for toast or buffer clearing
    await page.getByRole('button', { name: /Execute Persistence Cycle/i }).click();

    // On success, the hook clears the buffer: setImportQueue([]) → "0 Pending Ingestion Units"
    // and the question disappears from the buffer. This is more reliable than a toast.
    await expect(page.getByText(/0 Pending Ingestion Units/i)).toBeVisible({ timeout: 15000 });
    // The commit button should focus on the empty state but we'll check the count text
    await expect(
      page.getByRole('button', { name: /Execute Persistence Cycle \(0\)/i })
    ).toBeDisabled();
  });

  test('should handle import errors gracefully', async ({ page }) => {
    // Mock AI extraction
    await page.route('**/functions/v1/parse-import-prompt', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [mockQuestion('Error Test Question')],
        }),
      });
    });

    // Mock RPC returning an error
    await page.route('**/*import_questions_bulk*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Database constraint violation' }),
      });
    });

    await page.getByRole('tab', { name: /AI Synthesis/i }).click();
    await page.fill('textarea', 'Test error handling');
    await page.getByRole('button', { name: /Sync AI Wisdom/i }).click();
    await expect(page.getByText('Error Test Question')).toBeVisible({ timeout: 10000 });

    // Switch to production mode
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="bulk-import-dryrun-switch"]');
      if (el instanceof HTMLElement) el.click();
    });
    await expect(page.getByText(/Live Production/i)).toBeVisible({ timeout: 15000 });

    // Execute Commit
    await page.getByRole('button', { name: /Execute Persistence Cycle/i }).click();

    // On error, buffer is NOT cleared — question stays in buffer
    // Wait a bit and verify the buffer still has the question
    await page.waitForTimeout(3000);
    await expect(page.getByText(/1 Pending Ingestion Units/i)).toBeVisible();
    await expect(page.getByText('Error Test Question')).toBeVisible();
  });
});

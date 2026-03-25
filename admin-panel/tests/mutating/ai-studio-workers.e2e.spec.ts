import { expect, test } from '@playwright/test';

test.describe('AI Question Studio - Workers AI @logic', () => {
  test.beforeEach(async ({ page }) => {
    // Debug logging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('React Router Future Flag Warning')) return;
      if (msg.type() === 'error' || msg.type() === 'warning' || text.startsWith('[MOCK]')) {
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // Baseline mocks for common tables
    await page.route('**/rest/v1/domains*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { domain_id: 'd1', title: 'Mathematics', slug: 'math', app_id: 'app-1' },
        ]),
      });
    });

    await page.route('**/rest/v1/skills*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { skill_id: 's1', title: 'Calculus Basics', domain_id: 'd1', app_id: 'app-1' },
        ]),
      });
    });

    await page.route('**/rest/v1/studio_prompts*', async (route) => {
      if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({ id: 'p1', status: 'generated' }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
    });

    await page.route('**/rest/v1/questions*', async (route) => {
      if (route.request().method() === 'POST') {
        console.log(`[MOCK] questions POST hit`);
        await route.fulfill({ status: 201, body: JSON.stringify([{ id: 1 }]) });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
    });

    await page.route('**/rpc/consume_tenant_tokens', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // 1. Initial page load
    await page.goto('/questions/studio');
    await page.waitForLoadState('networkidle');
  });

  test('should complete the full generation and save cycle', async ({ page }) => {
    // Generation Mock (Happy Path)
    await page.route('**/ai/generate-questions', async (route) => {
      console.log(`[MOCK] generate-questions hit`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              text: 'Is the limit of 1/x as x goes to infinity 0?',
              question_type: 'boolean',
              difficulty: 'easy',
              metadata: { correct_answer: 'True' },
            },
          ],
          metadata: {
            model: 'mock',
            generation_time_ms: 10,
            token_count: 10,
            questions_generated: 1,
          },
        }),
      });
    });

    // 2. Select Domain & Add Topic
    const domainTrigger = page.getByTestId('studio-domain-select');
    await expect(domainTrigger).toBeVisible({ timeout: 15000 });
    await domainTrigger.click();
    await page.getByRole('option', { name: 'Mathematics' }).first().click();

    // Add Topic
    const topicInput = page.getByPlaceholder(/Type a topic/i);
    await topicInput.fill('Calculus');
    await topicInput.press('Enter');
    await expect(page.locator('span:has-text("Calculus")')).toBeVisible();

    // 3. Generate
    const generateBtn = page.getByTestId('generate-btn');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 4. Verify Generation Results
    await expect(page.getByText('Is the limit of 1/x as x goes to infinity 0?')).toBeVisible({
      timeout: 15000,
    });

    // 5. Deployment Flow (Save)
    const skillTrigger = page.locator('button:has-text("Select a skill...")');
    await expect(skillTrigger).toBeVisible({ timeout: 10000 });
    await skillTrigger.click();
    await page.getByRole('option', { name: 'Calculus Basics' }).first().click();

    // Check 'Reviewed' Checkbox via Label click
    const reviewedLabel = page.getByText(/I have reviewed all/i);
    await reviewedLabel.click({ force: true });

    // Save
    const saveBtn = page.getByRole('button', { name: /Save 1 Questions/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // 6. Navigation with generous timeout and loose match
    await page.waitForURL(
      (url) => url.pathname === '/questions' || url.pathname.endsWith('/questions'),
      { timeout: 20000 }
    );
    expect(page.url()).toMatch(/\/questions$/);
  });

  test('should handle generation failure gracefully', async ({ page }) => {
    // 1. Mock 500 error
    await page.route('**/ai/generate-questions', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Manual Error' }),
      });
    });

    // 2. Setup (Select domain & add topic)
    await page.getByTestId('studio-domain-select').click();
    await page.getByRole('option', { name: 'Mathematics' }).first().click();
    await page.getByPlaceholder(/Type a topic/i).fill('FailTest');
    await page.keyboard.press('Enter');

    // 3. Trigger & Verify
    await page.getByTestId('generate-btn').click();
    await expect(page.locator('body')).toContainText(/failed|error|Fail/i, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Retry/i })).toBeVisible();
  });
});

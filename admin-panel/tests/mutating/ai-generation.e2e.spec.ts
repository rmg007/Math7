import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

test.describe('AI Generation Flow @logic', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to AI Assistant
    await page.goto('/ai-questions');

    // Mock the AI Generation endpoints
    await page.route('**/ai/generate-questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              text: 'Mock AI Question: What is photosynthesis?',
              question_type: 'mcq',
              difficulty: 'easy',
              metadata: {
                options: [
                  'Process of making food',
                  'Process of breathing',
                  'Process of sleep',
                  'Process of growth',
                ],
                correct_answer: 'Process of making food',
                explanation: 'Plants use sunlight to synthesize food from CO2 and water.',
              },
            },
          ],
          metadata: {
            model: 'gemini-1.5-flash',
            subject_type: 'general',
            generation_time_ms: 1200,
            token_count: 450,
            questions_generated: 1,
          },
        }),
      });
    });

    await page.route('**/generate-questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              text: 'Mock AI Question: What is photosynthesis?',
              question_type: 'mcq',
              difficulty: 'easy',
              metadata: {
                options: [
                  'Process of making food',
                  'Process of breathing',
                  'Process of sleep',
                  'Process of growth',
                ],
                correct_answer: 'Process of making food',
                explanation: 'Plants use sunlight to synthesize food from CO2 and water.',
              },
            },
          ],
          metadata: {
            model: 'gemini-1.5-flash',
            subject_type: 'general',
            generation_time_ms: 1200,
            token_count: 450,
            questions_generated: 1,
          },
        }),
      });
    });

    await page.route('**/ai/validate-content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall_score: 95,
          status: 'approved',
          consensus_reached: true,
          findings: [],
          summary: 'Content is high quality and accurate.',
          metadata: { model: 'gemini-1.5-pro', validation_time_ms: 800 },
        }),
      });
    });

    await page.route('**/validate-content', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall_score: 95,
          status: 'approved',
          consensus_reached: true,
          findings: [],
          summary: 'Content is high quality and accurate.',
          metadata: { model: 'gemini-1.5-pro', validation_time_ms: 800 },
        }),
      });
    });

    await page.route('**/rpc/consume_tenant_tokens', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, remaining: 10000 }),
      });
    });

    await page.route('**/ai_generation_sessions', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('should allow uploading a document and generating questions @logic', async ({ page }) => {
    // Check if we are on the page
    await expect(page.getByText(/AI Question Generator/i)).toBeVisible();

    // Mock file upload
    const fileContent =
      'This is a test educational document about photosynthesis. Photosynthesis is the process used by plants to convert light energy into chemical energy.';
    const buffer = Buffer.from(fileContent);

    // Playwright handle for file input
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('text=Upload Source Document'),
    ]);
    await fileChooser.setFiles([
      {
        name: 'photosynthesis.png',
        mimeType: 'image/png',
        buffer: buffer,
      },
    ]);

    // Wait for extraction success (mocked/simulated)
    await expect(page.getByText(/Successfully extracted/i)).toBeVisible({ timeout: 15000 });

    // Set difficulty distribution
    // Default is 10/20/10, we'll keep it or adjust

    // Click generate
    await page.click('button:has-text("Initiate Intelligent Generation")');

    // Check for "Generating..." state
    await expect(page.getByText(/Synthesizing Knowledge.../i)).toBeVisible();

    // Wait for completion (this uses the real AI if connected, so it might take time or fail if no quota)
    // We'll wait for the "Refine & Persist" header or grid visibility
    await expect(page.getByText(/Refine & Persist/i)).toBeVisible({ timeout: 45000 });

    // Verify results are shown
    await expect(page.locator('.grid').first()).toBeVisible();
  });
});

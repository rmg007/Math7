import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from './test-utils';

test.describe('Question Studio Save Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Super Admin
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await page.goto('/questions/studio');
  });

  test('should transform and save generated questions without 400 error', async ({ page }) => {
    // 1. Setup Mock for Generation
    await page.route('**/generate-questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              text: 'Is the sky blue?',
              question_type: 'boolean',
              difficulty: 'easy',
              metadata: {
                correct_answer: 'True',
                explanation: 'The sky appears blue due to Rayleigh scattering.'
              }
            },
            {
              text: 'What is 2+2?',
              question_type: 'mcq',
              difficulty: 'easy',
              metadata: {
                options: ['3', '4', '5', '6'],
                correct_answer: '4',
                explanation: 'Basic arithmetic.'
              }
            }
          ],
          metadata: {
            model: 'test-model',
            generation_time_ms: 100,
            token_count: 50,
            questions_generated: 2
          }
        })
      });
    });

    // 2. Trigger Generation
    await expect(page).toHaveURL(/\/questions\/studio/);
    
    // Select domain card
    const domainBtn = page.getByText('General Knowledge', { exact: true });
    await domainBtn.click();
    
    // The topic input appears after domain selection
    const topicInput = page.locator('input[placeholder*="Geography"]');
    await topicInput.waitFor({ state: 'visible' });
    await topicInput.fill('Atmosphere and Basic Math');
    
    // Generate
    const generateBtn = page.getByRole('button', { name: /Generate/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Wait for cards to appear
    await expect(page.getByText('Is the sky blue?')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('What is 2+2?')).toBeVisible();

    // 3. Prepare for Save
    // Select skill - There are two comboboxes, pick the one under Deployment
    const skillSelect = page.locator('aside:has-text("Deployment")').getByRole('combobox');
    await skillSelect.click();
    await page.locator('role=option').first().click();

    // Check the review box
    await page.getByLabel(/I have reviewed/i).check({ force: true });

    // 4. Intercept Save Request
    await page.route('**/rest/v1/questions*', async (route) => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        // Return 201 Created
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(Array.isArray(data) ? data : [data])
        });
      } else {
        await route.continue();
      }
    });

    const savePromise = page.waitForRequest(req => 
      req.url().includes('/rest/v1/questions') && req.method() === 'POST'
    );

    // Click Save - Button text is dynamic: "Save 2 Questions"
    await page.getByRole('button', { name: /Save \d+ Questions/i }).click();

    const saveRequest = await savePromise;
    const payload = await saveRequest.postDataJSON();

    // ASSERTIONS: Verify the transformation logic fixed the 400 error
    expect(Array.isArray(payload)).toBeTruthy();
    const firstQ = payload[0];

    // These fields should exist
    expect(firstQ).toHaveProperty('content');
    expect(firstQ).toHaveProperty('type');
    expect(firstQ).toHaveProperty('options');
    expect(firstQ).toHaveProperty('solution');
    
    // These fields MUST NOT exist (they were causing the 400)
    expect(firstQ).not.toHaveProperty('difficulty');
    expect(firstQ).not.toHaveProperty('metadata');

    // Check specific formatting for Boolean
    expect(firstQ.type).toBe('boolean');
    expect(firstQ.options).toEqual({ true_label: 'True', false_label: 'False' });
    expect(firstQ.solution).toEqual({ correct_value: true });

    // Check specific formatting for MCQ
    const secondQ = payload[1];
    expect(secondQ.type).toBe('multiple_choice');
    expect(secondQ.options.options).toHaveLength(4);
    expect(secondQ.solution).toHaveProperty('correct_option_id');

    // 5. Success
    // Note: We don't wait for the toast here as it can be flaky in mocked environments,
    // but the fact that we reached this point means the payload assertions passed.
  });
});

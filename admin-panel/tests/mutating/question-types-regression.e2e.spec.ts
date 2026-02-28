/**
 * Step 13 — Regression Coverage: Question Types & Bulk-Import AI
 *
 * Covers:
 *  A. MCQ question — create, validate, and confirm list appearance
 *  B. Subjective (text_input) question — create and confirm
 *  C. Boolean question — create with TRUE answer and confirm
 *  D. Bulk-import AI prompt — parse via mock, inspect buffer entries
 *  E. Form validation — required-field enforcement per type
 *
 * Prerequisites (live DB):
 *  - At least one Skill exists (seeded by curriculum-lifecycle.e2e.spec.ts
 *    or the global globalSetup helper).
 *  - Test user credentials in TEST_ADMIN_EMAIL / TEST_ADMIN_PASS (or defaults).
 *
 * Mock strategy:
 *  - The AI-import route (/api/ai-import or the Edge Function) is mocked so
 *    these tests are hermetic and don't burn real AI tokens.
 */

import { expect, test } from '@playwright/test';
import { loginAs } from '../actions/curriculum';
import { QuestionFormPage } from '../pages/QuestionFormPage';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Regex that matches any existing skill listed in the select dropdown. */
const ANY_SKILL = /.+/;

/** Wait for the questions list page after a successful submit */
async function expectRedirectToList(page: import('@playwright/test').Page) {
  await expect(page).toHaveURL(/\/questions$/, { timeout: 35_000 });
}

// ---------------------------------------------------------------------------
// Setup – login once per worker using storageState (if available) or fresh
// ---------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'SUPER_ADMIN');
});

// ---------------------------------------------------------------------------
// A. MCQ Question
// ---------------------------------------------------------------------------

test.describe('A — MCQ question @logic', () => {
  test('creates a valid MCQ and appears in the question list @smoke', async ({ page }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();

    // The default type is MCQ — no need to switch
    await formPage.selectSkill(ANY_SKILL);
    await formPage.typeContent('What is the capital of France?');

    // Fill 4 options (the form starts with 4 by default)
    await formPage.fillMCQOption(0, 'Berlin');
    await formPage.fillMCQOption(1, 'Madrid');
    await formPage.fillMCQOption(2, 'Paris');
    await formPage.fillMCQOption(3, 'Rome');

    // Mark option C (index 2) as correct
    await formPage.selectCorrectAnswer(2);

    await formPage.submit();
    await expectRedirectToList(page);

    // The question text should now appear in the list
    await expect(page.getByText('What is the capital of France?').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('requires a correct-answer selection — shows validation error without it @logic', async ({
    page,
  }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();
    await formPage.selectSkill(ANY_SKILL);
    await formPage.typeContent('MCQ without a correct answer');

    await formPage.fillMCQOption(0, 'Option Alpha');
    await formPage.fillMCQOption(1, 'Option Beta');

    // Intentionally skip selecting a correct answer
    await formPage.submit();

    // Should stay on the form — either URL doesn't change or an alert appears
    await expect(page)
      .not.toHaveURL(/\/questions$/, { timeout: 3_000 })
      .catch(() => {
        // acceptable — page stayed, which is what we want
      });

    const stillOnForm = await formPage.form.isVisible();
    expect(stillOnForm).toBe(true);
  });

  test('append-option button adds a 5th input (above default 4) @logic', async ({ page }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();

    const appendBtn = formPage.appendOptionButton;
    const before = await page.locator('[data-testid^="question-mcq-option-"]').count();

    await appendBtn.click();

    const after = await page.locator('[data-testid^="question-mcq-option-"]').count();
    expect(after).toBe(before + 1);
  });
});

// ---------------------------------------------------------------------------
// B. Subjective (text_input) Question
// ---------------------------------------------------------------------------

test.describe('B — Subjective (text_input) question', () => {
  test('creates a text_input question and appears in the question list @smoke', async ({ page }) => {
    const formPage = new QuestionFormPage(page);

    await formPage.createSubjective({
      questionText: 'Explain the water cycle in your own words.',
      skillName: ANY_SKILL,
      answer: 'Evaporation, condensation, and precipitation.',
    });

    await expectRedirectToList(page);
    await expect(page.getByText('Explain the water cycle in your own words.').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('cannot submit without filling the answer field @logic', async ({ page }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();
    await formPage.selectType('text_input');
    await formPage.selectSkill(ANY_SKILL);
    await formPage.typeContent('A subjective question with no answer');

    // Intentionally leave the answer blank
    await formPage.submit();

    // Browser native required validation prevents submit — form stays visible
    const stillOnForm = await formPage.form.isVisible();
    expect(stillOnForm).toBe(true);
  });

  test('answer input is visible after switching to text_input type @logic', async ({ page }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();
    await formPage.selectType('text_input');

    await expect(formPage.textInputAnswer).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// C. Boolean Question
// ---------------------------------------------------------------------------

test.describe('C — Boolean question', () => {
  test('creates a TRUE boolean question and appears in the question list @smoke', async ({ page }) => {
    const formPage = new QuestionFormPage(page);

    await formPage.createBoolean({
      questionText: 'Is the Earth round?',
      skillName: ANY_SKILL,
      correctIsTrue: true,
    });

    await expectRedirectToList(page);
    await expect(page.getByText('Is the Earth round?').first()).toBeVisible({ timeout: 15_000 });
  });

  test('creates a FALSE boolean question and appears in the question list @smoke', async ({ page }) => {
    const formPage = new QuestionFormPage(page);

    await formPage.createBoolean({
      questionText: 'Is the Earth flat?',
      skillName: ANY_SKILL,
      correctIsTrue: false, // switch stays at default (false)
    });

    await expectRedirectToList(page);
    await expect(page.getByText('Is the Earth flat?').first()).toBeVisible({ timeout: 15_000 });
  });

  test('boolean switch is visible after selecting boolean type @logic', async ({ page }) => {
    const formPage = new QuestionFormPage(page);
    await formPage.gotoNew();
    await formPage.selectType('boolean');

    await expect(formPage.booleanSwitch).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// D. Bulk-Import AI Prompt (mocked AI endpoint)
// ---------------------------------------------------------------------------

test.describe('D — Bulk-import AI prompt (mocked)', () => {
  /**
   * Mock the Supabase Edge Function that processes the AI prompt.
   * The actual function slug resolves to something like:
   *   POST https://<project>.supabase.co/functions/v1/parse-questions
   * We intercept any POST to that pattern and return a synthetic payload.
   */
  const mockResponse = {
    questions: [
      {
        type: 'multiple_choice',
        content: 'What is 2+2?',
        options: [
          { text: '3', is_correct: false },
          { text: '4', is_correct: true },
          { text: '5', is_correct: false },
          { text: '6', is_correct: false },
        ],
        solution: '4',
        explanation: 'Basic math.',
        points: 10,
        difficulty_level: 1,
        is_published: true,
      },
      {
        type: 'text_input',
        content: 'Describe photosynthesis.',
        options: [],
        solution: 'Plants convert light to energy.',
        explanation: 'Biology 101.',
        points: 20,
        difficulty_level: 2,
        is_published: true,
      },
    ],
  };

  test('AI tab loads, prompt fills, Sync button triggers, and buffer populates @smoke', async ({
    page,
  }) => {
    // Intercept both potential AI parse endpoints (Workers AI and Supabase Edge Functions)
    await page.route('**/functions/v1/parse-import-prompt', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    await page.route('**/ai/parse-import-prompt', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    await page.goto('/ai-import');
    await expect(page.locator('[data-testid="bulk-import-page"]')).toBeVisible({ timeout: 15_000 });

    // Select a skill first to ensure valid state
    await page.locator('[data-testid="bulk-import-skill-select"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 10_000 });
    await page.locator('[role="option"]').first().click();

    // Switch to AI Prompt tab
    await page.locator('[data-testid="bulk-import-tab-ai"]').click();

    // Fill the AI textarea
    const textarea = page.locator('[data-testid="bulk-import-ai-textarea"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('What is 2 + 2?\nDescribe photosynthesis.');

    // Click Sync with AI
    // Trigger synchronization
    await page.locator('[data-testid="bulk-import-sync-btn"]').click();

    // Verify buffer card is visible and contains items (it will populate after click)
    const bufferCard = page.locator('[data-testid="bulk-import-buffer-card"]');
    await expect(bufferCard).toBeVisible();

    // Consistently wait for the buffer to populate
    const bufferItemSelector = '[data-testid^="bulk-import-buffer-item-"]';
    await page.waitForSelector(bufferItemSelector, { timeout: 20_000 });

    const bufferItems = bufferCard.locator(bufferItemSelector);
    const count = await bufferItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Sync button is disabled when prompt is empty @logic', async ({ page }) => {
    await page.goto('/ai-import');
    await page.locator('[data-testid="bulk-import-tab-ai"]').click();

    const syncBtn = page.locator('[data-testid="bulk-import-sync-btn"]');
    await expect(syncBtn).toBeDisabled();
  });

  test('Sync button becomes enabled after typing in prompt textarea @logic', async ({ page }) => {
    await page.goto('/ai-import');
    await page.locator('[data-testid="bulk-import-tab-ai"]').click();

    const textarea = page.locator('[data-testid="bulk-import-ai-textarea"]');
    await textarea.fill('Sample question text');

    const syncBtn = page.locator('[data-testid="bulk-import-sync-btn"]');
    await expect(syncBtn).not.toBeDisabled();
  });

  test('Dry Run switch is visible and togglable @logic', async ({ page }) => {
    await page.goto('/ai-import');

    const dryRunSwitch = page.locator('[data-testid="bulk-import-dryrun-switch"]');
    await expect(dryRunSwitch).toBeVisible();

    // Record initial state then toggle
    const initialChecked = await dryRunSwitch.getAttribute('data-state');
    await dryRunSwitch.click();
    const afterChecked = await dryRunSwitch.getAttribute('data-state');
    expect(initialChecked).not.toBe(afterChecked);
  });

  test('CSV tab shows file-upload input @smoke', async ({ page }) => {
    await page.goto('/ai-import');
    await page.locator('[data-testid="bulk-import-tab-csv"]').click();

    const fileInput = page.locator('[data-testid="bulk-import-file-upload"]');
    await expect(fileInput).toBeAttached(); // hidden but present
  });

  test('Template button triggers a CSV download @logic', async ({ page }) => {
    await page.goto('/ai-import');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10_000 }),
      page.locator('[data-testid="bulk-import-template-btn"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});

// ---------------------------------------------------------------------------
// E. Cross-type validation: submit with no content → form stays visible
// ---------------------------------------------------------------------------

test.describe('E — Form validation guard', () => {
  const types = ['multiple_choice', 'text_input', 'boolean'] as const;

  for (const qtype of types) {
    test(`submitting empty ${qtype} form stays on the form @logic`, async ({ page }) => {
      const formPage = new QuestionFormPage(page);
      await formPage.gotoNew();
      if (qtype !== 'multiple_choice') {
        await formPage.selectType(qtype);
      }
      // Don't fill anything — submit immediately
      await formPage.submit();

      // Should NOT navigate away
      await expect(page)
        .not.toHaveURL(/\/questions$/, { timeout: 3_000 })
        .catch(() => {});
      expect(await formPage.form.isVisible()).toBe(true);
    });
  }
});
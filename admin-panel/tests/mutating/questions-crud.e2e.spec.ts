import { expect, test } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Questions CRUD Tests — @logic
 * Tests create and read operations for curriculum questions.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('Questions Management @logic', () => {
  let supabase: SupabaseClient;

  test.beforeAll(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { cleanTestData, seedTestData } = await import('./helpers/seed-test-data');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found. Cannot seed test data.');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    await cleanTestData(supabase);
    await seedTestData(supabase);
  });

  test.afterAll(async () => {
    if (supabase) {
      const { cleanTestData } = await import('./helpers/seed-test-data');
      await cleanTestData(supabase);
    }
  });

  test('should list all questions', async ({ page }) => {
    await page.goto('/questions');
    await expect(
      page.locator('a[href="/questions/new"], button:has-text("New Question")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should create a new MCQ question @logic', async ({ page }) => {
    await page.goto('/questions/new');

    const contentEditor = page.locator('.ProseMirror, textarea[name="content"]').first();
    await expect(contentEditor).toBeVisible({ timeout: 15000 });

    // Select Skill using keyboard navigation for absolute reliability in Radix Select
    const skillTrigger = page.getByTestId('question-skill-select');
    await expect(skillTrigger).toBeVisible({ timeout: 15000 });
    await skillTrigger.click();
    await page.waitForTimeout(1000);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const questionId = Date.now();
    if (await page.locator('.ProseMirror').first().isVisible()) {
      await page.locator('.ProseMirror').first().click();
      await page.keyboard.type(`E2E Quest ID ${questionId}`);
    } else {
      await page.locator('textarea[name="content"]').fill(`E2E Quest ID ${questionId}`);
    }

    const optA = page.locator('input[placeholder*="Option A"], [name*="options.0"]');
    if (await optA.isVisible()) {
      await optA.fill('4');
      await page.locator('input[placeholder*="Option B"], [name*="options.1"]').fill('5');
      await page.getByRole('radio').first().click();
    }

    await page.waitForTimeout(500);
    await page.getByTestId('question-submit-btn').click();

    await expect(page).toHaveURL(/\/questions/, { timeout: 15000 });
    await expect(page.getByText(new RegExp(`${questionId}`)).first()).toBeVisible({
      timeout: 10000,
    });
  });
});

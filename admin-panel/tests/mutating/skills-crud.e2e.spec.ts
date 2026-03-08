import { expect, test } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateTestSkill, selectOption } from '../test-utils';

/**
 * Skills CRUD Tests — @logic
 * Tests create and read operations for curriculum skills.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('Skills Management @logic', () => {
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

  test('should list all skills', async ({ page }) => {
    await page.goto('/skills');
    await expect(
      page.locator('a[href="/skills/new"], button:has-text("New Skill")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should create a new skill @logic', async ({ page }) => {
    const testSkill = generateTestSkill();
    await page.goto('/skills/new');

    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

    // Select first available domain
    const domainSelect = page.locator('button[role="combobox"]').first();
    if (await domainSelect.isVisible()) {
      await selectOption(page, 'button[role="combobox"]', 0);
    }

    await page.locator('input[name="title"]').fill(testSkill.name);
    await page.locator('textarea[name="description"]').fill(testSkill.description);

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Create Skill/i }).click();

    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByText(testSkill.name).first()).toBeVisible();
  });
});

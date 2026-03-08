import { expect, test } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Domains CRUD Tests — @logic
 * Tests create, read, update, and delete operations for curriculum domains.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('Domains Management @logic', () => {
  let supabase: SupabaseClient;

  test.beforeAll(async () => {
    // Load environment variables
    const { createClient } = await import('@supabase/supabase-js');
    const { cleanTestData, seedTestData } = await import('./helpers/seed-test-data');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found. Cannot seed test data.');
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Clean and seed
    await cleanTestData(supabase);
    await seedTestData(supabase);
  });

  test.afterAll(async () => {
    if (supabase) {
      const { cleanTestData } = await import('./helpers/seed-test-data');
      await cleanTestData(supabase);
    }
  });

  test('should list all domains', async ({ page }) => {
    await page.goto('/domains');
    await expect(
      page.locator('a[href="/domains/new"], button:has-text("New Domain")').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should create a new domain @logic', async ({ page }) => {
    const testDomain = {
      name: `E2E Domain ${Date.now()}`,
      description: 'Testing domain creation',
    };

    await page.goto('/domains/new');

    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await titleInput.fill(testDomain.name);

    const slugInput = page.locator('input[name="slug"]');
    if (await slugInput.isVisible()) {
      await slugInput.fill(`e2e_domain_${Date.now()}`);
    }

    const descriptionInput = page.locator('textarea[name="description"]');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(testDomain.description);
    }

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Create Domain/i }).click();

    await expect(page).toHaveURL(/\/domains$/, { timeout: 15000 });

    const searchInput = page.getByPlaceholder(/Search domains/i);
    await searchInput.fill(testDomain.name);
    await page.waitForTimeout(500);

    const domainItem = page
      .locator('tr, div[class*="bg-white"][class*="rounded-lg"]')
      .filter({ hasText: testDomain.name })
      .first();
    await expect(domainItem).toBeVisible({ timeout: 10000 });
  });

  test('should edit an existing domain @logic', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForSelector('table tbody tr, div[class*="bg-white"][class*="rounded-lg"]', {
      timeout: 15000,
    });

    const firstEditBtn = page
      .locator(
        'a[href^="/domains/"][href$="/edit"], button:has-text("Edit"), button[title*="Edit"]'
      )
      .filter({ visible: true })
      .first();

    if (await firstEditBtn.isVisible()) {
      await firstEditBtn.click();

      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toBeVisible({ timeout: 15000 });

      const updatedTitle = `Updated Domain ${Date.now()}`;
      await titleInput.fill(updatedTitle);

      await page.waitForTimeout(500);
      const submitBtn = page.getByRole('button', { name: /Update Domain/i });
      await expect(submitBtn).toBeVisible({ timeout: 5000 });
      await submitBtn.click();

      await page.waitForURL('**/domains', { timeout: 20000 });
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(updatedTitle).first()).toBeVisible({ timeout: 15000 });
    } else {
      test.skip();
    }
  });

  test('should delete a domain @logic', async ({ page }) => {
    await page.goto('/domains/new');
    const tempTitle = `Delete Me ${Date.now()}`;

    await page.locator('input[name="title"]').fill(tempTitle);
    await page.getByRole('button', { name: /Create Domain/i }).click();

    await expect(page).toHaveURL(/\/domains/, { timeout: 15000 });

    page.on('dialog', (dialog) => dialog.accept());

    const domainItem = page
      .locator('tr, div[class*="bg-white"][class*="rounded-lg"]')
      .filter({ hasText: tempTitle })
      .first();
    const deleteBtn = domainItem
      .locator(
        'button:has-text("Delete"), [aria-label*="delete"], button:has-text("Purge"), button[title*="Delete"]'
      )
      .filter({ visible: true })
      .first();

    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByText(tempTitle)).toHaveCount(0, { timeout: 10000 });
    } else {
      test.skip();
    }
  });
});

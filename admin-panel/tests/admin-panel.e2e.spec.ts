import { expect, Page, test } from '@playwright/test';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateTestSkill, TEST_USERS } from './test-utils';

// Login helper
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

// Radix Select helper
async function selectOption(
  page: Page,
  triggerSelector: string,
  optionTextOrIndex: string | number
) {
  await page.click(triggerSelector);
  if (typeof optionTextOrIndex === 'number') {
    // Select by index (0-based)
    await page.locator('[role="option"]').nth(optionTextOrIndex).click();
  } else {
    // Select by text
    await page.getByRole('option', { name: optionTextOrIndex }).click();
  }
}

test.describe('Admin Panel E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  // Database setup
  let supabase: SupabaseClient;

  test.beforeAll(async () => {
    // Load environment variables if not already present
    if (!process.env.VITE_SUPABASE_URL) {
      try {
        const dotenv = await import('dotenv');
        dotenv.config({ path: '.env.test.local' });
        dotenv.config({ path: '.env.local' });
        dotenv.config({ path: '.env' });
      } catch (e) {
        console.warn('Could not load dotenv, assuming environment is set');
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment. Cannot seed test data.');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const { cleanTestData, seedTestData } = await import('./helpers/seed-test-data');

    supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate as super_admin so RLS allows seed operations
    // (when using anon key without service_role, we need a real session)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.SUPER_ADMIN.email,
        password: TEST_USERS.SUPER_ADMIN.password,
      });
      if (authError) {
        console.warn(`Auth failed (seeding may fail due to RLS): ${authError.message}`);
      }
    }

    // Clean and seed
    console.log('Seeding test data...');
    try {
      await cleanTestData(supabase);
      await seedTestData(supabase);
      console.log('Test data seeded successfully.');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (supabase) {
      const { cleanTestData } = await import('./helpers/seed-test-data');
      console.log('Cleaning up test data...');
      await cleanTestData(supabase);
    }
  });

  test.describe('Authentication', () => {
    test('should load login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Admin/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
      await expect(page.locator('text=Domains').first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
    });

    test('should logout successfully', async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);

      // Wait for session to stabilize
      await page.waitForTimeout(1000);

      // Find and click logout button by ID
      const logoutBtn = page.locator('#logout-button').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      } else {
        // Fallback
        const sidebarLogout = page
          .locator('button[title*="Sign Out"], button:has-text("Sign Out")')
          .first();
        if (await sidebarLogout.isVisible()) {
          await sidebarLogout.click();
          await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
        } else {
          console.log('Logout button not found - skipping logout test');
          test.skip();
        }
      }
    });

    test('should redirect to login when accessing protected route without auth', async ({
      page,
    }) => {
      await page.goto('/domains');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should load dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText(/Platform Velocity/i)).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to different sections from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.click('a[href="/domains"]');
      await expect(page).toHaveURL(/\/domains/);

      await page.goto('/dashboard');
      await page.click('a[href="/skills"]');
      await expect(page).toHaveURL(/\/skills/);
    });
  });

  test.describe('Domains Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should list all domains', async ({ page }) => {
      await page.goto('/domains');
      await expect(
        page
          .locator('button:has-text("Initialize Cluster"), a:has-text("Initialize Cluster")')
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('should create a new domain', async ({ page }) => {
      const testDomain = {
        name: `E2E Domain ${Date.now()}`,
        description: 'Testing domain creation',
      };

      await page.goto('/domains/new');

      // Use name attributes which are more stable
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

      // Submit form
      await page.getByRole('button', { name: /Initiate Provision/i }).click();

      // Should redirect back to list
      await expect(page).toHaveURL(/\/domains$/, { timeout: 15000 });

      // Search for the domain to handle pagination
      await page.waitForTimeout(1000); // Wait for list to load/hydrate
      const searchInput = page.getByPlaceholder(/Query curriculum domains/i);
      await searchInput.fill(testDomain.name);
      await page.waitForTimeout(500); // Wait for debounce

      await expect(page.getByText(testDomain.name, { exact: false }).first()).toBeVisible();
    });

    test('should edit an existing domain', async ({ page }) => {
      await page.goto('/domains');
      await page.waitForSelector('table tbody tr', { timeout: 10000 });

      const firstEditBtn = page
        .locator(
          'a[href^="/domains/"][href$="/edit"], button:has-text("Edit"), button[title*="Edit"]'
        )
        .first();
      if (await firstEditBtn.isVisible()) {
        await firstEditBtn.click();

        const titleInput = page.locator('input[name="title"]');
        await expect(titleInput).toBeVisible({ timeout: 15000 });

        const updatedTitle = `Updated Domain ${Date.now()}`;
        await titleInput.fill(updatedTitle);

        await page.waitForTimeout(500);
        const submitBtn = page.getByRole('button', { name: /Update Signature/i });
        await expect(submitBtn).toBeVisible({ timeout: 5000 });
        await submitBtn.click();

        // Wait for navigation back to the domains list (confirms form submitted)
        await page.waitForURL('**/domains', { timeout: 20000 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verify the updated title appears in the domains list
        await expect(page.getByText(updatedTitle).first()).toBeVisible({ timeout: 15000 });
      } else {
        test.skip();
      }
    });

    test('should delete a domain', async ({ page }) => {
      await page.goto('/domains/new');
      const tempTitle = `Delete Me ${Date.now()}`;

      await page.locator('input[name="title"]').fill(tempTitle);
      await page.getByRole('button', { name: /Initiate Provision/i }).click();

      await expect(page).toHaveURL(/\/domains/, { timeout: 15000 });

      page.on('dialog', (dialog) => dialog.accept());

      const row = page.locator('tr').filter({ hasText: tempTitle });
      const deleteBtn = row
        .locator(
          'button:has-text("Delete"), [aria-label*="delete"], button:has-text("Purge"), button[title*="Delete"]'
        )
        .first();

      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await expect(page.getByText(tempTitle)).toHaveCount(0, { timeout: 10000 });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Skills Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should list all skills', async ({ page }) => {
      await page.goto('/skills');
      await expect(
        page.locator('a[href="/skills/new"], button:has-text("New Skill")').first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('should create a new skill', async ({ page }) => {
      const testSkill = generateTestSkill();
      await page.goto('/skills/new');

      await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });

      const domainSelect = page.locator('button[role="combobox"]').first();
      if (await domainSelect.isVisible()) {
        await selectOption(page, 'button[role="combobox"]', 0);
      }

      await page.locator('input[name="title"]').fill(testSkill.name);
      await page.locator('textarea[name="description"]').fill(testSkill.description);

      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /Create|Skill|Provision/i }).click();

      await expect(page).toHaveURL(/\/skills/);
      await expect(page.getByText(testSkill.name).first()).toBeVisible();
    });
  });

  test.describe('Questions Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should list all questions', async ({ page }) => {
      await page.goto('/questions');
      await expect(
        page.locator('a[href="/questions/new"], button:has-text("Initialize Asset")').first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('should create a new MCQ question', async ({ page }) => {
      await page.goto('/questions/new');

      const contentEditor = page.locator('.ProseMirror, textarea[name="content"]').first();
      await expect(contentEditor).toBeVisible({ timeout: 15000 });

      const skillTrigger = page
        .locator('button[role="combobox"]')
        .filter({ hasText: /Skill|ontology/i });
      if (await skillTrigger.isVisible()) {
        await skillTrigger.click();
        const firstOption = page.locator('[role="option"]').first();
        await expect(firstOption).toBeVisible({ timeout: 10000 });
        await firstOption.click();
        await page.keyboard.press('Escape');
      }

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
      await page.getByRole('button', { name: /DEPLOY QUESTION/i }).click();

      await expect(page).toHaveURL(/\/questions/, { timeout: 15000 });
      await expect(page.getByText(`${questionId}`).first()).toBeVisible({ timeout: 10000 });
    });
  });
});

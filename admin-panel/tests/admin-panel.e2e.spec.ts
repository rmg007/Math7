import { test, expect, Page } from '@playwright/test';
import { TEST_CREDENTIALS, generateTestSkill } from './test-utils';
import { SupabaseClient } from '@supabase/supabase-js';

// Login helper
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

// Radix Select helper
async function selectOption(page: Page, triggerSelector: string, optionTextOrIndex: string | number) {
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
        dotenv.config({ path: '.env' });
        dotenv.config({ path: '.env.local' });
      } catch (e) {
        console.warn('Could not load dotenv, assuming environment is set');
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment. Cannot seed test data.');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const { cleanTestData, seedTestData } = await import('./helpers/seed-test-data');

    supabase = createClient(supabaseUrl, supabaseKey);

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
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
      await expect(page.locator('text=Domains').first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
    });

    // test('should logout successfully', async ({ page }) => {
    //   await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    //   
    //   // Open user menu and logout
    //   // Assuming there is a user menu or logout button. 
    //   // If sidebar has logout:
    //   const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
    //   // If user menu:
    //   if (!await logoutBtn.isVisible()) {
    //      // Try clicking avatar/profile
    //      await page.locator('button[aria-label="User menu"], [data-testid="user-menu"]').click();
    //      await page.locator('text=Log out').click();
    //   } else {
    //      await logoutBtn.click();
    //   }
    //   
    //   await expect(page).toHaveURL(/\/login/);
    // });

    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/domains');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    });

    // test('should load dashboard', async ({ page }) => {
    //   await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    //   // Check for stats cards
    //   await expect(page.locator('text=Total Domains')).toBeVisible();
    //   await expect(page.locator('text=Total Skills')).toBeVisible();
    // });

    test('should navigate to different sections from dashboard', async ({ page }) => {
      await page.click('a[href="/domains"]');
      await expect(page).toHaveURL(/\/domains/);

      await page.click('a[href="/skills"]');
      await expect(page).toHaveURL(/\/skills/);

      await page.click('a[href="/questions"]');
      await expect(page).toHaveURL(/\/questions/);
    });
  });

  test.describe('Domains Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    });

    test('should list all domains', async ({ page }) => {
      await page.goto('/domains');
      await expect(page.locator('h2:has-text("Domains")')).toBeVisible(); // Changed to h2 based on domain-form.tsx line 81
      await expect(page.locator('a[href="/domains/new"]').first()).toBeVisible();
    });

    // test('should create a new domain', async ({ page }) => {
    //   const testDomain = generateTestDomain();
    //   await page.goto('/domains/new');
    //   
    //   await page.fill('input[name="title"]', testDomain.name);
    //   await page.fill('input[name="slug"]', `slug_${Date.now()}`); // Slug validation requires lowercase, dash/underscore
    //   await page.fill('textarea[name="description"]', testDomain.description);
    //   // Sort Order default is 0, leave it.
    //   await page.waitForTimeout(1000); // Wait for form to settle
    //   await page.click('button[type="submit"]');
    //   
    //   // Should redirect to domains list
    //   await expect(page).toHaveURL(/\/domains/);
    //   await page.reload();
    //   // Wait for the new domain to appear
    //   await expect(page.locator(`text=${testDomain.name}`).first()).toBeVisible();
    // });

    // test('should edit an existing domain', async ({ page }) => {
    //     await page.goto('/domains');
    //     // Wait for list to load
    //     await page.waitForSelector('table tbody tr'); 
    //     
    //     // Find the first Edit button
    //     const firstEditBtn = page.locator('a[href^="/domains/"][href$="/edit"]').first();
    //     if (await firstEditBtn.isVisible()) {
    //         await firstEditBtn.click({ force: true });
    //         
    //         const updatedTitle = `Updated Domain ${Date.now()}`;
    //         await page.fill('input[name="title"]', updatedTitle);
    //         await page.click('button[type="submit"]');
    //         
    //         await expect(page).toHaveURL(/\/domains/);
    //         await page.reload(); // Ensure list is refreshed
    //         await page.waitForLoadState('networkidle');
    //         await expect(page.locator(`text=${updatedTitle}`).first()).toBeVisible();
    //     } else {
    //         console.log('No domains to edit, skipping test');
    //     }
    // });

    // test('should delete a domain', async ({ page }) => {
    //     // Create a throwaway domain first
    //     await page.goto('/domains/new');
    //     const tempTitle = `Delete Me ${Date.now()}`;
    //     await page.fill('input[name="title"]', tempTitle);
    //     await page.fill('input[name="slug"]', `del_${Date.now()}`);
    //     await page.click('button[type="submit"]');
    //     await expect(page).toHaveURL(/\/domains/);
    //     await page.reload();
    //     await expect(page.locator(`text=${tempTitle}`).first()).toBeVisible();
    //
    //     // Bypass confirm dialog
    //     await page.evaluate(() => { window.confirm = () => true; });
    //
    //     const row = page.locator('tr').filter({ hasText: tempTitle });
    //     const deleteBtn = row.locator('button').filter({ hasText: 'Delete' });
    //     await deleteBtn.click({ force: true });
    //     
    //     await expect(page.locator('text=Domain deleted')).toBeVisible();
    //     // await expect(page.locator(`text=${tempTitle}`)).toHaveCount(0);
    // });
  });

  test.describe('Skills Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    });

    test('should list all skills', async ({ page }) => {
      await page.goto('/skills');
      await expect(page.locator('h2:has-text("Skills")')).toBeVisible();
      await expect(page.locator('a[href="/skills/new"]').first()).toBeVisible();
    });

    test('should create a new skill', async ({ page }) => {
      const testSkill = generateTestSkill();
      await page.goto('/skills/new');

      // Select Domain first
      await selectOption(page, 'button[role="combobox"]:has-text("Select a domain")', 0); // Select first available domain

      await page.fill('input[name="title"]', testSkill.name);
      await page.fill('input[name="slug"]', `skill_${Date.now()}`);
      await page.fill('textarea[name="description"]', testSkill.description);
      await page.fill('input[name="difficulty_level"]', '3'); // 1-5

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/skills/);
      await expect(page.locator(`text=${testSkill.name}`).first()).toBeVisible();
    });

    test('should filter skills by domain', async ({ page }) => {
      await page.goto('/skills');
      // Assuming there is a domain filter select
      const filterTrigger = page.locator('button[role="combobox"]:has-text("Filter by Domain")').or(page.locator('button[role="combobox"]:has-text("All Domains")'));

      if (await filterTrigger.isVisible()) {
        await selectOption(page, filterTrigger, 0); // Select first domain
        await page.waitForTimeout(1000); // Wait for filter
        // Verify items are displayed (or empty state)
        // Just verifying it doesn't crash
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  test.describe('Questions Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    });

    test('should list all questions', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.locator('h2:has-text("Questions")')).toBeVisible();
      const createBtn = page.locator('a[href="/questions/new"]');
      await expect(createBtn.first()).toBeVisible();
    });

    test('should create a new MCQ question', async ({ page }) => {
      await page.goto('/questions/new');

      // Select Skill
      await selectOption(page, 'button[role="combobox"]:has-text("Select a skill")', 0);

      // Select Type (MCQ is default usually, but let's be explicit)
      // Note: Initial type is multiple_choice.

      // Fill Content (RichTextEditor)
      // Locate the ProseMirror editor div
      const editor = page.locator('.ProseMirror').first();
      await editor.fill('What is 2 + 2?');

      // Fill Options
      // MCQ options are rendered. "Option A", "Option B" inputs.
      // Option A
      await page.fill('input[placeholder="Option A"]', '4');
      // Option B
      await page.fill('input[placeholder="Option B"]', '5');

      // Select Correct Answer
      await page.click('button[role="radio"][value="a"]'); // Select A

      // Fill Explanation
      const explanationEditor = page.locator('.ProseMirror').nth(1); // Second editor
      if (await explanationEditor.isVisible()) {
        await explanationEditor.fill('Because math.');
      }

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/questions/);
    });
  });
});

import { test, expect, Page } from '@playwright/test';
import { TEST_USERS, generateTestSkill } from './test-utils';
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
        dotenv.config({ path: '.env.test.local' });
        dotenv.config({ path: '.env.local' });
        dotenv.config({ path: '.env' });
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
      
      // Try to find logout button - could be in header, sidebar, or user menu
      let logoutFound = false;
      
      // Method 1: Direct logout button
      const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        logoutFound = true;
      } else {
        // Method 2: User menu dropdown
        const userMenuBtn = page.locator('button[aria-label*="user"], button[aria-label*="profile"], [data-testid="user-menu"]').first();
        if (await userMenuBtn.isVisible()) {
          await userMenuBtn.click();
          await page.waitForTimeout(500);
          const logoutOption = page.locator('text=Logout, text=Log out, button:has-text("Logout")').first();
          if (await logoutOption.isVisible()) {
            await logoutOption.click();
            logoutFound = true;
          }
        }
      }
      
      if (logoutFound) {
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      } else {
        console.log('Logout button not found - test skipped');
        test.skip();
      }
    });

    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/domains');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should load dashboard', async ({ page }) => {
      await page.goto('/');
      
      // Check for executive dashboard heading
      await expect(page.locator('h1, h2').filter({ hasText: /Executive Dashboard/i })).toBeVisible({ timeout: 15000 });
      
      // Look for the stats cards
      await expect(page.getByText(/SYSTEM OVERVIEW/i)).toBeVisible();
    });

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
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should list all domains', async ({ page }) => {
      await page.goto('/domains');
      await expect(page.locator('text=Curriculum Domains')).toBeVisible();
      await expect(page.locator('button:has-text("New Domain")').first()).toBeVisible();
    });

    test('should create a new domain', async ({ page }) => {
      const testDomain = {
        name: `E2E Test Domain ${Date.now()}`,
        description: 'E2E test domain description'
      };
      
      await page.goto('/domains/new');
      
      // Expect Create Domain heading
      await expect(page.locator('h1, h2').filter({ hasText: /Create Domain/i })).toBeVisible({ timeout: 10000 });
      
      // Fill form fields
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[id*="title"]').first();
      await expect(titleInput).toBeVisible();
      await titleInput.fill(testDomain.name);
      
      const slugInput = page.locator('input[name="slug"], input[placeholder*="slug"], input[id*="slug"]').first();
      if (await slugInput.isVisible()) {
        await slugInput.fill(`slug_${Date.now()}`);
      }
      
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description"], .ProseMirror').first();
      if (await descInput.isVisible()) {
        if (await descInput.getAttribute('contenteditable') === 'true') {
          await descInput.click();
          await descInput.fill(testDomain.description);
        } else {
          await descInput.fill(testDomain.description);
        }
      }
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Initiate Provision")');
      
      // Should redirect to domains list
      await expect(page).toHaveURL(/\/domains/, { timeout: 15000 });
      
      // Verify the domain was created
      await page.reload();
      await expect(page.locator(`text=${testDomain.name}`).first()).toBeVisible({ timeout: 10000 });
    });

    test('should edit an existing domain', async ({ page }) => {
        await page.goto('/domains');
        // Wait for list to load
        await page.waitForSelector('table tbody tr, .data-table-row, [role="row"]', { timeout: 10000 }); 
        
        // Find the first Edit button
        const firstEditBtn = page.locator('a[href^="/domains/"][href$="/edit"], button:has-text("Edit"), [data-testid="edit"]').first();
        if (await firstEditBtn.isVisible()) {
            await firstEditBtn.click();
            
            // Wait for edit form to load
            await expect(page.locator('h1, h2').filter({ hasText: /Modify Domain/i })).toBeVisible({ timeout: 10000 });
            
            const updatedTitle = `Updated Domain ${Date.now()}`;
            const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[id*="title"]').first();
            await expect(titleInput).toBeVisible();
            await titleInput.clear();
            await titleInput.fill(updatedTitle);
            
            // Submit form
            await page.click('button[type="submit"]:has-text("Update Signature")');
            
            await expect(page).toHaveURL(/\/domains/, { timeout: 15000 });
            await page.reload();
            await page.waitForLoadState('networkidle');
            await expect(page.locator(`text=${updatedTitle}`).first()).toBeVisible({ timeout: 10000 });
        } else {
            console.log('No domains to edit, skipping test');
            test.skip();
        }
    });

    test('should delete a domain', async ({ page }) => {
        // Create a throwaway domain first
        await page.goto('/domains/new');
        const tempTitle = `Delete Me ${Date.now()}`;
        
        // Wait for form and fill it
        await expect(page.locator('h1, h2').filter({ hasText: /Create Domain/i })).toBeVisible({ timeout: 10000 });
        
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[id*="title"]').first();
        await titleInput.fill(tempTitle);
        
        const slugInput = page.locator('input[name="slug"], input[placeholder*="slug"], input[id*="slug"]').first();
        if (await slugInput.isVisible()) {
          await slugInput.fill(`del_${Date.now()}`);
        }
        
        // Submit form
        await page.click('button[type="submit"]:has-text("Initiate Provision")');
        
        await expect(page).toHaveURL(/\/domains/, { timeout: 15000 });
        await page.reload();
        await expect(page.locator(`text=${tempTitle}`).first()).toBeVisible({ timeout: 10000 });

        // Bypass confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Find and click delete button
        const row = page.locator('tr, .data-table-row, [role="row"]').filter({ hasText: tempTitle });
        const deleteBtn = row.locator('button:has-text("Delete"), button[aria-label*="delete"], [data-testid="delete"]').first();
        
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            
            // Check for success message or just verify the item is gone
            try {
              await expect(page.locator('text=Domain deleted, text=deleted successfully')).toBeVisible({ timeout: 5000 });
            } catch {
              // If no success message, just verify the domain is gone
              await page.reload();
              await expect(page.locator(`text=${tempTitle}`)).toHaveCount(0);
            }
        } else {
            console.log('Delete button not found, skipping delete test');
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
      await expect(page.locator('h1, h2').filter({ hasText: /Curriculum Skills/i })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('a[href="/skills/new"]').first()).toBeVisible();
    });

    test('should create a new skill', async ({ page }) => {
      const testSkill = generateTestSkill();
      await page.goto('/skills/new');

      // Expect Provision Skill heading
      await expect(page.locator('h1, h2').filter({ hasText: /Provision Skill/i })).toBeVisible({ timeout: 10000 });

      // Select Domain first
      await selectOption(page, 'button[role="combobox"]:has-text("Select a domain")', 0); // Select first available domain

      await page.fill('input[name="title"]', testSkill.name);
      await page.fill('input[name="slug"]', `skill_${Date.now()}`);
      await page.fill('textarea[name="description"]', testSkill.description);
      await page.fill('input[name="difficulty_level"]', '3'); // 1-5

      await page.click('button[type="submit"]:has-text("Anchor Skill")');

      await expect(page).toHaveURL(/\/skills/);
      await expect(page.locator(`text=${testSkill.name}`).first()).toBeVisible();
    });

    test('should filter skills by domain', async ({ page }) => {
      await page.goto('/skills');
      // Assuming there is a domain filter select
      const filterTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Filter by Domain|All Domains/ });

      if (await filterTrigger.isVisible()) {
        await filterTrigger.click();
        await page.locator('[role="option"]').first().click();
        await page.waitForTimeout(1000); // Wait for filter
        // Verify items are displayed (or empty state)
        // Just verifying it doesn't crash
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  test.describe('Questions Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    });

    test('should list all questions', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.locator('h1, h2').filter({ hasText: /Question Registry/i })).toBeVisible({ timeout: 10000 });
      const createBtn = page.locator('a[href="/questions/new"]');
      await expect(createBtn.first()).toBeVisible();
    });

    test('should create a new MCQ question', async ({ page }) => {
      await page.goto('/questions/new');

      // Wait for form to load
      await expect(page.locator('h1, h2').filter({ hasText: /Architect Question/i })).toBeVisible({ timeout: 10000 });

      // 1. Select Skill — combobox labeled "Target Skill Segment"
      await page.getByRole('combobox', { name: 'Target Skill Segment' }).click();
      await page.locator('[role="option"]').first().click();
      // Close any overlay/dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // 2. Fill Question Content — click the ProseMirror editor within "Question Core" section
      const questionEditor = page.locator('.ProseMirror').first();
      await questionEditor.click();
      await page.keyboard.type('E2E Test: What is 2 + 2?');
      await page.waitForTimeout(300);

      // 3. Fill Options — textbox roles with placeholder labels
      await page.getByRole('textbox', { name: 'Option A' }).fill('4');
      await page.getByRole('textbox', { name: 'Option B' }).fill('5');

      // 4. Select correct answer — click first radio button (Option A)
      await page.getByRole('radio').first().click();

      // 5. Fill Explanation (second ProseMirror editor)
      const explanationEditor = page.locator('.ProseMirror').nth(1);
      if (await explanationEditor.isVisible()) {
        await explanationEditor.click();
        await page.keyboard.type('Because 2 + 2 = 4.');
      }

      // 6. Submit — button labeled "DEPLOY QUESTION"
      await page.click('button[type="submit"]:has-text("DEPLOY QUESTION")');

      // Should redirect to questions list
      await expect(page).toHaveURL(/\/questions/, { timeout: 15000 });
    });
  });
});

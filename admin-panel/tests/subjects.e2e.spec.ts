import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from './test-utils';

test.describe('Subjects Management Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  test('should validate required fields and formats', async ({ page }) => {
    await page.goto('/subjects');
    await page.waitForLoadState('networkidle'); // Wait for full hydration

    // Open "New Subject" dialog
    const newSubjectBtn = page.getByRole('button', { name: /Add Subject/i });
    // Handle potential multiple buttons (e.g. mobile view or loading skeletons)
    // Use .first() but ensure it's the right one
    const btn = newSubjectBtn.first();
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // 1. Submit empty form -> Expect 'Required' errors
    const saveBtn = page.getByRole('button', { name: /CREATE SUBJECT/i });
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();
    
    console.log('Clicking save empty form...');
    await saveBtn.click();

    // Check for validation messages
    console.log('Checking for validation errors...');
    // Zod schema messages: "Title is required", "Slug is required"
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Slug is required')).toBeVisible();

    // 2. Invalid Slug Format (Normalization check skipped for now)
    
    // 3. Start with number in slug
    console.log('Testing valid slug...');
    const slugInput = page.getByTestId('subject-slug');
    await slugInput.click();
    await slugInput.fill('valid_slug_123');
    await expect(slugInput).toHaveValue('valid_slug_123');

    // "Slug is required" error should disappear. "Title is required" should persist.
    await expect(page.getByText('Slug is required')).not.toBeVisible();
    await expect(page.getByText('Title is required')).toBeVisible();

    // 4. Invalid Hex Color
    console.log('Testing invalid color...');
    const colorInput = page.getByTestId('subject-color');
    await colorInput.fill('not-a-color');
    await saveBtn.click();
    await expect(page.getByText('Must be a valid hex color code')).toBeVisible();

    await colorInput.fill('#123'); // Too short
    await saveBtn.click();
    await expect(page.getByText('Must be a valid hex color code')).toBeVisible();

    // 5. Valid Submission
    console.log('Testing valid submission...');
    const uniqueId = Date.now();
    await page.getByTestId('subject-title').fill(`Subject ${uniqueId}`);
    await slugInput.fill(`subject_${uniqueId}`);
    await colorInput.fill('#4F46E5');
    await page.getByPlaceholder(/Brief architectural scope/i).fill('Test Description');

    await saveBtn.click();
    console.log('Submitted form...');

    // Dialog should close and new subject should appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(`Subject ${uniqueId}`)).toBeVisible();
  });
});

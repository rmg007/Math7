import { expect, test } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, '..', '..', '.auth');
const authState = (role: string) => path.join(AUTH_DIR, `${role}.json`);

test.describe('Subjects Management Form Validation @logic', () => {
  test.use({ storageState: authState('super-admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/subjects');
    // Wait for heading to ensure page is hydrated
    await expect(page.getByRole('heading', { name: /Subjects/i }).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test('should validate required fields and formats @logic', async ({ page }) => {
    // Open "New Subject" dialog
    const newSubjectBtn = page.getByRole('button', { name: /New Subject/i });
    await expect(newSubjectBtn.first()).toBeVisible({ timeout: 15000 });
    const btn = newSubjectBtn.first();
    await btn.click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // 1. Submit empty form -> Expect 'Required' errors
    const saveBtn = page.getByRole('button', { name: /AUTHORIZE DEPLOYMENT/i });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
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
    await page.getByPlaceholder(/Brief description/i).fill('Test Description');

    await saveBtn.click();
    console.log('Submitted form...');

    // Dialog should close and new subject should appear
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Subject ${uniqueId}`).first()).toBeVisible({ timeout: 15000 });
  });
});

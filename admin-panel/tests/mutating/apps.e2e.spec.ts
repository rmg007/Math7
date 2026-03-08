import { expect, test } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, '..', '..', '.auth');
const authState = (role: string) => path.join(AUTH_DIR, `${role}.json`);

test.describe('Apps Management CRUD @logic', () => {
  test.use({ storageState: authState('super-admin') });

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    await page.goto('/apps');
    // Wait for the main heading to be visible, ensuring the page is hydrated
    await expect(page.getByRole('heading', { name: /Applications/i }).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test('should handle full CRUD with normalization', async ({ page }) => {
    // 1. CREATE
    const newAppBtn = page.getByRole('button', { name: /New Application/i }).first();
    await expect(newAppBtn).toBeVisible({ timeout: 15000 });
    await newAppBtn.click();

    const uniqueId = Date.now();
    const appData = {
      name: `  App ${uniqueId}  `,
      subdomain: `sub-${uniqueId}`,
      grade: `  Grade ${uniqueId}  `,
    };

    // Handle Radix Select for Subject
    const selectTrigger = page
      .getByRole('combobox', { name: /Subject/i })
      .or(page.getByRole('combobox').first());
    await selectTrigger.click();
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('option').first().click();
    await page.waitForTimeout(1000);

    // Use getByTestId for absolute reliability
    await page.getByTestId('app-display-name').fill(appData.name, { force: true });
    await page.getByTestId('app-subdomain').fill(appData.subdomain, { force: true });
    await page.getByTestId('app-grade-level').fill(appData.grade, { force: true });

    // Save
    await page.getByTestId('app-submit-btn').click();

    // Verify creation and normalization using search to isolate the record
    await page.getByTestId('apps-search-input').fill(`App ${uniqueId}`);
    const normalizedName = `App ${uniqueId}`;

    // Expect the normalized display name visible in the table
    await expect(page.locator('tr').filter({ hasText: normalizedName }).first()).toBeVisible({
      timeout: 20000,
    });

    // Check if the subdomain is visible in the row
    const row = page.locator('tr').filter({ hasText: normalizedName });
    await row
      .locator('button')
      .filter({ has: page.locator('.lucide-pencil') })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const updatedName = `Updated ${uniqueId}`;
    const editNameInput = page.getByTestId('app-display-name');
    await editNameInput.fill('', { force: true }); // Clear
    await editNameInput.fill(updatedName, { force: true });

    await page.getByRole('button', { name: /UPDATE CLUSTER/i }).click();

    // Wait for dialog to close to ensure state has propagated
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Clear search and search for the updated name
    await page.getByTestId('apps-search-input').fill('');
    await page.getByTestId('apps-search-input').fill(updatedName);

    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 20000 });

    // 3. DELETE
    const updatedRow = page.locator('tr').filter({ hasText: updatedName });

    // Click delete button from the row
    await updatedRow.getByTestId('app-delete-btn').first().click();

    // Confirm deletion in the dialog
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    // Clear search before checking for deletion, otherwise getByText will match the search input itself
    await page.getByTestId('apps-search-input').fill('');

    // Wait for the row to be gone
    await expect(page.getByText(updatedName)).toHaveCount(0, { timeout: 20000 });
  });

  test('should validate app form inputs @logic', async ({ page }) => {
    await page.goto('/apps');

    const newAppBtn = page.getByRole('button', { name: /New Application/i }).first();
    await expect(newAppBtn).toBeVisible({ timeout: 15000 });
    await newAppBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 1. Submit empty form
    const saveBtn = page.getByRole('button', { name: /AUTHORIZE DEPLOYMENT/i });
    await expect(saveBtn).toBeEnabled();
    console.log('Clicking save in apps form...');
    // Save
    await saveBtn.click();
    await page.waitForTimeout(1000); // Wait for validation state to propagate

    // Expect required errors
    await expect(page.getByText(/Display name is required/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Subdomain is required/i).first()).toBeVisible({ timeout: 10000 });
    // Subject is also required, but might default to first option if not careful?
    // The select component might need interaction to trigger validation if it's empty initially.

    // 2. Invalid Subdomain - Should be auto-normalized
    const subdomainInput = page.getByTestId('app-subdomain');
    await subdomainInput.fill('Invalid Subdomain!');

    // Check normalization: "Invalid Subdomain!" -> "invalidsubdomain"
    await expect(subdomainInput).toHaveValue('invalidsubdomain');

    // Submitting with valid (normalized) subdomain should NOT show error
    await saveBtn.click();
    await expect(
      page.getByText('Subdomain must contain only lowercase letters, numbers, and dashes')
    ).not.toBeVisible();

    // 3. Subdomain with uppercase (should be auto-normalized)
    await subdomainInput.fill('UpperCase');
    await expect(subdomainInput).toHaveValue('uppercase');

    // 4. Invalid length
    // Note: AppsPage slices to 63, so this should result in exactly 63 chars.
    await subdomainInput.fill('a'.repeat(64));
    await expect(subdomainInput).toHaveValue('a'.repeat(63));

    // 5. Valid Submission Check (already covered in previous test, so skip full submission here)
    const closeBtn = page.getByRole('button', { name: /Abort Changes/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});

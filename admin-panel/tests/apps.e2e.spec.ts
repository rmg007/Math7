import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from './test-utils';

test.describe('Apps Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  test('should handle full CRUD with normalization', async ({ page }) => {
    await page.goto('/apps');

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
    await page.getByRole('option').first().click();
    await page.waitForTimeout(2000); // Extensive wait for portal closure

    // Use getByTestId for absolute reliability
    await page.getByTestId('app-display-name').fill(appData.name, { force: true });
    await page.getByTestId('app-subdomain').fill(appData.subdomain, { force: true });
    await page.getByTestId('app-grade-level').fill(appData.grade, { force: true });

    // Save
    await page.getByRole('button', { name: /AUTHORIZE DEPLOYMENT/i }).click();

    // Verify creation and normalization
    const normalizedName = `App ${uniqueId}`;
    const normalizedSubdomain = `sub-${uniqueId}`;

    await expect(page.getByText(normalizedName)).toBeVisible({ timeout: 20000 });

    // Check if the subdomain is visible in the row
    await expect(
      page
        .locator('tr')
        .filter({ hasText: normalizedName })
        .getByText(`${normalizedSubdomain}.questerix.com`)
    ).toBeVisible();

    // 2. UPDATE
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

    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 20000 });

    // 3. DELETE
    const updatedRow = page.locator('tr').filter({ hasText: updatedName });

    // Setup dialog handler
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete button (Trash icon)
    await updatedRow
      .locator('button')
      .filter({ has: page.locator('.lucide-trash2') })
      .first()
      .click();

    // Verify deletion
    await expect(page.getByText(updatedName)).toHaveCount(0, { timeout: 15000 });
  });

  test('should validate app form inputs', async ({ page }) => {
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
    await saveBtn.click();
    console.log('Clicked save. Checking errors...');
    
    // Expect required errors
    await expect(page.getByText('Display name is required')).toBeVisible();
    await expect(page.getByText('Subdomain is required')).toBeVisible();
    // Subject is also required, but might default to first option if not careful? 
    // The select component might need interaction to trigger validation if it's empty initially.
    
    // 2. Invalid Subdomain - Should be auto-normalized
    const subdomainInput = page.getByTestId('app-subdomain');
    await subdomainInput.fill('Invalid Subdomain!');
    
    // Check normalization: "Invalid Subdomain!" -> "invalidsubdomain"
    await expect(subdomainInput).toHaveValue('invalidsubdomain');

    // Submitting with valid (normalized) subdomain should NOT show error
    await saveBtn.click();
    await expect(page.getByText('Subdomain must contain only lowercase letters, numbers, and dashes')).not.toBeVisible();
    
    // 3. Subdomain with uppercase (should be auto-normalized)
    await subdomainInput.fill('UpperCase');
    await expect(subdomainInput).toHaveValue('uppercase'); 

    // 4. Invalid length (too long) but max is 63 char.
    const longSubdomain = 'a'.repeat(64);
    await subdomainInput.fill(longSubdomain);
    // The slice(0, 63) in onChange prevents this, so value should be 63 chars.
    await expect(subdomainInput).toHaveValue('a'.repeat(63));

    // 5. Valid Submission Check (already covered in previous test, so skip full submission here)
    const closeBtn = page.getByRole('button', { name: /Abort Changes/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});


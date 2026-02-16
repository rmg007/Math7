import { expect, Page, test } from '@playwright/test';
import { TEST_USERS } from './test-utils';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard or domains
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('Apps Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  test('should handle full CRUD with normalization', async ({ page }) => {
    await page.goto('/apps');

    // 1. CREATE
    const newAppBtn = page.getByRole('button', { name: /New Application/i });
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
});

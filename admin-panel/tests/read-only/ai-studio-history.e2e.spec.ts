import { expect, test } from '@playwright/test';

test.describe('AI Studio History @read-only', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/questions/studio/history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("AI Studio History")')).toBeVisible();
  });

  test('should list recent prompts and show details and re-run', async ({ page }) => {
    // 1. Wait for prompts to load
    const promptItem = page.getByTestId('prompt-item').first();
    const hasPrompts = await promptItem.isVisible({ timeout: 10000 });

    if (!hasPrompts) {
      console.log('No prompts found in history, skipping detail view check.');
      await expect(page.getByText(/No prompts found/i)).toBeVisible();
      return;
    }

    // 2. Click the first item
    await promptItem.click();

    // Verify details panel shows up
    await expect(page.locator('p:has-text("Topics")')).toBeVisible();

    // 3. Test Re-run flow
    const rerunBtn = page.getByRole('button', { name: /Re-run this Prompt/i });
    await expect(rerunBtn).toBeVisible();
    await rerunBtn.click();

    // Should redirect to studio with query params
    await expect(page).toHaveURL(/\/questions\/studio\?/);
    await expect(page).toHaveURL(/domain=/);

    // Check if domain is pre-filled (should not be 'Select a domain...')
    await expect(page.locator('button:has-text("Select a domain...")')).not.toBeVisible();

    // Ensure generate button is eventually enabled (since it should have domain, topics, types from URL)
    await expect(page.getByTestId('generate-btn')).toBeEnabled({ timeout: 15000 });
  });

  test('should search and filter prompts', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search by domain or topic/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Mathematics');
    // Basic check that it doesn't crash after filtering
    await page.waitForTimeout(1000);
  });
});

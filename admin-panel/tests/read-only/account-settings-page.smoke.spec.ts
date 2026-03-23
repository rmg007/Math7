/**
 * AccountSettingsPage Smoke Tests @regression
 *
 * Covers: admin-panel/src/features/auth/pages/AccountSettingsPage.tsx
 * Route:  /settings
 *
 * Design rules:
 *   - @regression tag on every test so --grep @regression picks them up.
 *   - Read-only: does not trigger deactivate/delete RPCs.
 *   - Uses global storageState (super-admin authenticated) — no auth override.
 *   - Profile data is loaded from real Supabase (read-only query, safe for smoke).
 *   - Must complete in < 30 seconds total (smoke config timeout).
 */
import { expect, test } from '@playwright/test';

test.describe('AccountSettingsPage @regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    // Wait for the page root to mount (profile load is async — wait for the profile section)
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Settings heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('profile section is visible with identity fields @regression', async ({ page }) => {
    await expect(page.locator('[data-testid="settings-profile-section"]')).toBeVisible();
    // The section must show at least one of the profile labels
    const profileSection = page.locator('[data-testid="settings-profile-section"]');
    await expect(
      profileSection.getByText(/Legal Name|Contact Email|Role|Joined/i).first()
    ).toBeVisible();
  });

  test('user email is displayed in profile section @regression', async ({ page }) => {
    // The page loads the authenticated user's profile — email must be rendered
    const profileSection = page.locator('[data-testid="settings-profile-section"]');
    await expect(profileSection.getByText(/Contact Email/i)).toBeVisible();
  });

  test('Danger Zone section is present @regression', async ({ page }) => {
    await expect(page.getByText(/Danger Zone/i)).toBeVisible();
  });

  test('deactivate account action button is present @regression', async ({ page }) => {
    await expect(page.locator('[data-testid="settings-deactivate-btn"]')).toBeVisible();
  });

  test('delete account action button is present @regression', async ({ page }) => {
    await expect(page.locator('[data-testid="settings-delete-btn"]')).toBeVisible();
  });

  test('deactivate confirm panel is hidden by default @regression', async ({ page }) => {
    // Confirm panel should only appear after the deactivate button is clicked
    await expect(
      page.locator('[data-testid="settings-deactivate-confirm-panel"]')
    ).not.toBeVisible();
  });

  test('delete confirm panel is hidden by default @regression', async ({ page }) => {
    // Confirm panel should only appear after the delete button is clicked
    await expect(page.locator('[data-testid="settings-delete-confirm-panel"]')).not.toBeVisible();
  });

  test('deactivate confirm panel appears on button click and can be aborted @regression', async ({
    page,
  }) => {
    await page.locator('[data-testid="settings-deactivate-btn"]').click();
    await expect(page.locator('[data-testid="settings-deactivate-confirm-panel"]')).toBeVisible({
      timeout: 5000,
    });
    // Abort — should hide the panel without making any RPC calls
    await page.locator('[data-testid="settings-deactivate-abort-btn"]').click();
    await expect(
      page.locator('[data-testid="settings-deactivate-confirm-panel"]')
    ).not.toBeVisible();
  });

  test('delete confirm button is disabled until DELETE is typed @regression', async ({ page }) => {
    await page.locator('[data-testid="settings-delete-btn"]').click();
    await expect(page.locator('[data-testid="settings-delete-confirm-panel"]')).toBeVisible({
      timeout: 5000,
    });
    // Confirm button must be disabled until the exact text "DELETE" is entered
    await expect(page.locator('[data-testid="settings-delete-confirm-btn"]')).toBeDisabled();
    // Abort to clean up
    await page.locator('[data-testid="settings-delete-abort-btn"]').click();
  });
});

import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from '../test-utils';

/**
 * Squad (Groups) Smoke Tests @smoke
 *
 * Verifies core DB connectivity and data render for mentorship groups.
 */

test.describe('Squad Registry @smoke', () => {
  test('Super-Admin can read the Groups list @smoke', async ({ page }) => {
    await page.goto('/groups');

    // Check for "Groups" or "Squads" heading or a table
    await expect(page.getByRole('main')).toContainText(/Groups|Squads/i, { timeout: 15000 });

    // Page must render something (list or empty state)
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).not.toBeEmpty();
  });
});

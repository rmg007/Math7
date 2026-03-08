import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from '../test-utils';

/**
 * Authentication Smoke Tests @smoke
 */

test.describe('Authentication @smoke', () => {
  // Clear any existing session to test real login flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Super-Admin can log in successfully @smoke', async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Admin can log in successfully @smoke', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Student can log in successfully @smoke', async ({ page }) => {
    await login(page, TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

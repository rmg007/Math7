import { expect, test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS } from '../test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#login-email', TEST_USERS.SUPER_ADMIN.email);
  await page.fill('#login-password', TEST_USERS.SUPER_ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

test.describe('Icon Removal Verification @responsive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const PAGES = ['/apps', '/domains', '/skills', '/questions'];

  const FORBIDDEN_ICONS = ['.lucide-layout', '.lucide-graduation-cap', '.lucide-globe'];

  for (const pageUrl of PAGES) {
    test(`should not have decorative icons in ${pageUrl} table`, async ({ page, isMobile }) => {
      // Skip pages that hide table on mobile
      if (isMobile && pageUrl !== '/apps') {
        test.skip(true, 'Table is hidden on mobile for this page');
      }

      console.log(`Navigating to ${pageUrl}...`);
      await page.goto(pageUrl);

      // Verify we are on the correct page (not redirected to login)
      await expect(page).toHaveURL(new RegExp(pageUrl));

      // Wait for table
      try {
        await page.waitForSelector('table tbody', { timeout: 10000 });
      } catch (e) {
        throw new Error(`Table not found on ${pageUrl}. Possible auth issue or page error.`);
      }

      const tableBody = page.locator('table tbody');

      // Wait for content (either skeletons, empty state, or data)
      await expect(tableBody.locator('tr').first()).toBeVisible({ timeout: 10000 });

      const rowCount = await tableBody.locator('tr').count();
      console.log(`Found ${rowCount} rows in ${pageUrl}`);

      // Ensure we are testing something
      expect(rowCount).toBeGreaterThan(0);

      for (const iconSelector of FORBIDDEN_ICONS) {
        const iconCount = await tableBody.locator(iconSelector).count();
        if (iconCount > 0) {
          console.error(`FAILURE: Found ${iconCount} instances of ${iconSelector} in ${pageUrl}`);
        }
        expect(iconCount, `Found ${iconSelector} in ${pageUrl} table body`).toBe(0);
      }
    });
  }
});

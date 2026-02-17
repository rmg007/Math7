import { expect, test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS } from './test-utils';

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

test.describe('Automated Row Height Test', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const PAGES = [
    { name: 'Apps', url: '/apps' },
    { name: 'Subjects', url: '/subjects' },
    { name: 'Domains', url: '/domains' },
    { name: 'Skills', url: '/skills' },
    { name: 'Questions', url: '/questions' },
    { name: 'Users', url: '/users' },
    { name: 'Invitation Codes', url: '/invitation-codes' }
  ];

  for (const p of PAGES) {
    test(`Table rows in ${p.name} should be single-line (constant height)`, async ({ page }) => {
      await page.goto(p.url);
      await page.waitForLoadState('networkidle');
      
      // Select all rows in the main table body (filtering out empty states if they use rows)
      const rows = page.locator('tbody tr:not(:has(td[colspan]))');
      const count = await rows.count();
      
      if (count === 0) {
        console.log(`No data rows found on ${p.name}, skipping height verification.`);
        return;
      }

      const heights = await rows.evaluateAll((elements) => 
        elements.map(el => el.getBoundingClientRect().height)
      );

      // We expect all rows to have roughly the same height.
      // A common height is ~64px to ~80px. 
      // If a row wraps, it would jump significantly (e.g. > 100px).
      const MAX_SINGLE_LINE_HEIGHT = 96; 

      for (let i = 0; i < heights.length; i++) {
        expect(heights[i], `Row ${i} on ${p.name} is too tall (${heights[i]}px), possible line wrap!`).toBeLessThanOrEqual(MAX_SINGLE_LINE_HEIGHT);
      }
      
      // Also ensure they are not too small (though unlikely)
      const MIN_SINGLE_LINE_HEIGHT = 48;
      for (let i = 0; i < heights.length; i++) {
        expect(heights[i], `Row ${i} on ${p.name} is too short (${heights[i]}px)`).toBeGreaterThanOrEqual(MIN_SINGLE_LINE_HEIGHT);
      }
    });
  }
});

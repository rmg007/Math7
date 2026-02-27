import { expect, test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS, login } from './test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

test.describe('Automated Row Height Test', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
  });

  const PAGES = [
    { name: 'Apps', url: '/apps' },
    { name: 'Subjects', url: '/subjects' },
    { name: 'Domains', url: '/domains' },
    { name: 'Skills', url: '/skills' },
    { name: 'Questions', url: '/questions' },
    { name: 'Users', url: '/users' },
    { name: 'Invitation Codes', url: '/invitation-codes' },
  ];

  for (const p of PAGES) {
    test(`Table rows in ${p.name} should be single-line (constant height)`, async ({ page }) => {
      await page.goto(p.url);
      await page.waitForLoadState('networkidle');

      // Only run on desktop viewports where tables are definitely visible
      // Mobile (< 768px) and tablet (768px) use card views instead of tables
      const viewport = page.viewportSize();
      if (!viewport || viewport.width < 1024) {
        console.log(
          `Skipping ${p.name} on small viewport (${viewport?.width}px) - table replaced with card view.`
        );
        return;
      }

      // Wait for React hydration and data presence
      await page.waitForSelector('[data-hydration-complete="true"]', { timeout: 15000 });

      // Select data rows using test-ids (covers app-row, subject-row, and generic tr)
      const rows = page
        .locator('tbody tr[data-testid$="-row"], tbody tr:not(:has(td[colspan]))')
        .first();
      await rows.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

      const rowLocators = page.locator(
        'tbody tr[data-testid$="-row"], tbody tr:not(:has(td[colspan]))'
      );
      const count = await rowLocators.count();

      if (count === 0) {
        console.log(`No data rows found on ${p.name}, skipping height verification.`);
        return;
      }

      const heights = await rowLocators.evaluateAll((elements) =>
        elements.map((el) => (el as HTMLElement).offsetHeight)
      );

      // We expect all rows to have roughly the same height.
      // A common height is ~64px to ~80px.
      // If a row wraps, it would jump significantly (e.g. > 100px).
      const MAX_SINGLE_LINE_HEIGHT = 96;

      for (let i = 0; i < heights.length; i++) {
        expect(
          heights[i],
          `Row ${i} on ${p.name} is too tall (${heights[i]}px), possible line wrap!`
        ).toBeLessThanOrEqual(MAX_SINGLE_LINE_HEIGHT);
      }

      // Also ensure they are not too small (though unlikely)
      const MIN_SINGLE_LINE_HEIGHT = 48;
      for (let i = 0; i < heights.length; i++) {
        expect(
          heights[i],
          `Row ${i} on ${p.name} is too short (${heights[i]}px)`
        ).toBeGreaterThanOrEqual(MIN_SINGLE_LINE_HEIGHT);
      }
    });
  }
});

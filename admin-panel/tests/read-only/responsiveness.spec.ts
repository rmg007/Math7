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
  await page.waitForTimeout(1000);
}

test.describe('Responsive Layout Verification @responsive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard should not have horizontal scroll @responsive', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for animations

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(
      scrollWidth,
      `Page has horizontal overflow: ${scrollWidth} > ${clientWidth}`
    ).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Domain list page should be readable @responsive', async ({ page }) => {
    await page.goto('/domains');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForTimeout(1500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(
      scrollWidth,
      `Page /domains has horizontal overflow: ${scrollWidth} > ${clientWidth}`
    ).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Skill list page should be readable @responsive', async ({ page }) => {
    await page.goto('/skills');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForTimeout(1500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(
      scrollWidth,
      `Page /skills has horizontal overflow: ${scrollWidth} > ${clientWidth}`
    ).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Question list page should be readable @responsive', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.waitForTimeout(1500);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(
      scrollWidth,
      `Page /questions has horizontal overflow: ${scrollWidth} > ${clientWidth}`
    ).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('Creation forms should be responsive @responsive', async ({ page }) => {
    await page.goto('/domains/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, 'Creation form has horizontal overflow').toBeLessThanOrEqual(
      clientWidth + 2
    );
  });
});
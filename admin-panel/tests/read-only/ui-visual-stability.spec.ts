import { expect, test } from '@playwright/test';
import { QuestionFormPage } from '../pages/QuestionFormPage';
import { TEST_USERS } from '../test-utils';

/**
 * UI Visual Stability Tests (Phase 1.2)
 *
 * Verifies that critical interactive elements (popups, floating menus)
 * are visible and not clipped by overflow-hidden containers or viewport edges.
 */

test.describe('UI Visual Stability — Rich Text Editor & Symbol Matrix @responsive', () => {
  let qForm: QuestionFormPage;

  test.beforeEach(async ({ page }) => {
    // Standard login flow
    await page.goto('/login');
    await page.fill('#login-email', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('#login-password', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    qForm = new QuestionFormPage(page);
  });

  test('Symbol Matrix popup should be visible and not clipped (Desktop)', async ({ page }) => {
    await qForm.gotoNew();

    // Open Symbol Matrix via direct click for maximum reliability
    const smBtn = page
      .locator('div:has-text("Assessment Matrix")')
      .locator('button[title*="Insert Math"]')
      .first();
    await smBtn.scrollIntoViewIfNeeded();
    await smBtn.click({ force: true });

    // Wait for ANY palette to be visible
    const palette = page.getByTestId('symbol-matrix-palette').first();
    await palette.waitFor({ state: 'visible', timeout: 8000 });

    // Verify visibility
    await expect(palette).toBeVisible();

    // Verify it is not clipped (within viewport)
    const boundingBox = await palette.boundingBox();
    const viewport = page.viewportSize();

    expect(boundingBox).not.toBeNull();
    if (boundingBox && viewport) {
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width + 15);
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height + 15);
      expect(boundingBox.x).toBeGreaterThanOrEqual(-15);
      expect(boundingBox.y).toBeGreaterThanOrEqual(-15);
    }
  });

  test('Symbol Matrix popup should be visible and not clipped (Mobile 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await qForm.gotoNew();

    // Open Symbol Matrix via direct click
    const smBtn = page
      .locator('div:has-text("Assessment Matrix")')
      .locator('button[title*="Insert Math"]')
      .first();
    await smBtn.scrollIntoViewIfNeeded();
    await smBtn.click({ force: true });

    // Wait for palette visibility
    const palette = page.getByTestId('symbol-matrix-palette').first();
    await palette.waitFor({ state: 'visible', timeout: 10000 });
    await expect(palette).toBeVisible();

    // Verify it is not clipped
    const boundingBox = await palette.boundingBox();
    const viewport = page.viewportSize();

    expect(boundingBox).not.toBeNull();
    if (boundingBox && viewport) {
      // Allow a small margin of error (e.g. 10px)
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width + 10);
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height + 10);
      expect(boundingBox.x).toBeGreaterThanOrEqual(-10);
      expect(boundingBox.y).toBeGreaterThanOrEqual(-10);
    }
  });

  test('Rich Text Editor toolbar should be accessible', async ({ page }) => {
    await qForm.gotoNew();

    const editor = page.locator('.ProseMirror').first();
    await editor.scrollIntoViewIfNeeded();
    await editor.click();
    await page.keyboard.type('Testing Bold');

    // Select all (Ctrl+A / Meta+A)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+a' : 'Control+a');

    // Click Bold button
    const boldBtn = page.locator('button[title*="Bold"]').first();
    await boldBtn.scrollIntoViewIfNeeded();
    await boldBtn.click();

    // Wait for state change
    await page.waitForTimeout(500);

    // Verify HTML contains bold marks
    const html = await editor.innerHTML();
    expect(html).toMatch(/<strong|<b>|font-weight: 700/);
  });
});

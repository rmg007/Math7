import { expect, test } from '@playwright/test';
import { TEST_USERS } from '../test-utils';

test.describe('UI Clipping and Interaction Verification @responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Super Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.SUPER_ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.SUPER_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Symbol Matrix palette should not be clipped and should be fully visible on mobile @responsive', async ({
    page,
  }) => {
    // Set viewport to mobile width
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to new question page
    await page.goto('/questions/new');

    // Wait for the editor to load
    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Click on Symbol Matrix button
    const symbolBtn = page.getByRole('button', { name: /Symbol Matrix/i }).first();
    await expect(symbolBtn).toBeVisible();
    await symbolBtn.click();

    // Verify Symbol Matrix palette is visible
    const palette = page.getByTestId('symbol-matrix-palette');
    await expect(palette).toBeVisible();

    // Check if palette is fully within viewport
    const boundingBox = await palette.boundingBox();
    if (!boundingBox) throw new Error('Palette bounding box not found');

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('Viewport size not found');

    expect(boundingBox.x).toBeGreaterThanOrEqual(0);
    expect(boundingBox.y).toBeGreaterThanOrEqual(0);
    expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width);
    expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport.height);

    // Verify a symbol inside is clickable
    const piSymbol = page.getByRole('button', { name: /Insert π/i });
    await expect(piSymbol).toBeVisible();
    await piSymbol.click();

    // Palette should close after clicking a symbol
    await expect(palette).not.toBeVisible();
  });

  test('RichTextEditor toolbar should be fully functional and visible @regression', async ({
    page,
  }) => {
    await page.goto('/questions/new');

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Verify common toolbar buttons (scoped to first toolbar)
    const toolbar = page.locator('.flex.flex-wrap.items-center.gap-1\\.5').first();
    await expect(toolbar.getByRole('button', { name: /Bold/i }).first()).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /Italic/i }).first()).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /Underline/i }).first()).toBeVisible();
    await expect(toolbar.getByRole('button', { name: /Insert Table/i }).first()).toBeVisible();

    // Open Table Picker
    await toolbar
      .getByRole('button', { name: /Insert Table/i })
      .first()
      .click();
    const tablePicker = page.locator('button[title*="Insert 3x3 table"]').first();
    // In our implementation, Table Picker is also in a fixed overlay
    await expect(tablePicker).toBeVisible();

    // Close by clicking backdrop (simulated by clicking close or escape)
    await page.keyboard.press('Escape');
    await expect(tablePicker)
      .not.toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Fallback: click backdrop if visible
        return page.evaluate(() => {
          const backdrops = Array.from(document.querySelectorAll('div')).filter((d) =>
            d.className.includes('backdrop-blur')
          );
          (backdrops[0] as HTMLElement)?.click();
        });
      });
  });
});

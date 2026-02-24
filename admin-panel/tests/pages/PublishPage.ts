/**
 * PublishPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class PublishPage {
  readonly page: Page;

  readonly pushButton: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;
  readonly errorAlert: Locator;
  readonly pendingCount: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pushButton = page.getByRole('button', { name: /push .* entities to live/i });
    this.confirmButton = page.getByRole('button', { name: /deploy to production/i });
    this.successMessage = page.getByText(/deployment succeeded/i);
    this.errorAlert = page
      .locator('[data-testid="publish-error"]')
      .or(page.locator('[role="alert"]').first());
    this.pendingCount = page.locator('[data-testid="pending-count"]');
  }

  async goto() {
    await this.page.goto('/publish');
    // Wait for the page to settle — either the push button or the "No Changes" badge
    await this.page.locator('button:has-text("Push"), [data-testid="publish-page"] :text-is("No Changes Detected")').first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async publish() {
    await this.pushButton.click();
    await this.confirmButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.confirmButton.click();
  }

  async publishAndWaitForSuccess() {
    await this.publish();
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 45_000 });
    } catch (e) {
      const errorVisible = await this.errorAlert.isVisible();
      if (errorVisible) {
        const msg = await this.errorAlert.innerText();
        throw new Error(`Publish failed with error: ${msg}`);
      }
      throw e;
    }
  }
}

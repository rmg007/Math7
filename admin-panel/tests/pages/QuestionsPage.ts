/**
 * QuestionsPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class QuestionsPage {
  readonly page: Page;

  readonly listContainer: Locator;
  readonly searchInput: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.listContainer = page
      .locator('[data-testid="questions-list"]')
      .or(page.locator('table, [role="table"]').first());
    this.searchInput = page
      .getByPlaceholder(/search questions/i)
      .or(page.locator('input[placeholder*="Search"]'));
    this.errorAlert = page
      .locator('[data-testid="form-error"]')
      .or(page.locator('[role="alert"]').first());
  }

  async goto() {
    await this.page.goto('/questions');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000); // Wait for debounce
  }
}

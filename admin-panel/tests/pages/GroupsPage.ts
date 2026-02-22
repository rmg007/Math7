/**
 * GroupsPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class GroupsPage {
  readonly page: Page;

  readonly listContainer: Locator;
  readonly createButton: Locator;
  readonly groupNameInput: Locator;
  readonly groupTypeSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.listContainer = page
      .locator('[data-testid="groups-list"]')
      .or(page.locator('table, [role="table"]').first());
    this.createButton = page
      .locator('[data-testid="create-group-btn"]')
      .or(page.getByRole('button', { name: /new group/i }));
    this.groupNameInput = page.getByLabel(/name/i);
    this.groupTypeSelect = page.getByRole('combobox').filter({ hasText: /type|class|family/i });
    this.submitButton = page.getByRole('button', { name: /create group/i });
  }

  async goto() {
    await this.page.goto('/groups');
  }

  async gotoNew() {
    await this.page.goto('/groups/new');
  }

  async createGroup(opts: { name: string; type?: 'class' | 'family' }) {
    await this.gotoNew();
    await this.groupNameInput.fill(opts.name);
    if (opts.type) {
      await this.groupTypeSelect.click();
      await this.page.getByRole('option', { name: new RegExp(opts.type, 'i') }).click();
    }
    await this.submitButton.click();
  }
}

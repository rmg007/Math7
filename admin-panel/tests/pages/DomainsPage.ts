/**
 * DomainsPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class DomainsPage {
  readonly page: Page;

  readonly createButton: Locator;
  readonly listContainer: Locator;

  // Create/Edit form
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly descriptionInput: Locator;
  readonly appSelectCombobox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.createButton = page
      .locator('[data-testid="create-domain-btn"]')
      .or(
        page
          .getByRole('link', { name: /new domain/i })
          .or(page.getByRole('button', { name: /new domain/i }))
      );
    this.listContainer = page
      .locator('[data-testid="domains-list"]')
      .or(page.locator('table, [role="table"]').first());

    this.titleInput = page.getByLabel(/title/i);
    this.slugInput = page.getByLabel(/slug/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.appSelectCombobox = page
      .getByRole('combobox')
      .filter({ hasText: /select.*app|related app/i })
      .or(page.getByRole('combobox').first());
    this.submitButton = page.getByRole('button', { name: /create domain/i });
    this.errorAlert = page
      .locator('[data-testid="form-error"]')
      .or(page.locator('[role="alert"]').first());
  }

  async goto() {
    await this.page.goto('/domains');
    await this.listContainer.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoNew() {
    await this.page.goto('/domains/new');
    await this.titleInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectApp() {
    await this.appSelectCombobox.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5_000 });
    await this.page.getByRole('option').first().click();
  }

  async fillForm({
    title,
    slug,
    description,
  }: {
    title: string;
    slug: string;
    description?: string;
  }) {
    await this.selectApp();
    await this.titleInput.fill(title);
    await this.slugInput.fill(slug);
    if (description) await this.descriptionInput.fill(description);
  }

  async selectStatus(status: 'draft' | 'live') {
    const trigger = this.page.locator('[data-testid="status-select"]');
    await trigger.waitFor({ state: 'visible' });
    await trigger.click({ delay: 100 });
    const option = this.page.locator(`[role="option"] >> text=/^${status}$/i`).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
  }

  async submit() {
    await this.submitButton.click();
  }

  async createDomain(opts: {
    title: string;
    slug: string;
    description?: string;
    status?: 'draft' | 'live';
  }) {
    await this.gotoNew();
    await this.fillForm(opts);
    if (opts.status) {
      await this.selectStatus(opts.status);
    }
    await this.submit();
  }

  async domainVisible(title: string) {
    return this.page.getByText(title).first();
  }
}

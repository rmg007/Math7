/**
 * SkillsPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class SkillsPage {
  readonly page: Page;

  readonly listContainer: Locator;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly descriptionInput: Locator;
  readonly domainSelectCombobox: Locator;
  readonly submitButton: Locator;
  readonly searchInput: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.listContainer = page
      .locator('[data-testid="skills-list"]')
      .or(page.locator('table, [role="table"]').first());
    this.titleInput = page.getByLabel(/title/i);
    this.slugInput = page.getByLabel(/slug/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.domainSelectCombobox = page.getByRole('combobox').filter({ hasText: /select a domain/i });
    this.submitButton = page.getByRole('button', { name: /create skill/i });
    this.searchInput = page
      .getByPlaceholder(/search skills/i)
      .or(page.locator('input[placeholder*="Search"]'));
    this.errorAlert = page
      .locator('[data-testid="form-error"]')
      .or(page.locator('[role="alert"]').first());
  }

  async goto() {
    await this.page.goto('/skills');
  }

  async gotoNew() {
    await this.page.goto('/skills/new');
    await this.titleInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectDomain(domainName: RegExp | string) {
    await this.domainSelectCombobox.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5_000 });
    await this.page.getByRole('option', { name: domainName }).click();
  }

  async fillForm({
    title,
    slug,
    description,
    domainName,
  }: {
    title: string;
    slug: string;
    description?: string;
    domainName: RegExp | string;
  }) {
    await this.selectDomain(domainName);
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

  async createSkill(opts: {
    title: string;
    slug: string;
    description?: string;
    domainName: RegExp | string;
    status?: 'draft' | 'live';
  }) {
    await this.gotoNew();
    await this.fillForm(opts);
    if (opts.status) {
      await this.selectStatus(opts.status);
    }
    await this.submit();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000); // Wait for debounce
  }
}

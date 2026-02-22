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

  async submit() {
    await this.submitButton.click();
  }

  async createSkill(opts: {
    title: string;
    slug: string;
    description?: string;
    domainName: RegExp | string;
  }) {
    await this.gotoNew();
    await this.fillForm(opts);
    await this.submit();
  }
}

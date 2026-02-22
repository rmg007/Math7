/**
 * QuestionsPage POM (Page Object Model)
 */
import { Locator, Page } from '@playwright/test';

export class QuestionsPage {
  readonly page: Page;

  readonly listContainer: Locator;
  readonly richTextEditor: Locator;
  readonly skillSelectCombobox: Locator;
  readonly optionInputs: Locator;
  readonly correctAnswerRadios: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.listContainer = page
      .locator('[data-testid="questions-list"]')
      .or(page.locator('table, [role="table"]').first());
    this.richTextEditor = page.locator('.ProseMirror').first();
    this.skillSelectCombobox = page.getByRole('combobox').filter({ hasText: /link to ontology/i });
    this.optionInputs = page.locator('input[placeholder*="Option"]');
    this.correctAnswerRadios = page.getByRole('radio');
    this.submitButton = page.getByRole('button', { name: /deploy question/i });
    this.errorAlert = page
      .locator('[data-testid="form-error"]')
      .or(page.locator('[role="alert"]').first());
  }

  async goto() {
    await this.page.goto('/questions');
  }

  async gotoNew() {
    await this.page.goto('/questions/new');
    await this.richTextEditor.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectSkill(skillName: RegExp | string) {
    await this.skillSelectCombobox.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 10_000 });
    await this.page.getByRole('option', { name: skillName }).click();
  }

  async typeQuestionText(text: string) {
    await this.richTextEditor.click();
    await this.page.keyboard.type(text);
  }

  async fillOptions(options: string[]) {
    await this.optionInputs.first().waitFor({ state: 'visible', timeout: 10_000 });
    const count = await this.optionInputs.count();
    for (let i = 0; i < Math.min(options.length, count); i++) {
      await this.optionInputs.nth(i).fill(options[i]);
    }
  }

  async selectCorrectAnswer(index = 0) {
    await this.correctAnswerRadios.nth(index).click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async createMCQ(opts: {
    questionText: string;
    skillName: RegExp | string;
    options: string[];
    correctIndex?: number;
  }) {
    await this.gotoNew();
    await this.selectSkill(opts.skillName);
    await this.typeQuestionText(opts.questionText);
    await this.fillOptions(opts.options);
    await this.selectCorrectAnswer(opts.correctIndex ?? 0);
    await this.submit();
  }
}

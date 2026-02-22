/**
 * QuestionFormPage POM (Page Object Model)
 *
 * Abstracts all DOM interactions for the /questions/new route.
 * Uses data-testid anchors added in the Step 13 test-ID sweep.
 *
 * Supported question types: mcq | multi_mcq | boolean | text_input
 */
import { Locator, Page } from '@playwright/test';

export class QuestionFormPage {
  readonly page: Page;

  // --- Core form elements ---
  readonly form: Locator;
  readonly contentEditor: Locator; // ProseMirror RTE
  readonly typeSelect: Locator;
  readonly skillSelect: Locator;
  readonly submitButton: Locator;
  readonly abortButton: Locator;
  readonly aiPromptTextarea: Locator;

  // --- MCQ-specific ---
  readonly appendOptionButton: Locator;

  // --- boolean-specific ---
  readonly booleanSwitch: Locator;

  // --- text_input-specific ---
  readonly textInputAnswer: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator('[data-testid="question-form"]');
    this.contentEditor = page.locator('.ProseMirror').first();
    this.typeSelect = page.locator('[data-testid="question-type-select"]');
    this.skillSelect = page.locator('[data-testid="question-skill-select"]');
    this.submitButton = page.locator('[data-testid="question-submit-btn"]');
    this.abortButton = page.getByRole('button', { name: /abort execution/i });
    this.aiPromptTextarea = page.locator('[data-testid="question-form-ai-prompt"]');
    this.appendOptionButton = page.locator('[data-testid="question-form-append-option"]');
    this.booleanSwitch = page.locator('[data-testid="question-boolean-switch"]');
    this.textInputAnswer = page.locator('[data-testid="question-text-input-answer"]');
  }

  async gotoNew() {
    await this.page.goto('/questions/new');
    await this.form.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Type text into the ProseMirror question content editor */
  async typeContent(text: string) {
    await this.contentEditor.click();
    await this.page.keyboard.type(text);
  }

  /** Open the question-type dropdown and pick a type */
  async selectType(type: 'mcq' | 'multi_mcq' | 'boolean' | 'text_input' | 'reorder_steps') {
    await this.typeSelect.click();
    // The SelectContent appears as a portal with role="option"
    await this.page.waitForSelector('[role="option"]', { timeout: 10_000 });
    await this.page.locator(`[data-testid="question-form-type-select-item-${type}"]`).click();
  }

  /** Open the skill dropdown and pick by visible text */
  async selectSkill(skillName: string | RegExp) {
    await this.skillSelect.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 10_000 });
    await this.page.getByRole('option', { name: skillName }).click();
  }

  /** Fill the Nth MCQ option input (0-indexed) */
  async fillMCQOption(index: number, text: string) {
    await this.page.locator(`[data-testid="question-mcq-option-${index}"]`).fill(text);
  }

  /** Fill the Nth multi-MCQ option input (0-indexed) */
  async fillMultiOption(index: number, text: string) {
    await this.page.locator(`[data-testid="question-multi-option-${index}"]`).fill(text);
  }

  /** Pick the correct answer radio for MCQ (0-indexed) */
  async selectCorrectAnswer(index: number) {
    await this.page.getByRole('radio').nth(index).click();
  }

  /** Toggle a checkbox-correct-answer for multi-MCQ (0-indexed) */
  async toggleMultiCorrectAnswer(index: number) {
    await this.page.getByRole('checkbox').nth(index).click();
  }

  /** Toggle the boolean truth-value switch */
  async toggleBooleanAnswer() {
    await this.booleanSwitch.click();
  }

  /** Fill the text_input exact answer */
  async fillTextInputAnswer(answer: string) {
    await this.textInputAnswer.fill(answer);
  }

  async submit() {
    await this.submitButton.click();
  }

  /** Full flow: create a text_input (subjective) question */
  async createSubjective(opts: {
    questionText: string;
    skillName: string | RegExp;
    answer: string;
  }) {
    await this.gotoNew();
    await this.selectType('text_input');
    await this.selectSkill(opts.skillName);
    await this.typeContent(opts.questionText);
    await this.fillTextInputAnswer(opts.answer);
    await this.submit();
  }

  /** Full flow: create a boolean question */
  async createBoolean(opts: { questionText: string; skillName: string | RegExp; isTrue: boolean }) {
    await this.gotoNew();
    await this.selectType('boolean');
    await this.selectSkill(opts.skillName);
    await this.typeContent(opts.questionText);
    // Switch starts at false; click if we need true
    if (opts.isTrue) {
      await this.toggleBooleanAnswer();
    }
    await this.submit();
  }
}

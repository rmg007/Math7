/**
 * QuestionFormPage POM (Page Object Model)
 *
 * Abstracts all DOM interactions for the /questions/new route.
 * Uses data-testid anchors added in the Step 13 test-ID sweep.
 *
 * Supported question types: multiple_choice | mcq_multi | boolean | text_input
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
  readonly symbolMatrixButton: Locator;
  readonly symbolPalette: Locator;

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
    this.symbolMatrixButton = page.locator('div:has-text("Assessment Matrix")').locator('button[title*="Insert Math"]').first();
    this.symbolPalette = page.getByTestId('symbol-matrix-palette').first();
    this.booleanSwitch = page.locator('[data-testid="question-boolean-switch"]');
    this.textInputAnswer = page.locator('[data-testid="question-text-input-answer"]');
  }

  async gotoNew() {
    await this.page.goto('/questions/new');
    await this.form.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Type text into the ProseMirror question content editor */
  async typeContent(text: string) {
    await this.contentEditor.waitFor({ state: 'visible' });
    await this.contentEditor.focus();
    await this.contentEditor.click({ delay: 100 });
    await this.page.keyboard.type(text, { delay: 10 });
  }

  /** Open the Symbol Matrix (LaTeX/Math editor) popup */
  async openSymbolMatrix() {
    await this.symbolMatrixButton.waitFor({ state: 'visible' });
    if (!await this.symbolPalette.isVisible()) {
      await this.symbolMatrixButton.click({ force: true });
      await this.symbolPalette.waitFor({ state: 'visible' });
      await this.symbolPalette.page().waitForTimeout(300);
    }
  }

  /** Open the question-type dropdown and pick a type */
  async selectType(
    type: 'multiple_choice' | 'mcq_multi' | 'boolean' | 'text_input' | 'reorder_steps'
  ) {
    await this.typeSelect.waitFor({ state: 'visible' });
    await this.typeSelect.click({ force: true });
    
    try {
      await this.page.locator(`[data-testid="question-form-type-select-item-${type}"]`).waitFor({ state: 'visible', timeout: 5_000 });
    } catch (e) {
      console.warn(`Type dropdown did not open for ${type}, retrying...`);
      await this.typeSelect.click({ force: true });
    }

    const item = this.page.locator(`[data-testid="question-form-type-select-item-${type}"]`);
    await item.waitFor({ state: 'visible', timeout: 10_000 });
    await item.click({ force: true });
  }

  /** Select status (Draft/Live) */
  async selectStatus(status: 'draft' | 'live') {
    const trigger = this.page.locator('[data-testid="status-select"]');
    await trigger.waitFor({ state: 'visible' });
    await trigger.click({ force: true });

    try {
      await this.page.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: 5_000 });
    } catch (e) {
      console.warn(`Status dropdown did not open for ${status}, retrying...`);
      await trigger.click({ force: true });
    }

    // Exact mapping for status options
    const option = this.page.locator('[role="option"]').filter({ hasText: new RegExp(`^${status}$`, 'i') }).first();
    await option.waitFor({ state: 'visible', timeout: 10_000 });
    await option.click({ force: true });
  }

  /** Open the skill dropdown and pick by visible text */
  async selectSkill(skillName: string | RegExp) {
    await this.skillSelect.waitFor({ state: 'visible' });
    await this.skillSelect.scrollIntoViewIfNeeded();
    
    // Try to click the trigger
    await this.skillSelect.click({ force: true });
    
    try {
      // Wait for ANY option to appear - confirm dropdown is open
      await this.page.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: 8_000 });
    } catch (e) {
      console.warn('Dropdown options did not appear on first click, retrying...');
      await this.skillSelect.click({ force: true });
      await this.page.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: 8_000 });
    }

    const option = this.page.getByRole('option', { name: skillName }).first();
    const isVisible = await option.isVisible();
    if (!isVisible) {
       // Log all available options for debugging
       const options = await this.page.locator('[role="option"]').allTextContents();
       console.log('Available skills in dropdown:', options);
    }
    
    await option.waitFor({ state: 'visible', timeout: 10_000 });
    await option.click({ force: true });
  }

  /** Fill the Nth MCQ option input (0-indexed) */
  async fillMCQOption(index: number, text: string) {
    const locator = this.page.locator(`[data-testid="question-mcq-option-${index}"]`);
    // If option doesn't exist, we might need to click "Append Option"
    const exists = await locator.isVisible().catch(() => false);
    if (!exists && index >= 2) {
      // Assuming minimum 2 options. For index 2+, we might need to append.
      // We click append until it appears or we hit a limit.
      let currentIdx =
        (await this.page.locator('[data-testid^="question-mcq-option-"]').count()) - 1;
      while (currentIdx < index) {
        await this.appendOptionButton.click();
        currentIdx++;
        await this.page
          .locator(`[data-testid="question-mcq-option-${currentIdx}"]`)
          .waitFor({ state: 'visible' });
      }
    }
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.fill(text);
  }

  /** Fill the Nth multi-MCQ option input (0-indexed) */
  async fillMultiOption(index: number, text: string) {
    const locator = this.page.locator(`[data-testid="question-multi-option-${index}"]`);
    const exists = await locator.isVisible().catch(() => false);
    if (!exists && index >= 2) {
      let currentIdx =
        (await this.page.locator('[data-testid^="question-multi-option-"]').count()) - 1;
      while (currentIdx < index) {
        await this.page.locator('[data-testid="question-form-append-option-multi"]').click();
        currentIdx++;
        await this.page
          .locator(`[data-testid="question-multi-option-${currentIdx}"]`)
          .waitFor({ state: 'visible' });
      }
    }
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
    await locator.fill(text);
  }

  /** Pick the correct answer radio for MCQ (0-indexed) */
  async selectCorrectAnswer(index: number) {
    const radio = this.page.getByRole('radio').nth(index);
    await radio.waitFor({ state: 'visible' });
    await radio.click();
  }

  /** Toggle a checkbox-correct-answer for multi-MCQ (0-indexed) */
  async toggleMultiCorrectAnswer(index: number) {
    const check = this.page.getByRole('checkbox').nth(index);
    await check.waitFor({ state: 'visible' });
    await check.click();
  }

  /** Toggle the boolean truth-value switch */
  async toggleBooleanAnswer() {
    await this.booleanSwitch.waitFor({ state: 'visible' });
    await this.booleanSwitch.click();
  }

  /** Fill the text_input exact answer */
  async fillTextInputAnswer(answer: string) {
    await this.textInputAnswer.waitFor({ state: 'visible' });
    await this.textInputAnswer.fill(answer);
  }

  /** Composites: Full create flows */

  async createMCQ(opts: {
    questionText: string;
    skillName: string | RegExp;
    options: string[];
    correctIndex?: number;
    status?: 'draft' | 'live';
  }) {
    await this.gotoNew();
    await this.selectSkill(opts.skillName);
    await this.typeContent(opts.questionText);
    for (let i = 0; i < opts.options.length; i++) {
      await this.fillMCQOption(i, opts.options[i]);
    }
    if (opts.correctIndex !== undefined) {
      await this.selectCorrectAnswer(opts.correctIndex);
    }
    if (opts.status) {
      await this.selectStatus(opts.status);
    }
    await this.submit();
  }

  async createSubjective(opts: {
    questionText: string;
    skillName: string | RegExp;
    answer: string;
    status?: 'draft' | 'live';
  }) {
    await this.gotoNew();
    await this.selectType('text_input');
    await this.selectSkill(opts.skillName);
    await this.typeContent(opts.questionText);
    await this.fillTextInputAnswer(opts.answer);
    if (opts.status) {
      await this.selectStatus(opts.status);
    }
    await this.submit();
  }

  async createBoolean(opts: {
    questionText: string;
    skillName: string | RegExp;
    correctIsTrue: boolean;
    status?: 'draft' | 'live';
  }) {
    await this.gotoNew();
    await this.selectType('boolean');
    await this.selectSkill(opts.skillName);
    await this.typeContent(opts.questionText);
    if (opts.correctIsTrue) {
      await this.toggleBooleanAnswer();
    } else {
      // Stability: toggle on then off to ensure "false" state is registered vs null
      await this.toggleBooleanAnswer();
      await this.toggleBooleanAnswer();
    }
    if (opts.status) {
      await this.selectStatus(opts.status);
    }
    await this.submit();
  }

  async submit() {
    await this.submitButton.waitFor({ state: 'visible' });
    // Small stability wait for React state reconciliation
    await this.page.waitForTimeout(500);
    await this.submitButton.click();
  }
}

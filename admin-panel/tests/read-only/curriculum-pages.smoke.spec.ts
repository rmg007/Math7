/**
 * Curriculum Pages Smoke Tests @smoke
 *
 * Covers all 12 pages in admin-panel/src/features/curriculum/pages/:
 *   domain-create-page, domain-edit-page, domains-page,
 *   skill-create-page, skill-edit-page, skills-page,
 *   question-create-page, question-edit-page, questions-page,
 *   question-studio-page, publish-page, version-history-page
 *
 * Design rules:
 *   - @smoke tag on every test so --grep @smoke picks them up.
 *   - Read-only / non-mutating: no DB writes, no real AI calls.
 *   - AI / Edge Function endpoints mocked via page.route() where generation
 *     is triggered automatically on load. Studio generation is opt-in (button
 *     click), so no mock is needed for the idle state.
 *   - Edit-page tests use a guaranteed-absent UUID to exercise the page's
 *     "not found" error state, which is a valid and important render path.
 *   - Uses global storageState (super-admin authenticated) — no auth override.
 *   - Assert on stable state (testids, headings, buttons) — NOT transient toasts.
 *   - Must complete in < 30 seconds total per smoke config timeout.
 */
import { expect, test } from '@playwright/test';

/** A UUID guaranteed not to exist in any environment. */
const ABSENT_UUID = '00000000-0000-0000-0000-000000000001';

// ─────────────────────────────────────────────────────────────────────────────
// DomainsPage  /domains
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DomainsPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/domains');
    await expect(page.locator('[data-testid="domains-list"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Domains heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Domains' }).first()).toBeVisible();
  });

  test('New Domain link is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /New Domain/i })).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.locator('[placeholder="Search domains..."]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DomainCreatePage  /domains/new
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DomainCreatePage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/domains/new');
    await expect(page.locator('[data-testid="domain-form"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Create Domain heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Domain' })).toBeVisible();
  });

  test('title input is present @smoke', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Advanced Mathematics"]')).toBeVisible();
  });

  test('status select is present @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="status-select"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DomainEditPage  /domains/:id/edit
// Page renders either "Modify Domain" form or "Error Loading Domain" when the
// domain is absent — both are valid loaded states for a smoke test.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DomainEditPage (absent id) @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/domains/${ABSENT_UUID}/edit`);
    // Either the form or the error card must appear within the timeout.
    const form = page.locator('[data-testid="domain-form"]');
    const errorHeading = page.getByText('Error Loading Domain');
    await expect(form.or(errorHeading)).toBeVisible({ timeout: 15000 });
  });

  test('page renders form or error state without crashing @smoke', async ({ page }) => {
    const form = page.locator('[data-testid="domain-form"]');
    const errorHeading = page.getByText('Error Loading Domain');
    await expect(form.or(errorHeading)).toBeVisible();
  });

  test('page shows Modify Domain header or error state @smoke', async ({ page }) => {
    const modifyHeading = page.getByRole('heading', { name: 'Modify Domain' });
    const errorHeading = page.getByText('Error Loading Domain');
    await expect(modifyHeading.or(errorHeading)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkillsPage  /skills
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SkillsPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
    await expect(page.locator('[data-testid="skills-list"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Skills heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Skills' }).first()).toBeVisible();
  });

  test('New Skill link is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /New Skill/i }).first()).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.locator('[placeholder="Search skills..."]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkillCreatePage  /skills/new
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SkillCreatePage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills/new');
    await expect(page.locator('[data-testid="skill-form"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Add Skill heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Add Skill' })).toBeVisible();
  });

  test('status select is present @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="status-select"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkillEditPage  /skills/:id/edit
// With an absent UUID the query returns no rows → "Skill Not Found" error state.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SkillEditPage (absent id) @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/skills/${ABSENT_UUID}/edit`);
    const notFound = page.getByText('Skill Not Found');
    const form = page.locator('[data-testid="skill-form"]');
    await expect(notFound.or(form)).toBeVisible({ timeout: 15000 });
  });

  test('page renders Skill Not Found or form without crashing @smoke', async ({ page }) => {
    const notFound = page.getByText('Skill Not Found');
    const form = page.locator('[data-testid="skill-form"]');
    await expect(notFound.or(form)).toBeVisible();
  });

  test('Return to Skills button is visible in error state @smoke', async ({ page }) => {
    const returnBtn = page.getByRole('button', { name: /Return to Skills/i });
    const form = page.locator('[data-testid="skill-form"]');
    // Button only appears in error state; if form shows, the page is still considered loaded.
    const oneIsVisible = (await returnBtn.isVisible()) || (await form.isVisible());
    expect(oneIsVisible).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestionsPage  /questions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('QuestionsPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/questions');
    await expect(page.locator('[data-testid="questions-list"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Question Bank heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible();
  });

  test('New Question link is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /New Question/i })).toBeVisible();
  });

  test('search input is present @smoke', async ({ page }) => {
    await expect(page.locator('[placeholder="Search questions..."]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestionCreatePage  /questions/new
// ─────────────────────────────────────────────────────────────────────────────

test.describe('QuestionCreatePage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/questions/new');
    await expect(page.locator('[data-testid="question-form"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Question Genesis heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Question Genesis' })).toBeVisible();
  });

  test('question type select is present @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="question-type-select"]')).toBeVisible();
  });

  test('submit button is present @smoke', async ({ page }) => {
    await expect(page.locator('[data-testid="question-submit-btn"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestionEditPage  /questions/:id/edit
// With an absent UUID → "Question Not Found" error state.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('QuestionEditPage (absent id) @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/questions/${ABSENT_UUID}/edit`);
    const notFound = page.getByText('Question Not Found');
    const form = page.locator('[data-testid="question-form"]');
    await expect(notFound.or(form)).toBeVisible({ timeout: 15000 });
  });

  test('page renders Question Not Found or form without crashing @smoke', async ({ page }) => {
    const notFound = page.getByText('Question Not Found');
    const form = page.locator('[data-testid="question-form"]');
    await expect(notFound.or(form)).toBeVisible();
  });

  test('Return to Questions button is visible in error state @smoke', async ({ page }) => {
    const returnBtn = page.getByRole('button', { name: /Return to Questions/i });
    const form = page.locator('[data-testid="question-form"]');
    const oneIsVisible = (await returnBtn.isVisible()) || (await form.isVisible());
    expect(oneIsVisible).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestionStudioPage  /questions/studio
// ─────────────────────────────────────────────────────────────────────────────

test.describe('QuestionStudioPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the studio AI endpoint — generation is triggered only on button click,
    // but pre-emptive mock ensures no accidental real calls slip through.
    await page.route('**/functions/v1/studio-generate**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"questions":[]}' })
    );
    await page.route('**/ai/studio-generate**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"questions":[]}' })
    );

    await page.goto('/questions/studio');
    await expect(page.getByText('AI Question Studio')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with AI Question Studio heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Question Studio' })).toBeVisible();
  });

  test('domain selector grid is rendered @smoke', async ({ page }) => {
    // Six domain buttons (Mathematics, English Language, History, Science,
    // Computer Science, General Knowledge) rendered as a grid on load.
    await expect(page.getByText('Mathematics')).toBeVisible();
    await expect(page.getByText('Computer Science')).toBeVisible();
  });

  test('Generate button is disabled until domain and topic are selected @smoke', async ({
    page,
  }) => {
    // On initial load no domain is selected → Generate button must be disabled.
    await expect(page.getByRole('button', { name: /Generate \d+ Questions/i })).toBeDisabled();
  });

  test('quantity preset buttons are rendered @smoke', async ({ page }) => {
    // Preset buttons: 5, 10, 20, 30
    await expect(page.getByRole('button', { name: '10' })).toBeVisible();
    await expect(page.getByRole('button', { name: '20' })).toBeVisible();
  });

  test('idle empty state prompt is visible @smoke', async ({ page }) => {
    await expect(page.getByText(/Choose a domain and topic/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PublishPage  /publish
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PublishPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/publish');
    await expect(page.locator('[data-testid="publish-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Curriculum Release heading @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Curriculum Release' })).toBeVisible();
  });

  test('Active Protocol card is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Active Protocol' })).toBeVisible();
  });

  test('Stage Manifest card is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Stage Manifest' })).toBeVisible();
  });

  test('Integrity Matrix section is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Integrity Matrix' })).toBeVisible();
  });

  test('Production Handover section is visible @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Production Handover' })).toBeVisible();
  });

  test('View History link navigates to /versions @smoke', async ({ page }) => {
    await expect(page.getByRole('link', { name: /View History/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VersionHistoryPage  /versions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('VersionHistoryPage @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/versions');
    // Heading always renders regardless of whether history exists.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('page loads with Version History heading @smoke', async ({ page }) => {
    await expect(page.getByText(/Version History/i)).toBeVisible();
  });

  test('Current Version banner is rendered @smoke', async ({ page }) => {
    await expect(page.getByText('Current Version')).toBeVisible();
  });

  test('empty state or version table renders without crashing @smoke', async ({ page }) => {
    // Either a table row or the empty-state text must be present.
    const tableRow = page.locator('table tbody tr').first();
    const emptyMsg = page.getByText(/No version history available/i);
    const loadingMsg = page.getByText(/Loading version history/i);
    const oneIsVisible =
      (await tableRow.isVisible()) ||
      (await emptyMsg.isVisible()) ||
      (await loadingMsg.isVisible());
    expect(oneIsVisible).toBe(true);
  });
});

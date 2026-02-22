/**
 * E2E Test Actions Layer
 *
 * High-level, role-aware actions that compose POM page objects.
 * These are the "verbs" of the test suite — what a user DOES, not how the DOM works.
 *
 * Pattern: actions call POM methods + add assertions inline.
 * Tests import actions and don't touch page.locator() directly.
 */
import { Page, expect } from '@playwright/test';
import { DomainsPage } from '../pages/DomainsPage';
import { LoginPage } from '../pages/LoginPage';
import { PublishPage } from '../pages/PublishPage';
import { QuestionsPage } from '../pages/QuestionsPage';
import { SkillsPage } from '../pages/SkillsPage';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Login as a specific test user and wait for redirect to dashboard.
 * This replaces all inline `login()` calls in E2E specs.
 */
export async function loginAs(
  page: Page,
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER' | 'MENTOR'
): Promise<void> {
  const credentials: Record<typeof role, { email: string; password: string }> = {
    SUPER_ADMIN: {
      email: process.env.TEST_SUPER_ADMIN_EMAIL ?? 'super_admin@questerix.com',
      password: process.env.TEST_SUPER_ADMIN_PASSWORD ?? 'super_admin@questerix.com',
    },
    ADMIN: {
      email: process.env.TEST_ADMIN_EMAIL ?? 'admin@questerix.com',
      password: process.env.TEST_ADMIN_PASSWORD ?? 'admin@questerix.com',
    },
    VIEWER: {
      email: process.env.TEST_VIEWER_EMAIL ?? 'viewer@questerix.com',
      password: process.env.TEST_VIEWER_PASS ?? 'viewer@questerix.com',
    },
    MENTOR: {
      email: process.env.TEST_MENTOR_EMAIL ?? 'mentor@questerix.com',
      password: process.env.TEST_MENTOR_PASS ?? 'mentor@questerix.com',
    },
  };

  const { email, password } = credentials[role];
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndWaitForDashboard(email, password);
}

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

/**
 * Creates a Domain and waits for redirect back to the list.
 * @returns The title used — useful for chaining into createSkill.
 */
export async function createDomain(
  page: Page,
  opts: { title: string; slug: string; description?: string; status?: 'draft' | 'live' }
): Promise<string> {
  const domainsPage = new DomainsPage(page);
  await domainsPage.createDomain(opts);
  await expect(page).toHaveURL(/\/domains$/, { timeout: 15_000 });
  await expect(domainsPage.domainVisible(opts.title)).resolves.toBeVisible();
  return opts.title;
}

/**
 * Creates a Skill under a given domain and waits for the list.
 */
export async function createSkill(
  page: Page,
  opts: {
    title: string;
    slug: string;
    description?: string;
    domainName: RegExp | string;
    status?: 'draft' | 'live';
  }
): Promise<string> {
  const skillsPage = new SkillsPage(page);
  await skillsPage.createSkill(opts);
  await expect(page).toHaveURL(/\/skills$/, { timeout: 15_000 });
  await expect(page.getByText(opts.title).first()).toBeVisible();
  return opts.title;
}

/**
 * Creates an MCQ question and waits for the list.
 */
export async function createMCQQuestion(
  page: Page,
  opts: {
    questionText: string;
    skillName: RegExp | string;
    options: string[];
    correctIndex?: number;
    status?: 'draft' | 'live';
  }
): Promise<void> {
  const questionsPage = new QuestionsPage(page);
  await questionsPage.createMCQ(opts);
  await expect(page).toHaveURL(/\/questions$/, { timeout: 15_000 });
  await expect(page.getByText(opts.questionText).first()).toBeVisible();
}

/**
 * Publishes the curriculum and waits for the success confirmation.
 */
export async function publishCurriculum(page: Page): Promise<void> {
  const publishPage = new PublishPage(page);
  await publishPage.goto();
  await publishPage.publishAndWaitForSuccess();
}

// ---------------------------------------------------------------------------
// Full Curriculum Lifecycle (composed action)
// ---------------------------------------------------------------------------

/**
 * End-to-end: creates Domain → Skill → MCQ → publishes.
 * Used by curriculum-lifecycle.e2e.spec.ts and as a setup helper in other specs.
 */
export async function runCurriculumLifecycle(
  page: Page,
  opts: {
    timestamp: number;
    domainSlug: string;
    skillSlug: string;
  }
): Promise<void> {
  const { timestamp, domainSlug, skillSlug } = opts;

  await createDomain(page, {
    title: `E2E Domain ${timestamp}`,
    slug: domainSlug,
    description: 'Created by Playwright E2E',
    status: 'live',
  });

  await createSkill(page, {
    title: `E2E Skill ${timestamp}`,
    slug: skillSlug,
    description: 'Created by Playwright E2E',
    domainName: new RegExp(`E2E Domain ${timestamp}`, 'i'),
    status: 'live',
  });

  await createMCQQuestion(page, {
    questionText: `What is ${timestamp} + 1?`,
    skillName: new RegExp(`E2E Skill ${timestamp}`, 'i'),
    options: [`${timestamp + 1}`, `${timestamp + 2}`, `${timestamp + 3}`, `${timestamp + 4}`],
    correctIndex: 0,
    status: 'live',
  });

  await publishCurriculum(page);
}

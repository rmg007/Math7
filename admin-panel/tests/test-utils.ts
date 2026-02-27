import { Page, expect } from '@playwright/test';

// Convention: password == email (for all test accounts)
export const TEST_USERS = {
  SUPER_ADMIN: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'mhalim80@hotmail.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'mhalim80@hotmail.com',
  },
  ADMIN: {
    email: process.env.TEST_ADMIN_EMAIL || 'testadmin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'testadmin@example.com',
  },
  MENTOR: {
    email: process.env.TEST_MENTOR_EMAIL || 'testmentor@example.com',
    password: process.env.TEST_MENTOR_PASSWORD || 'testmentor@example.com',
  },
  STUDENT: {
    email: process.env.TEST_STUDENT_EMAIL || 'teststudent@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'teststudent@example.com',
  },
};

// Legacy support for scripts that use TEST_CREDENTIALS
export const TEST_CREDENTIALS = TEST_USERS.ADMIN;

// Helper to login
export async function login(
  page: Page,
  email: string = TEST_CREDENTIALS.email,
  password: string = TEST_CREDENTIALS.password
) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');

  // Wait for navigation and dashboard element
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // Wait for sidebar or any common navigation element to ensure auth success
  // We use 'Domains' as it's visible to both super_admin and regular admin roles.
  await expect(page.getByRole('link', { name: /Domains/i }).first()).toBeVisible({
    timeout: 15000,
  });
}
export async function ensureMobileMenuOpen(page: Page) {
  const menuBtn = page.locator('button[aria-label*="menu"], button[class*="md:hidden"]').first();
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    // Wait for the drawer animation to complete
    await page.waitForTimeout(600);
  }
}

// Radix Select helper
export async function selectOption(
  page: Page,
  triggerSelector: string,
  optionTextOrIndex: string | number
) {
  await page.click(triggerSelector);
  if (typeof optionTextOrIndex === 'number') {
    // Select by index (0-based)
    await page.locator('[role="option"]').nth(optionTextOrIndex).click();
  } else {
    // Select by text
    await page.getByRole('option', { name: optionTextOrIndex }).click();
  }
}

export function generateTestUser() {
  const email = `test-${Date.now()}@example.com`;
  return {
    email,
    password: email, // password == email convention
  };
}

export function generateTestDomain() {
  return {
    name: `Test Domain ${Date.now()}`,
    description: `Description for test domain ${Date.now()}`,
  };
}

export function generateTestSkill() {
  return {
    name: `Test Skill ${Date.now()}`,
    description: `Description for test skill ${Date.now()}`,
  };
}

export function generateTestQuestion() {
  return {
    text: `Test Question ${Date.now()}`,
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctAnswer: 'Option 1',
    explanation: 'Test explanation',
  };
}

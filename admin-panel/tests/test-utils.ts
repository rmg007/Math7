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
};

// Legacy support for scripts that use TEST_CREDENTIALS
export const TEST_CREDENTIALS = TEST_USERS.ADMIN;

// Helper to login
export async function login(page: Page, email: string = TEST_CREDENTIALS.email, password: string = TEST_CREDENTIALS.password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation and dashboard element
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  
  // Wait for sidebar or dashboard content to ensure auth success
  // Using a generic locator that appears on dashboard/logged-in pages
  await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
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

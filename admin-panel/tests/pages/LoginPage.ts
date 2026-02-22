/**
 * LoginPage POM (Page Object Model)
 *
 * Encapsulates all selectors and interactions for the Login page.
 * Supports login, register, and forgot-password flows.
 */
import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Login form
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  // Register form
  readonly registerToggle: Locator;
  readonly fullNameInput: Locator;
  readonly inviteCodeInput: Locator;
  readonly createAccountButton: Locator;

  // Forgot password flow
  readonly resetEmailInput: Locator;
  readonly sendResetLinkButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Login form — prefer data-testid, fall back to stable id/role
    this.emailInput = page.locator('[data-testid="login-email"]').or(page.locator('#login-email'));
    this.passwordInput = page
      .locator('[data-testid="login-password"]')
      .or(page.locator('#login-password'));
    this.signInButton = page
      .locator('[data-testid="signin-button"]')
      .or(page.getByRole('button', { name: /sign in/i }));
    this.rememberMeCheckbox = page
      .locator('[data-testid="remember-me"]')
      .or(page.locator('#remember-me'));
    this.forgotPasswordLink = page.getByRole('button', { name: /forgot password/i });
    this.errorMessage = page
      .locator('[data-testid="auth-error"]')
      .or(page.locator('.text-destructive').first());

    // Register
    this.registerToggle = page.getByRole('button', { name: /don't have an account/i });
    this.fullNameInput = page.locator('#fullName');
    this.inviteCodeInput = page.locator('#inviteCode');
    this.createAccountButton = page.getByRole('button', { name: /create account/i });

    // Forgot password
    this.resetEmailInput = page.locator('#reset-email');
    this.sendResetLinkButton = page.getByRole('button', { name: /send reset link/i });
  }

  async goto() {
    await this.page.goto('/login');
    await this.emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/\/$|\/dashboard/, { timeout: 15_000 });
  }
}

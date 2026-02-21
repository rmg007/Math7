import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS, login } from './test-utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';

// Load environment variables if not already present
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.test.local' });
    dotenv.config({ path: '.env.local' });
    dotenv.config({ path: '.env' });
  } catch (e) {
    console.warn('Could not load dotenv, assuming environment is set');
  }
}

test.describe('Auth Flow & Guardrails', () => {
  test('Registration: Invalid invitation code is rejected (Task 1.8)', async ({ page }) => {
    await page.goto('/login');

    // Switch to Register
    const registerParamsLink = page.getByRole('button', {
      name: /Don't have an account\? Register/i,
    });
    await expect(registerParamsLink).toBeVisible();
    await registerParamsLink.click();

    // Fill form
    const email = `test-reject-${Date.now()}@example.com`;
    await page.locator('input[name="fullName"]').fill('Test Reject');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').last().fill('safe-test-password'); // last() because login specific password input might still be in DOM or just careful selection
    await page.locator('input[name="inviteCode"]').fill('INVALID-CODE-123');

    // Submit
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    // Expect Error
    await expect(page.getByText('Invalid or expired invitation code')).toBeVisible({
      timeout: 10000,
    });

    // Ensure we are still on /login (or didn't redirect to dashboard)
    await expect(page).toHaveURL(/\/login/);
  });

  test('AuthGuard: Redirects to /login if profile is deleted (Fail-Safe) (Task 1.9)', async ({
    page,
  }) => {
    // 1. Browser: Login as valid user first (Admin)
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.ADMIN.email);
    await page.fill('input[type="password"]', TEST_USERS.ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 2. API: Authenticate as Super Admin to perform the "soft delete"
    const supabaseControl = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: authError } = await supabaseControl.auth.signInWithPassword({
      email: TEST_USERS.SUPER_ADMIN.email,
      password: TEST_USERS.SUPER_ADMIN.password,
    });

    if (authError) {
      console.warn(
        'Skipping deletion test - Could not auth as Super Admin to perform control actions'
      );
      test.skip();
      return;
    }

    // Get the target user's ID (Admin)
    const { data: profile } = await supabaseControl
      .from('profiles')
      .select('id')
      .eq('email', TEST_USERS.ADMIN.email)
      .single();

    expect(profile).toBeDefined();

    try {
      // 3. API: "Soft Delete" the Admin user
      const { error: updateError } = await supabaseControl
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', profile?.id);

      expect(updateError).toBeNull();

      // 4. Browser: Reload page to trigger AuthGuard check
      await page.reload();

      // 5. Browser: Expect redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    } finally {
      // 6. API: Restore user (CRITICAL cleanup)
      const { error: restoreError } = await supabaseControl
        .from('profiles')
        .update({ deleted_at: null })
        .eq('id', profile?.id);

      if (restoreError) {
        console.error('CRITICAL: Failed to restore admin user!', restoreError);
      }
    }
  });

  // ===========================================================================
  // Route Protection — Unauthenticated Access
  // ===========================================================================

  test('RouteProtection: Unauthenticated user accessing "/" is redirected to /login (AC-04)', async ({
    page,
  }) => {
    // Navigate directly without any session
    await page.goto('/');
    // ProtectedRoute / auth guard must redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('RouteProtection: Unauthenticated user accessing a deep admin route is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/apps');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  // ===========================================================================
  // Login — Error Messages & Anti-Enumeration
  // ===========================================================================

  test('Login: Wrong password shows generic "Invalid login credentials" — no field-level hint (SI-03)', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('#login-email', TEST_USERS.ADMIN.email);
    await page.fill('#login-password', 'DefinitelyWrongPassword999!');
    await page.click('button[type="submit"]');

    // Must show a generic error — not "wrong password" or "email not found"
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10000 });
    // Must NOT reveal which field is wrong
    await expect(page.getByText(/email not found/i)).not.toBeVisible();
    await expect(page.getByText(/wrong password/i)).not.toBeVisible();
    // Must stay on login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login: Client-side validation rejects passwords shorter than 8 chars', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'someuser@example.com');
    await page.fill('#login-password', 'short');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 5000 });
  });

  // ===========================================================================
  // Forgot Password — UI States
  // ===========================================================================

  test('ForgotPassword: Generic success shown after submitting any email (anti-enumeration FP-01/FP-02)', async ({
    page,
  }) => {
    await page.goto('/login');

    // Click "Forgot password?"
    await page.getByRole('button', { name: /forgot password/i }).click();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();

    // Enter a non-existent email — must get the same success state as a real one
    await page.fill('#reset-email', `nonexistent-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Should show generic "check your email" success — not an error revealing the email doesn't exist
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/email not found/i)).not.toBeVisible();
    await expect(page.getByText(/no account/i)).not.toBeVisible();
  });

  test('ForgotPassword: Empty email field triggers validation error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();

    // Click submit with empty field
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/please enter your email/i)).toBeVisible({ timeout: 5000 });
  });

  test('ForgotPassword: "Back to Sign In" returns to login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /forgot password/i }).click();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();

    await page.getByRole('button', { name: /back to sign in/i }).click();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
  });

  // ===========================================================================
  // Login Success — Navigation
  // ===========================================================================

  test('Login: Successful admin login navigates to dashboard (SI-02)', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    // login() helper already asserts we're NOT on /login and Dashboard link is visible
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Login: Already-authenticated user visiting /login is redirected to dashboard', async ({
    page,
  }) => {
    // Login first
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
    // Now navigate back to login — should be redirected away
    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  // ===========================================================================
  // AuthConfirmPage — PKCE error handling (EC-05)
  // ===========================================================================

  test('AuthConfirmPage: Visiting /auth/confirm with a malformed code shows graceful error (EC-05)', async ({
    page,
  }) => {
    // The page will attempt verifyOtp with this bad hash and get a Supabase error
    await page.goto('/auth/confirm?token_hash=INVALID_GARBAGE_CODE&type=recovery');

    // Should show the Set New Password form (page doesn't pre-call verify on mount)
    await expect(page.getByRole('heading', { name: /set new password/i })).toBeVisible({
      timeout: 5000,
    });

    // Fill in valid passwords and click confirm — this triggers the actual verify call
    await page.fill('#new-password', 'NewValidPass1!');
    await page.fill('#confirm-password', 'NewValidPass1!');
    await page.getByRole('button', { name: /set new password/i }).click();

    // Supabase should reject the bad code — error must be shown gracefully, not a crash
    await expect(page.getByText(/something went wrong|invalid|expired|token/i)).toBeVisible({
      timeout: 10000,
    });
    // Must NOT be a blank page or unhandled rejection
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('AuthConfirmPage: Visiting /auth/confirm with Supabase error params shows error state (EC-02)', async ({
    page,
  }) => {
    await page.goto(
      '/auth/confirm#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    );

    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /back to sign in/i })).toBeVisible();
  });

  test('AuthConfirmPage: Visiting /auth/confirm with no token redirects to /login (EC-04)', async ({
    page,
  }) => {
    await page.goto('/auth/confirm');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

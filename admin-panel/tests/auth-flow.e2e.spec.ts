import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './test-utils';

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
});

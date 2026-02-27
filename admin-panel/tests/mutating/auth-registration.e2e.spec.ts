import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
// Using TEST_ prefix as convention for testing environment variables
const supabaseServiceKey =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Registration Integrity & Auth Flow (Task 1.6/1.7) @logic', () => {
  let testInviteCode: string;
  let testUserEmail: string;

  test.beforeAll(async () => {
    if (!supabaseServiceKey) {
      console.warn(
        'SUPABASE_SERVICE_ROLE_KEY not found. Registration test will likely fail or skip.'
      );
      test.skip(!supabaseServiceKey, 'Requires service role key for seeding/cleanup');
      return;
    }

    // Create a service-role client to generate a real invite code
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a random code
    testInviteCode = `REGTEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Insert into DB directly
    const { error } = await supabaseAdmin.from('invitation_codes').insert({
      code: testInviteCode,
      max_uses: 1,
      is_active: true,
    });

    if (error) throw new Error(`Failed to seed test invite code: ${error.message}`);
  });

  test.afterAll(async () => {
    if (!supabaseServiceKey) return;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Cleanup invitation code
    await supabaseAdmin.from('invitation_codes').delete().eq('code', testInviteCode);

    // Cleanup user if email was set
    if (testUserEmail) {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData.users.find((u) => u.email === testUserEmail);
      if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }
  });

  test('Registration: Valid invitation code creates profile and redirects to dashboard', async ({
    page,
  }) => {
    testUserEmail = `reg-test-${Date.now()}@example.com`;
    const fullName = 'End-to-End Registration Test';

    await page.goto('/login');

    // Switch to Register flow
    const registerLink = page.getByRole('button', { name: /Don't have an account\? Register/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    // Fill registration form
    await page.locator('input[name="fullName"]').fill(fullName);
    await page.locator('input[name="email"]').fill(testUserEmail);
    await page.locator('input[name="password"]').last().fill('SecurePass123!');
    await page.locator('input[name="inviteCode"]').fill(testInviteCode);

    // Submit
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    // Expect redirect away from login (to dashboard)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });

    // Confirm presence on Dashboard (common element 'Questerix Admin' or Sidebar links)
    await expect(page.getByText(/Questerix Admin/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Domains/i }).first()).toBeVisible();

    // Verify profile creation in database (Integrity Check)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', testUserEmail)
      .single();

    expect(error).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.full_name).toBe(fullName);
    // Role 'student' is default from trigger, but for this admin-panel flow,
    // we verify the row exists.
  });

  test('Registration: Expired/Used invitation code is rejected (Regression)', async ({ page }) => {
    // 1. First, consume the code (or use an already consumed one)
    // We can't easily reuse the one from the previous test if it runs in parallel,
    // so let's create a new one and manually mark it used.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const usedCode = `USED-${Date.now()}`;
    await supabaseAdmin.from('invitation_codes').insert({
      code: usedCode,
      max_uses: 1,
      times_used: 1, // Already used
      is_active: true,
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Register/i }).click();

    await page.locator('input[name="fullName"]').fill('Fail Test');
    await page.locator('input[name="email"]').fill(`fail-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').last().fill('FailPass123!');
    await page.locator('input[name="inviteCode"]').fill(usedCode);

    await page.getByRole('button', { name: /Create Account/i }).click();

    // Expect failure message
    await expect(page.getByText(/invalid or expired invitation code/i)).toBeVisible();

    // Cleanup
    await supabaseAdmin.from('invitation_codes').delete().eq('code', usedCode);
  });
});

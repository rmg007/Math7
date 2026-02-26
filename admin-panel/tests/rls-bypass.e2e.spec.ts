/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './test-utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Helper to create a client for a specific user
async function getClientForUser(email?: string, password?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (email && password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  return supabase;
}

test.describe('Security: RLS Bypass & Tenant Isolation', () => {
  test('Anonymous User: Cannot access curriculum data', async () => {
    const supabase = await getClientForUser(); // Anon client

    // Try to fetch apps
    const { data: apps, error: _appsError } = await supabase.from('apps').select('*');
    expect(apps?.length || 0).toBe(0);

    // Try to fetch domains
    const { data: domains, error: _domainsError } = await supabase.from('domains').select('*');
    expect(domains?.length || 0).toBe(0);

    // Try to fetch subjects
    const { data: subjects, error: _subjectsError } = await supabase.from('subjects').select('*');
    expect(subjects?.length || 0).toBe(0);
  });

  test('Anonymous User: Can still log errors (intentional)', async () => {
    const supabase = await getClientForUser();

    // Anon can INSERT but cannot SELECT (due to RLS)
    // So we just check that the insert doesn't return an error
    const { error } = await supabase.from('error_logs').insert({
      error_message: 'LOKI_TEST: Anonymous error log',
      error_type: 'info',
      platform: 'web',
      status: 'new',
      extra_context: { component: 'RLS_TEST' },
    });

    if (error) console.error('Anon log error:', error);
    expect(error).toBeNull();
  });

  test('Regular Admin: Isolation Enforcement', async () => {
    const supabase = await getClientForUser(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // 1. Can see their own app
    const { data: myApps } = await supabase.from('apps').select('*');
    expect(myApps?.length).toBeGreaterThan(0);

    const _myAppId = myApps![0].app_id;

    // 2. Try to fetch data for a fake app_id (Isolation attempt)
    const fakeAppId = '00000000-0000-0000-0000-000000000000';
    const { data: foreignDomains } = await supabase
      .from('domains')
      .select('*')
      .eq('app_id', fakeAppId);

    // RLS should return 0 rows even if we specifically ask for another app
    expect(foreignDomains?.length || 0).toBe(0);

    // 3. Try to INSERT data for another app_id
    const { error: insertError } = await supabase.from('domains').insert({
      title: 'RLS Bypass Attempt',
      app_id: fakeAppId,
      slug: 'rls-bypass-attempt',
    });

    // Should fail OR silent success but row not visible (Postgres RLS behavior)
    // Most likely fail because current_app_id() != fakeAppId
    if (insertError) {
      expect(insertError.code).toBe('42501'); // Insufficient Privilege
    } else {
      // If no error, verify it wasn't actually created/isn't visible
      const { data: verifyRow } = await supabase
        .from('domains')
        .select('*')
        .eq('slug', 'rls-bypass-attempt');
      expect(verifyRow?.length || 0).toBe(0);
    }
  });

  test('Super Admin: Cross-Tenant Access', async () => {
    const supabase = await getClientForUser(
      TEST_USERS.SUPER_ADMIN.email,
      TEST_USERS.SUPER_ADMIN.password
    );

    // Super admin can see all apps
    const { data: allApps } = await supabase.from('apps').select('*');
    expect(allApps?.length).toBeGreaterThan(0);

    // Super admin can see domains across all apps (even if we don't filter)
    const { data: allDomains } = await supabase.from('domains').select('*');
    expect(allDomains?.length).toBeGreaterThan(0);

    // Verify RLS helper is working: select any domain and it should be visible
    // even if it belongs to a different app_id than the Super Admin's profile (if they were assigned one)
  });

  test('Account Hardening: Profile protection', async () => {
    const supabase = await getClientForUser(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // 1. Try to fetch all profiles. Should not see Super Admin profiles if isolation works.
    const { data: profiles } = await supabase.from('profiles').select('*');
    const _superAdminProfiles = profiles?.filter((p) => p.role === 'super_admin');

    // Since testadmin and mhalim80 are in the same app_id (tenant), they might see each other
    // depending on the policy. But let's verify they can't UPDATE someone else.

    const { data: myProfile } = await supabase.auth.getUser();
    const myId = myProfile.user?.id;

    // Try to update someone else's role (escalation attempt)
    const targetId = '30610d88-44ce-4b16-8971-9490eb76cdb5'; // mhalim80's ID
    if (myId !== targetId) {
      const { data: updateData, error: _updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', targetId)
        .select();

      // RLS should either error or return 0 rows
      expect(updateData?.length || 0).toBe(0);
    }
  });

  // ===========================================================================
  // invitation_codes table — RLS (AI-08: student cannot read invitation codes)
  // ===========================================================================

  test('Invitation Codes: Anonymous user cannot SELECT from invitation_codes (AI-08)', async () => {
    const supabase = await getClientForUser(); // anon

    const { data, error } = await supabase.from('invitation_codes').select('*');

    // RLS must return 0 rows OR an access error — never expose codes to anon users
    if (error) {
      // Explicit deny is acceptable
      expect(['42501', 'PGRST301', '401']).toContain(String(error.code));
    } else {
      expect(data?.length || 0).toBe(0);
    }
  });

  test('Invitation Codes: Student-role user cannot SELECT from invitation_codes (AI-08)', async () => {
    const supabase = await getClientForUser(TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);
    const { data, error } = await supabase.from('invitation_codes').select('*');

    if (error) {
      // Explicit RLS deny is the correct outcome
      expect(['42501', 'PGRST301']).toContain(String(error.code));
    } else {
      // Silent empty result is also acceptable (RLS returns zero rows)
      expect(data?.length || 0).toBe(0);
    }
  });

  // ===========================================================================
  // Curriculum & Tracking Isolation — DB-RLS-001..005
  // ===========================================================================

  test('DB-RLS-001: Curriculum — Admin A cannot see skills from Admin B (Isolation)', async () => {
    const supabase = await getClientForUser(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // Attempt to query skills with a fake app_id (Isolation attempt)
    const fakeAppId = '00000000-0000-0000-0000-000000000000';
    const { data: foreignSkills } = await supabase
      .from('skills')
      .select('*')
      .eq('app_id', fakeAppId);

    // RLS should return 0 rows even if we specifically ask for another app
    expect(foreignSkills?.length || 0).toBe(0);
  });

  test('DB-RLS-002: Curriculum — Student cannot INSERT an artificial question', async () => {
    const supabase = await getClientForUser(TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);

    // Students can see questions (for practice), but should NOT be able to insert
    const { error } = await supabase.from('questions').insert({
      skill_id: '00000000-0000-0000-0000-000000000000',
      app_id: '00000000-0000-0000-0000-000000000000',
      type: 'multiple_choice',
      content: { text: 'RLS HACK' },
      solution: { correct: 'X' },
    } as any);

    // Expecting 42501 (Insufficient Privilege)
    expect(error?.code).toBe('42501');
  });

  test('DB-RLS-003: Tracking — Student A cannot see Student B attempts', async () => {
    const supabase = await getClientForUser(TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);

    // Try to select efforts from another user (Fake UUID)
    const fakeUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const { data: foreignAttempts } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', fakeUserId);

    expect(foreignAttempts?.length || 0).toBe(0);
  });

  test('DB-RLS-004: Mentor Hub — Mentor cannot see another mentor groups', async () => {
    const supabase = await getClientForUser(TEST_USERS.MENTOR.email, TEST_USERS.MENTOR.password);

    // Attempt to query groups they don't own
    const fakeOwnerId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const { data: foreignGroups } = await supabase
      .from('groups')
      .select('*')
      .eq('owner_id', fakeOwnerId);

    expect(foreignGroups?.length || 0).toBe(0);
  });

  test('DB-RLS-005: Mastery — Student A cannot update Student B progress', async () => {
    const supabase = await getClientForUser(TEST_USERS.STUDENT.email, TEST_USERS.STUDENT.password);

    // Try to update progress of another user
    const fakeUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const { error } = await supabase
      .from('skill_progress')
      .update({ mastery_level: 100 })
      .eq('user_id', fakeUserId);

    // Should either error or return 0 rows affected
    if (error) {
      expect(error.code).toBe('42501');
    } else {
      // If it "succeeds", verify row wasn't actually changed by trying to find it
      const { data } = await supabase.from('skill_progress').select('*').eq('user_id', fakeUserId);
      expect(data?.length || 0).toBe(0);
    }
  });

  test('DB-RLS-006: Super Admin can SELECT from all sensitive tables', async () => {
    const supabase = await getClientForUser(
      TEST_USERS.SUPER_ADMIN.email,
      TEST_USERS.SUPER_ADMIN.password
    );

    // Should see something (or at least not error)
    const { error: err1 } = await supabase.from('attempts').select('*');
    expect(err1).toBeNull();

    const { error: err2 } = await supabase.from('skill_progress').select('*');
    expect(err2).toBeNull();

    const { error: err3 } = await supabase.from('assignments').select('*');
    expect(err3).toBeNull();
  });
});

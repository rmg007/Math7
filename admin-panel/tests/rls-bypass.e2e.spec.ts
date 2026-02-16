import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './test-utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
/* eslint-disable @typescript-eslint/no-non-null-assertion */


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
      extra_context: { component: 'RLS_TEST' }
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
    const { error: insertError } = await supabase
      .from('domains')
      .insert({
        title: 'RLS Bypass Attempt',
        app_id: fakeAppId,
        slug: 'rls-bypass-attempt'
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
    const supabase = await getClientForUser(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    
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
    const _superAdminProfiles = profiles?.filter(p => p.role === 'super_admin');
    
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
});

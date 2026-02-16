import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './test-utils';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

async function getClientForUser(email?: string, password?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (email && password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  return supabase;
}

test.describe('Security Stress: Multi-tenant Isolation Force Check', () => {

  test('Pinpoint Attack: Admin B cannot access Alpha Domain by ID', async () => {
    // Admin B (Beta Tenant)
    const supabaseB = await getClientForUser(TEST_USERS.MENTOR.email, TEST_USERS.MENTOR.password);
    
    const alphaDomainId = '00000000-0000-0000-0000-000000000001';
    const alphaAppId = '7b8c9d0a-1e2f-3a4b-5c6d-7e8f9a0b1c2d';
    
    // 1. ATTEMPT SELECT
    const { data: alphaData } = await supabaseB
      .from('domains')
      .select('*')
      .eq('domain_id', alphaDomainId);
    
    expect(alphaData?.length || 0).toBe(0); // Should be invisible

    // 2. ATTEMPT UPDATE
    const { error: updateError, data: updateData } = await supabaseB
      .from('domains')
      .update({ title: 'HACKED' })
      .eq('domain_id', alphaDomainId)
      .select();
    
    expect(updateData?.length || 0).toBe(0);
    if (!updateError) {
       // Verify no change occurred
       const supabaseA = await getClientForUser(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
       const { data: verifyA } = await supabaseA.from('domains').select('title').eq('domain_id', alphaDomainId).single();
       expect(verifyA?.title).not.toBe('HACKED');
    }

    // 3. ATTEMPT INSERT into Alpha Tenant
    const { error: insertError } = await supabaseB
      .from('domains')
      .insert({
        title: 'MALICIOUS INSERT',
        app_id: alphaAppId,
        slug: 'malicious-slug'
      });
    
    // Likely fails Code 42501 (Insufficient Privilege) because current_app_id() mismatch
    if (insertError) {
      expect(insertError.code).toBe('42501');
    }

    // 4. ATTEMPT DELETE
    const { error: deleteError, data: deleteData } = await supabaseB
      .from('domains')
      .delete()
      .eq('domain_id', alphaDomainId)
      .select();
    
    expect(deleteData?.length || 0).toBe(0);
  });

  test('Profile Jumping: Admin B cannot view metadata of Tenant A users', async () => {
    const supabaseB = await getClientForUser(TEST_USERS.MENTOR.email, TEST_USERS.MENTOR.password);
    
    // Try to fetch testadmin@example.com (Tenant A)
    const { data: profiles } = await supabaseB
      .from('profiles')
      .select('*')
      .eq('email', TEST_USERS.ADMIN.email);
    
    // If isolation is perfect, Admin B sees NOTHING of Tenant A
    expect(profiles?.length || 0).toBe(0);
  });

});

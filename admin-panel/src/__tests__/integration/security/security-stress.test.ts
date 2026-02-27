import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { beforeAll, describe, expect, test } from 'vitest';
import { TEST_USERS } from './test-users';

beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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

describe('Security Stress: Multi-tenant Isolation Force Check (Integration)', () => {
  test('Pinpoint Attack: Admin B cannot access Alpha Domain by ID', async () => {
    // Admin B (Mentorship/Beta Tenant)
    const supabaseB = await getClientForUser(TEST_USERS.MENTOR.email, TEST_USERS.MENTOR.password);

    const alphaDomainId = '00000000-0000-0000-0000-000000000001';
    const alphaAppId = '7b8c9d0a-1e2f-3a4b-5c6d-7e8f9a0b1c2d';

    // 1. ATTEMPT SELECT
    const { data: alphaData } = await supabaseB
      .from('domains')
      .select('*')
      .eq('domain_id', alphaDomainId);

    expect(alphaData?.length || 0).toBe(0);

    // 2. ATTEMPT UPDATE
    const { data: updateData } = await supabaseB
      .from('domains')
      .update({ title: 'HACKED_VITEST' })
      .eq('domain_id', alphaDomainId)
      .select();

    expect(updateData?.length || 0).toBe(0);

    // 3. ATTEMPT INSERT into Alpha Tenant
    const { error: insertError } = await supabaseB.from('domains').insert({
      title: 'MALICIOUS INSERT VITEST',
      app_id: alphaAppId,
      slug: 'malicious-slug-stress-vitest',
    });

    if (insertError) {
      expect(insertError.code).toBe('42501');
    }

    // 4. ATTEMPT DELETE
    const { data: deleteData } = await supabaseB
      .from('domains')
      .delete()
      .eq('domain_id', alphaDomainId)
      .select();

    expect(deleteData?.length || 0).toBe(0);
  });

  test('Profile Jumping: Admin B cannot view metadata of Tenant A users', async () => {
    const supabaseB = await getClientForUser(TEST_USERS.MENTOR.email, TEST_USERS.MENTOR.password);

    const { data: profiles } = await supabaseB
      .from('profiles')
      .select('*')
      .eq('email', TEST_USERS.ADMIN.email);

    expect(profiles?.length || 0).toBe(0);
  });
});

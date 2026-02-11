import { test, expect } from '@playwright/test';

// API Health Checks
// P1 Important: Verifies Supabase REST API, Auth, and Edge Functions are responding
// Tests backend connectivity without requiring authentication

const supabaseUrl = process.env.SUPABASE_URL || 'https://qvslbiceoonrgjxzkotb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

test('API health — Supabase REST, Auth, and Edge Functions', async ({ request }) => {
  // 1. Check Supabase REST API
  const restResponse = await request.get(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });
  expect(restResponse.status()).toBe(200);

  // 2. Check Supabase Auth health
  const authResponse = await request.get(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });
  expect(authResponse.status()).toBe(200);

  // 3. Check table queries work
  const startTime = Date.now();
  const tableResponse = await request.get(`${supabaseUrl}/rest/v1/apps?select=app_id&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });
  const responseTime = Date.now() - startTime;
  expect(tableResponse.status()).toBe(200);
  expect(responseTime).toBeLessThan(3000);

  // 4. Check Edge Functions respond (not 5xx)
  for (const func of ['validate-content', 'generate-questions', 'analyze-spec-drift', 'critical-alert']) {
    const edgeResponse = await request.post(`${supabaseUrl}/functions/v1/${func}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });
    // 400/401 is fine (validation/auth error), 5xx means the function is broken
    expect(edgeResponse.status()).not.toBe(500);
    expect(edgeResponse.status()).not.toBe(502);
    expect(edgeResponse.status()).not.toBe(503);
  }
});

import { test, expect } from '@playwright/test';

// API Health Checks
// P1 Important: Verifies Supabase REST API, Auth, and Edge Functions are responding
// Tests backend connectivity without requiring authentication

test.describe('API Health Checks', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://qvslbiceoonrgjxzkotb.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  test('Supabase REST API should respond', async ({ request }) => {
    const response = await request.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    
    // Should return some kind of response (even if it's an empty object)
    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('Supabase Auth health endpoint should respond', async ({ request }) => {
    const response = await request.get(`${supabaseUrl}/auth/v1/health`);

    expect(response.status()).toBe(200);
  });

  test('Supabase REST API should allow table queries', async ({ request }) => {
    // Try to query the apps table (should be accessible with anon key)
    const response = await request.get(`${supabaseUrl}/rest/v1/apps?select=app_id&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('Edge Function validate-content should respond', async ({ request }) => {
    // Send empty body - should return validation error (400/401) not server error (500)
    const response = await request.post(`${supabaseUrl}/functions/v1/validate-content`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    // Should return 400 (bad request) or 401 (unauthorized), NOT 500 (server error)
    expect([400, 401]).toContain(response.status());
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('Edge Function generate-questions should respond', async ({ request }) => {
    // Send empty body - should return validation error, not server error
    const response = await request.post(`${supabaseUrl}/functions/v1/generate-questions`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    // Should return 400 (bad request) or 401 (unauthorized), NOT 500 (server error)
    expect([400, 401]).toContain(response.status());
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('Edge Function analyze-spec-drift should respond', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/functions/v1/analyze-spec-drift`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect([400, 401]).toContain(response.status());
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('Edge Function critical-alert should respond', async ({ request }) => {
    const response = await request.post(`${supabaseUrl}/functions/v1/critical-alert`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect([400, 401]).toContain(response.status());
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('API response times should be reasonable', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get(`${supabaseUrl}/rest/v1/apps?select=app_id&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // API should respond in under 3 seconds
  });

  test('should handle invalid API endpoints gracefully', async ({ request }) => {
    const response = await request.get(`${supabaseUrl}/rest/v1/nonexistent_table`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    // Should return 404 or 400, not 500
    expect([400, 404]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});

import { defineConfig } from 'checkly';

// Supabase Auth Health Uptime Monitor
// P0 Critical: Basic availability check for authentication service

export default defineConfig({
  name: 'Supabase Auth Health',
  url: (process.env.SUPABASE_URL || 'https://qvslbiceoonrgjxzkotb.supabase.co') + '/auth/v1/health',
  frequency: 2,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['supabase', 'auth', 'uptime', 'p0-critical'],
  assertions: [
    {
      type: 'statusCode',
      target: 200,
    },
    {
      type: 'responseTime',
      target: 3000,
    },
  ],
});

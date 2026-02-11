import { defineConfig } from 'checkly';

// Supabase REST API Uptime Monitor
// P0 Critical: Basic availability check for database API

export default defineConfig({
  name: 'Supabase REST API',
  url: (process.env.SUPABASE_URL || 'https://qvslbiceoonrgjxzkotb.supabase.co') + '/rest/v1/',
  frequency: 2,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['supabase', 'api', 'uptime', 'p0-critical'],
  headers: {
    'apikey': process.env.SUPABASE_ANON_KEY || '',
  },
  assertions: [
    {
      type: 'statusCode',
      target: 200,
    },
    {
      type: 'responseTime',
      target: 3000, // API should be faster
    },
  ],
});

import { defineConfig } from 'checkly';

// Admin Panel HTTP Uptime Monitor
// P0 Critical: Basic availability check for admin panel

export default defineConfig({
  name: 'Admin Panel HTTP',
  url: process.env.ADMIN_URL + '/login' || 'https://questerix-admin.pages.dev/login',
  frequency: 2, // 2 minutes for critical admin surface
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['admin', 'uptime', 'p0-critical'],
  assertions: [
    {
      type: 'statusCode',
      target: 200,
    },
    {
      type: 'responseTime',
      target: 5000, // 5 seconds max
    },
  ],
});

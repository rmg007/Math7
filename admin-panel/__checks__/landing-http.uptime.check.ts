import { defineConfig } from 'checkly';

// Landing Pages HTTP Uptime Monitor
// P0 Critical: Basic availability check for landing pages

export default defineConfig({
  name: 'Landing Pages HTTP',
  url: process.env.LANDING_URL || 'https://questerix-landing.pages.dev/',
  frequency: 2,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['landing', 'uptime', 'p0-critical'],
  assertions: [
    {
      type: 'statusCode',
      target: 200,
    },
    {
      type: 'responseTime',
      target: 5000,
    },
  ],
});

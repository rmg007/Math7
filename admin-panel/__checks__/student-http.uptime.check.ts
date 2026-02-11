import { defineConfig } from 'checkly';

// Student App HTTP Uptime Monitor
// P0 Critical: Basic availability check for student app

export default defineConfig({
  name: 'Student App HTTP',
  url: process.env.STUDENT_URL || 'https://questerix-student.pages.dev/',
  frequency: 2,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['student', 'uptime', 'p0-critical'],
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

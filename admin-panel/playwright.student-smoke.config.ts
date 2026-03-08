import { defineConfig, devices } from '@playwright/test';

/**
 * Optimized config for Student App Smoke Tests.
 * Bypasses global authentication and focus on unauthenticated/student flows.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'https://questerix-student.pages.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'student-web',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 }, // Test in mobile-ish viewport
      },
    },
  ],
});

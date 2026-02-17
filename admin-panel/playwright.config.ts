import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05, // Allow 5% pixel difference for rendering noise
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },
});

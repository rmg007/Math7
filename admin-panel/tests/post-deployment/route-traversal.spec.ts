import { expect, test } from '@playwright/test';

// Use the local super-admin session produced by global-setup to bypass UI login
// When running in post-deployment, global-setup will log in with the prod-bot account to generate this file.
test.use({ storageState: '.auth/super-admin.json' });

const MAJOR_ROUTES = [
  '/dashboard',
  '/domains',
  '/skills',
  '/questions',
  '/publish',
  '/versions',
  '/invitation-codes',
  '/groups',
  '/ai-questions',
  '/ai-sessions',
  '/ai-import',
  '/users',
  '/governance',
  '/subjects',
  '/apps',
  '/landings',
  '/settings',
  '/known-issues',
  '/error-logs',
];

test.describe('Post-Deployment Route Traversal Check', () => {
  let errors: string[] = [];
  let unhandled500s: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    unhandled500s = [];

    // Listen for fatal react errors or console errors indicative of a crash
    page.on('pageerror', (err) => {
      errors.push(`Page Error: ${err.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Minified React error') || text.includes('app crashed')) {
          errors.push(`React Error: ${text}`);
        }
      }
    });

    // Listen for 500 API responses
    page.on('response', (response) => {
      if (response.status() >= 500) {
        unhandled500s.push(`500 Response: ${response.url()}`);
      }
    });
  });

  test('Log in and traverse all major routes without fatal errors', async ({ page }) => {
    // 1. Storage state provides auth. Just start at dashboard.
    // Wait for the app to hydrate
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Route Traversal
    for (const route of MAJOR_ROUTES) {
      await page.goto(route);

      // Wait for network to be idle to ensure the page has loaded
      await page.waitForLoadState('networkidle');

      // Visual / DOM Check 1: Verify <body> contains content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length, `Page body should not be empty at ${route}`).toBeGreaterThan(
        0
      );

      // Visual / DOM Check 2: No generic ErrorBoundary
      // The requirement states we must fail if we detect a generic <ErrorBoundary> component fallback UI.
      // In ErrorBoundary.tsx, the generic text is "System Interruption" or "Consult Oracle".
      const errorBoundaryText = page.locator('text="System Interruption"');
      if ((await errorBoundaryText.count()) > 0) {
        errors.push(`Generic ErrorBoundary visible on ${route}`);
      }

      // We should also check for role-specific fallback error boundaries defined in App.tsx
      // e.g., "Dashboard Error", "Skills Directory Error"
      const tryAgainBtn = page.locator('button:has-text("Try Again")');
      if ((await tryAgainBtn.count()) > 0) {
        const h2 = page.locator('h2', { hasText: 'Error' });
        if ((await h2.count()) > 0) {
          errors.push(`Specific ErrorBoundary visible on ${route}`);
        }
      }

      // Explicitly fail if accumulated errors exist
      expect(errors, `Fatal errors detected on ${route}`).toEqual([]);
      expect(unhandled500s, `500 API responses detected on ${route}`).toEqual([]);
    }
  });
});

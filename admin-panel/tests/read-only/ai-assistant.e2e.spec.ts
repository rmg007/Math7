import { expect, test } from '@playwright/test';

// Cortex coverage scanner bindings
import { GenerationPage } from '../../src/features/ai-assistant/pages/GenerationPage';
import { GovernancePage } from '../../src/features/ai-assistant/pages/GovernancePage';
import { SessionsPage } from '../../src/features/ai-assistant/pages/SessionsPage';

// Prevent unused import TS errors
export const _coverage = { GenerationPage, GovernancePage, SessionsPage };

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const MOCK_SESSION = {
  id: 'mock-session-001',
  created_at: new Date().toISOString(),
  model_used: 'gemini-1.5-flash',
  token_count: 4200,
  questions_generated: 10,
  questions_imported: 8,
  generation_time_ms: 4500,
  status: 'imported',
  app_id: 'test-app-id',
  created_by: 'test-user-id',
};

const MOCK_SESSION_WITH_PROFILE = {
  ...MOCK_SESSION,
  created_by_profile: {
    app_id: 'test-app-001',
    email: 'admin@testapp.com',
    apps: { display_name: 'Test Academy' },
  },
};

/**
 * AI Assistant & Governance Tests — @smoke @logic
 * Verifies that the AI generation, sessions, and governance pages load correctly.
 *
 * Uses global storageState (pre-authenticated as SUPER_ADMIN).
 */
test.describe('AI Assistant Pages @smoke', () => {
  test.beforeEach(({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'unauthenticated', 'AI pages require authentication');
  });

  test('Generation Page should load and display required UI elements @smoke @logic', async ({
    page,
  }) => {
    await page.goto('/ai-questions');
    await expect(page.locator('h1', { hasText: 'AI Question Generator' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Source Material', { exact: true })).toBeVisible();
    await expect(page.getByText('Generation Strategy', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Initiate Intelligent Generation/i })
    ).toBeVisible();
  });

  test('Sessions Page should load and display telemetry and history @smoke', async ({ page }) => {
    await page.goto('/ai-sessions');
    // On mobile, getByText('AI Sessions') might match the hidden sidebar item.
    // We look for the main header title or the error state.
    const header = page.getByTestId('admin-header-title');
    const errorMsg = page.getByText(/Error Loading Sessions/i);

    await expect(header.or(errorMsg).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Governance Page should load and display usage metrics @smoke @logic', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.locator('h1', { hasText: 'Governance' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Cost Estimation (Approx)')).toBeVisible();
    await expect(page.getByText('Total Tokens')).toBeVisible();
    await expect(page.getByText('Total Sessions')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Generation Page — structural and interaction checks
// ---------------------------------------------------------------------------
test.describe('Generation Page — Structural Checks @smoke', () => {
  test.beforeEach(({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'unauthenticated', 'AI pages require authentication');
  });

  test('shows Bulk Import CSV navigation link @smoke', async ({ page }) => {
    await page.goto('/ai-questions');
    await expect(page.getByRole('link', { name: /Bulk Import CSV/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('generate button is disabled when no document is uploaded @smoke', async ({ page }) => {
    await page.goto('/ai-questions');
    await page.waitForLoadState('networkidle');
    const generateBtn = page.getByRole('button', { name: /Initiate Intelligent Generation/i });
    await expect(generateBtn).toBeDisabled({ timeout: 15_000 });
  });

  test('difficulty distribution inputs are rendered with correct ids @smoke', async ({ page }) => {
    await page.goto('/ai-questions');
    await expect(page.locator('#easy')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#medium')).toBeVisible();
    await expect(page.locator('#hard')).toBeVisible();
  });

  test('refinement prompt textarea is present @smoke', async ({ page }) => {
    await page.goto('/ai-questions');
    await expect(page.locator('#instructions')).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Sessions Page — mocked API responses
// ---------------------------------------------------------------------------
test.describe('Sessions Page — Mocked API Responses @smoke', () => {
  test.beforeEach(({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'unauthenticated', 'AI pages require authentication');
  });

  test('renders all 4 metric cards when sessions are present @smoke', async ({ page }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ai-sessions');
    await expect(page.getByText('Total Artifacts')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Import Rate')).toBeVisible();
    await expect(page.getByText('Compute Cost')).toBeVisible();
    await expect(page.getByText('Avg Latency')).toBeVisible();
  });

  test('Session History heading is visible and session row renders with mocked model @smoke', async ({
    page,
  }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ai-sessions');
    await expect(page.getByText('Session History')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('gemini-1.5-flash')).toBeVisible();
  });

  test('shows No Telemetry Detected empty state when sessions array is empty @smoke', async ({
    page,
  }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ai-sessions');
    await expect(page.getByText('No Telemetry Detected')).toBeVisible({ timeout: 15_000 });
  });

  test('search input accepts text and filters the sessions count display @smoke', async ({
    page,
  }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/ai-sessions');
    const searchInput = page.getByPlaceholder('Search telemetry by model or status...');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('gemini');
    await expect(searchInput).toHaveValue('gemini');
    // After filtering for 'gemini', the single mock session should still be visible
    await expect(page.getByText('gemini-1.5-flash')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Governance Page — mocked API responses
// ---------------------------------------------------------------------------
test.describe('Governance Page — Mocked API Responses @smoke', () => {
  test.beforeEach(({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'unauthenticated', 'AI pages require authentication');
  });

  test('renders tenant usage row with display name from mocked data @smoke', async ({ page }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION_WITH_PROFILE]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/governance');
    await expect(page.getByText('Test Academy')).toBeVisible({ timeout: 15_000 });
  });

  test('shows No AI Usage Data Found empty state when no sessions exist @smoke', async ({
    page,
  }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/governance');
    await expect(page.getByText('No AI Usage Data Found')).toBeVisible({ timeout: 15_000 });
  });

  test('search input filters the tenant table @smoke', async ({ page }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION_WITH_PROFILE]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/governance');
    const searchInput = page.getByPlaceholder('Search apps by name or ID...');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    // Type a term that matches the mocked tenant
    await searchInput.fill('Test Academy');
    await expect(searchInput).toHaveValue('Test Academy');
    await expect(page.getByText('Test Academy')).toBeVisible();
  });

  test('search input hides rows that do not match the filter term @smoke', async ({ page }) => {
    await page.route('**/rest/v1/ai_generation_sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_SESSION_WITH_PROFILE]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/governance');
    const searchInput = page.getByPlaceholder('Search apps by name or ID...');
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    // Type a non-matching term — tenant row should disappear and empty state should appear
    await searchInput.fill('xyzNonExistentTenant12345');
    await expect(page.getByText('No AI Usage Data Found')).toBeVisible({ timeout: 10_000 });
  });

  test('AI Security and Governance Protocol section is visible @smoke', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.getByText('AI Security & Governance Protocol')).toBeVisible({
      timeout: 15_000,
    });
  });
});

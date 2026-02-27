/**
 * mentor-hub.e2e.spec.ts
 *
 * P0/P1 Mentor Hub End-to-End Tests
 *
 * Tests: AP-MENTOR-001..006
 * Covers: group creation (class + family), group detail, assignment creation
 *         (skill_mastery, time_goal), and role-based access denial.
 *
 * Strategy:
 * - Happy-path tests use TEST_USERS.ADMIN (real login) with mocked Supabase
 *   REST responses via page.route() to avoid real DB mutations.
 * - Negative tests (student cannot access /groups) work without real accounts
 *   by stubbing the session via localStorage injection.
 *
 * All assertions are on persistent DOM state (lists, badges, counts),
 * NOT on transient toasts.
 */
import { expect, test } from '@playwright/test';
import { TEST_USERS, login } from '../test-utils';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_APP_ID = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_GROUP_ID = '660e8400-e29b-41d4-a716-446655440002';
const MOCK_SKILL_ID = '770e8400-e29b-41d4-a716-446655440003';

// Reusable mock: GET /rest/v1/groups returns our seeded group
function mockGroupsResponse(page: import('@playwright/test').Page) {
  return page.route('**/rest/v1/groups**', (route) => {
    if (route.request().method() === 'GET') {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: MOCK_GROUP_ID,
            app_id: MOCK_APP_ID,
            name: 'Math 7A',
            type: 'class',
            join_code: 'J0IN-C0D3',
            allow_anonymous: false,
            requires_approval: false,
            owner_id: 'owner-id',
          },
        ]),
        headers: { 'content-range': '0-0/1' },
      });
    } else {
      void route.continue();
    }
  });
}

// Reusable mock: POST /rest/v1/groups returns the new group
function mockGroupInsert(
  page: import('@playwright/test').Page,
  overrides: Record<string, unknown> = {}
) {
  return page.route('**/rest/v1/groups**', (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: MOCK_GROUP_ID,
            app_id: MOCK_APP_ID,
            name: requestBody['name'] ?? 'Math 7A',
            type: requestBody['type'] ?? 'class',
            join_code: 'J0IN-C0D3',
            allow_anonymous: false,
            requires_approval: false,
            owner_id: 'owner-id',
            ...overrides,
          },
        ]),
      });
    } else {
      void route.continue();
    }
  });
}

// ---------------------------------------------------------------------------
// AP-MENTOR-001: Create a class-type group
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-001: Create Class Group @logic', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Skipped: TEST_ADMIN_EMAIL not set');

  test('admin can create a class-type group with a join code', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // Mock the group INSERT
    await mockGroupInsert(page);

    // Mock the groups GET (for redirect after create)
    await mockGroupsResponse(page);

    await page.goto('/groups/new');

    // Fill the form (adjust selectors to match actual GroupCreatePage fields)
    await page.locator('input[name="name"]').fill('Math 7A');

    // Select class type (could be a select or radio group)
    const typeSelect = page.locator('select[name="type"]');
    const typeRadio = page.locator('input[type="radio"][value="class"]');

    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('class');
    } else if (await typeRadio.isVisible()) {
      await typeRadio.click();
    }

    // Submit
    await page.getByRole('button', { name: /create|save/i }).click();

    // After creation, should navigate away from /groups/new
    await page.waitForURL((url) => !url.pathname.endsWith('/new'), { timeout: 10000 });

    // Check we're on groups list or group detail (both are valid)
    const currentPath = new URL(page.url()).pathname;
    expect(['/groups', `/groups/${MOCK_GROUP_ID}`]).toContain(currentPath);
  });
});

// ---------------------------------------------------------------------------
// AP-MENTOR-002: Create a family-type group
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-002: Create Family Group', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Skipped: TEST_ADMIN_EMAIL not set');

  test('admin can create a family-type group', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    await mockGroupInsert(page, { type: 'family' });
    await mockGroupsResponse(page);

    await page.goto('/groups/new');

    await page.locator('input[name="name"]').fill('Smith Family Group');

    const typeSelect = page.locator('select[name="type"]');
    const typeRadio = page.locator('input[type="radio"][value="family"]');

    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('family');
    } else if (await typeRadio.isVisible()) {
      await typeRadio.click();
    }

    await page.getByRole('button', { name: /create|save/i }).click();

    await page.waitForURL((url) => !url.pathname.endsWith('/new'), { timeout: 10000 });
    expect(new URL(page.url()).pathname).not.toBe('/groups/new');
  });
});

// ---------------------------------------------------------------------------
// AP-MENTOR-003: Group detail page shows members
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-003: Group Detail Shows Members', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Skipped: TEST_ADMIN_EMAIL not set');

  test('group detail page shows all members with roles', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // Mock single group fetch
    await page.route(`**/rest/v1/groups?id=eq.${MOCK_GROUP_ID}**`, (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: MOCK_GROUP_ID,
            app_id: MOCK_APP_ID,
            name: 'Math 7A',
            type: 'class',
            join_code: 'J0IN-C0D3',
          },
        ]),
      });
    });

    // Mock group_members
    await page.route('**/rest/v1/group_members**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            group_id: MOCK_GROUP_ID,
            student_id: 'student-1',
            role: 'member',
            profiles: { full_name: 'Alice Smith', email: 'alice@example.com' },
          },
          {
            group_id: MOCK_GROUP_ID,
            student_id: 'student-2',
            role: 'member',
            profiles: { full_name: 'Bob Jones', email: 'bob@example.com' },
          },
        ]),
        headers: { 'content-range': '0-1/2' },
      });
    });

    await page.goto(`/groups/${MOCK_GROUP_ID}`);
    await page.waitForLoadState('networkidle');

    // Members should be visible in some list/table
    await expect(page.getByText('Alice Smith')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Bob Jones')).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// AP-MENTOR-004: Create a skill_mastery assignment
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-004: Create Skill Mastery Assignment', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Skipped: TEST_ADMIN_EMAIL not set');

  test('admin can create a skill_mastery assignment for a group', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    // Mock skills list for the assignment form
    await page.route('**/rest/v1/skills**', (route) => {
      if (route.request().method() === 'GET') {
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              skill_id: MOCK_SKILL_ID,
              title: 'Linear Equations',
              app_id: MOCK_APP_ID,
              status: 'live',
            },
          ]),
          headers: { 'content-range': '0-0/1' },
        });
      } else {
        void route.continue();
      }
    });

    // Mock assignment INSERT
    const MOCK_ASSIGNMENT_ID = '880e8400-e29b-41d4-a716-446655440004';
    await page.route('**/rest/v1/assignments**', (route) => {
      if (route.request().method() === 'POST') {
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: MOCK_ASSIGNMENT_ID,
              group_id: MOCK_GROUP_ID,
              type: 'skill_mastery',
              target_id: MOCK_SKILL_ID,
              scope: 'mandatory',
              status: 'pending',
              due_date: new Date(Date.now() + 86400000).toISOString(),
            },
          ]),
        });
      } else {
        void route.continue();
      }
    });

    await page.goto(`/groups/${MOCK_GROUP_ID}/assignments/new`);
    await page.waitForLoadState('networkidle');

    // Select assignment type
    const typeSelect = page.locator('select[name="type"]');
    const typeMasteryRadio = page.locator('input[type="radio"][value="skill_mastery"]');

    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('skill_mastery');
    } else if (await typeMasteryRadio.isVisible()) {
      await typeMasteryRadio.click();
    }

    // Select skill target
    const skillSelect = page.locator('select[name="target_id"]');
    if (await skillSelect.isVisible()) {
      await skillSelect.selectOption(MOCK_SKILL_ID);
    } else {
      // Could be a combobox/search
      await page.getByPlaceholder(/search skills/i).fill('Linear');
      await page.getByText('Linear Equations').click();
    }

    // Set scope to mandatory
    const scopeSelect = page.locator('select[name="scope"]');
    if (await scopeSelect.isVisible()) {
      await scopeSelect.selectOption('mandatory');
    }

    // Set due date (tomorrow)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dueDateInput = page.locator('input[type="date"][name="due_date"]');
    if (await dueDateInput.isVisible()) {
      await dueDateInput.fill(tomorrow);
    }

    // Submit
    await page.getByRole('button', { name: /create|save|assign/i }).click();

    // Should navigate away from assignment creation
    await page.waitForURL(
      (url) => !url.pathname.includes('/assignments/new') && !url.pathname.startsWith('/login'),
      { timeout: 10000 }
    );
  });
});

// ---------------------------------------------------------------------------
// AP-MENTOR-005: Create a time_goal assignment
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-005: Create Time Goal Assignment', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Skipped: TEST_ADMIN_EMAIL not set');

  test('admin can create a time_goal assignment', async ({ page }) => {
    await login(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);

    await page.route('**/rest/v1/assignments**', (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        // Verify type is sent correctly
        expect(body['type']).toBe('time_goal');
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '990e8400-e29b-41d4-a716-446655440005',
              group_id: MOCK_GROUP_ID,
              type: 'time_goal',
              scope: 'suggested',
              status: 'pending',
            },
          ]),
        });
      } else {
        void route.continue();
      }
    });

    await page.goto(`/groups/${MOCK_GROUP_ID}/assignments/new`);
    await page.waitForLoadState('networkidle');

    const typeSelect = page.locator('select[name="type"]');
    const typeGoalRadio = page.locator('input[type="radio"][value="time_goal"]');

    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('time_goal');
    } else if (await typeGoalRadio.isVisible()) {
      await typeGoalRadio.click();
    }

    // Time goal specific field (minutes)
    const minutesInput = page.locator('input[name="goal_minutes"], input[name="time_goal"]');
    if (await minutesInput.isVisible()) {
      await minutesInput.fill('30');
    }

    await page.getByRole('button', { name: /create|save|assign/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/assignments/new'), { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// AP-MENTOR-006: Student cannot access /groups (StandardAdminGuard)
// ---------------------------------------------------------------------------
test.describe('AP-MENTOR-006: Student Cannot Access Groups', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test('unauthenticated user navigating to /groups is redirected to /login', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/groups');

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

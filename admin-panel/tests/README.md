# Admin Panel E2E Test Suite Documentation

## Overview

This comprehensive end-to-end test suite validates all critical functionality of the Math7 Admin Panel. The tests are built using Playwright and cover authentication, CRUD operations, publishing workflows, and admin features.

## Test Coverage

### 1. Authentication (5 tests)
- ✅ Login page loads correctly
- ✅ Login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Logout functionality
- ✅ Protected route redirection

### 2. Dashboard (2 tests)
- ✅ Dashboard displays with statistics
- ✅ Navigation to different sections

### 3. Domains Management (4 tests)
- ✅ List all domains
- ✅ Create new domain
- ✅ Edit existing domain
- ✅ Delete domain

### 4. Skills Management (4 tests)
- ✅ List all skills
- ✅ Create new skill
- ✅ Filter skills by domain
- ✅ Edit existing skill

### 5. Questions Management (5 tests)
- ✅ List all questions
- ✅ Create new MCQ question
- ✅ Filter questions by skill
- ✅ Preview question
- ✅ Edit existing question

### 6. Publishing Workflow (3 tests)
- ✅ Navigate to publish page
- ✅ Show unpublished changes
- ✅ Publish changes

### 7. Version History (2 tests)
- ✅ Display version history
- ✅ View version details

### 8. Account Settings (3 tests)
- ✅ Navigate to settings
- ✅ Display user information
- ✅ Update account settings

### 9. Super Admin Features (3 tests)
- ✅ Access user management
- ✅ Access invitation codes
- ✅ Create invitation code

### 10. Error Handling (3 tests)
- ✅ Handle 404 pages
- ✅ Form validation
- ✅ Network error handling

### 11. Responsive Design (2 tests)
- ✅ Mobile viewport compatibility
- ✅ Tablet viewport compatibility

### 12. Performance (2 tests)
- ✅ Dashboard load time
- ✅ Large list handling

**Total: 42 comprehensive end-to-end tests**

## Prerequisites

### 1. Test Users Setup

You need to create test users in your Supabase project:

#### Regular Admin User
```sql
-- Create test admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES (
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  'authenticated'
);

-- Add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'test@example.com';
```

#### Super Admin User
```sql
-- Create test super admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES (
  'superadmin@example.com',
  crypt('superadminpassword123', gen_salt('bf')),
  now(),
  'authenticated'
);

-- Add super admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'superadmin@example.com';
```

### 2. Environment Configuration

1. Copy `.env.test` and update with your test credentials:
```bash
cp .env.test .env.test.local
```

2. Update the credentials in `.env.test.local`:
```env
TEST_ADMIN_EMAIL=your-test-admin@example.com
TEST_ADMIN_PASSWORD=your-test-password
TEST_SUPER_ADMIN_EMAIL=your-super-admin@example.com
TEST_SUPER_ADMIN_PASSWORD=your-super-admin-password
```

### 3. Install Dependencies

```bash
npm install
npx playwright install chromium
```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Specific Test Suite
```bash
npx playwright test --grep "Authentication"
npx playwright test --grep "Domains Management"
npx playwright test --grep "Questions Management"
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests with Debug Mode
```bash
npx playwright test --debug
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Generate Test Report
```bash
npx playwright show-report
```

## Test Data Management

### Automatic Test Data Cleanup

The tests create temporary data with timestamps to avoid conflicts:
- Domains: `Test Domain {timestamp}`
- Skills: `Test Skill {timestamp}`
- Questions: `What is 2 + 2? (Test {timestamp})`

### Manual Cleanup

If you need to clean up test data manually:

```sql
-- Delete test domains
DELETE FROM domains WHERE name LIKE 'Test Domain%';

-- Delete test skills
DELETE FROM skills WHERE name LIKE 'Test Skill%';

-- Delete test questions
DELETE FROM questions WHERE text LIKE '%Test %';
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Run E2E tests
        env:
          TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
          TEST_SUPER_ADMIN_EMAIL: ${{ secrets.TEST_SUPER_ADMIN_EMAIL }}
          TEST_SUPER_ADMIN_PASSWORD: ${{ secrets.TEST_SUPER_ADMIN_PASSWORD }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Patterns and Best Practices

### 1. Page Object Model

Consider creating page objects for better maintainability:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/');
  }
}
```

### 2. Custom Fixtures

Create reusable fixtures for common setup:

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await use(page);
  },
});
```

### 3. Test Data Builders

Use builders for complex test data:

```typescript
class QuestionBuilder {
  private question = {
    text: '',
    type: 'mcq',
    options: [],
    correctAnswer: '',
  };
  
  withText(text: string) {
    this.question.text = text;
    return this;
  }
  
  build() {
    return this.question;
  }
}
```

## Troubleshooting

### Tests Failing Due to Timeout

Increase timeout in `playwright.config.ts`:
```typescript
export default defineConfig({
  timeout: 60000, // 60 seconds
});
```

### Authentication Issues

1. Verify test users exist in Supabase
2. Check credentials in `.env.test.local`
3. Ensure Supabase URL and anon key are correct

### Element Not Found Errors

1. Check if selectors match your UI components
2. Add `data-testid` attributes for more reliable selection
3. Use Playwright Inspector: `npx playwright test --debug`

### Network Errors

1. Ensure dev server is running
2. Check Supabase connection
3. Verify firewall/proxy settings

## Extending the Tests

### Adding New Test Suites

1. Create a new test file in `tests/` directory
2. Import necessary utilities:
```typescript
import { test, expect } from '@playwright/test';
```

3. Follow the existing pattern:
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });
  
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Adding Test Data

Update the test data generators in the main test file or create a separate `test-data.ts` file.

## Reporting

### HTML Report

After running tests, view the HTML report:
```bash
npx playwright show-report
```

### Custom Reporters

Add custom reporters in `playwright.config.ts`:
```typescript
reporter: [
  ['html'],
  ['json', { outputFile: 'test-results.json' }],
  ['junit', { outputFile: 'test-results.xml' }],
],
```

## Performance Benchmarks

Expected performance metrics:
- Login: < 2 seconds
- Dashboard load: < 3 seconds
- CRUD operations: < 5 seconds
- List page load: < 4 seconds

## Security Considerations

1. **Never commit test credentials** - Use environment variables
2. **Use separate test database** - Don't test on production
3. **Clean up test data** - Remove after test completion
4. **Rotate test passwords** - Change regularly
5. **Limit test user permissions** - Only what's needed for testing

## Maintenance

### Regular Updates

1. Update Playwright: `npm update @playwright/test`
2. Update browsers: `npx playwright install`
3. Review and update selectors when UI changes
4. Add tests for new features

### Test Review Checklist

- [ ] All tests pass consistently
- [ ] No flaky tests
- [ ] Test data is cleaned up
- [ ] Selectors are maintainable
- [ ] Documentation is up to date
- [ ] CI/CD integration works

## Support

For issues or questions:
1. Check Playwright documentation: https://playwright.dev
2. Review test output and screenshots
3. Use `--debug` flag for step-by-step debugging
4. Check browser console for errors

## License

This test suite is part of the Math7 Admin Panel project.

# Quick Start Guide - Admin Panel E2E Testing

## Prerequisites Checklist

- [ ] Node.js installed (v18 or higher)
- [ ] Admin panel dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install chromium`)
- [ ] Supabase project configured
- [ ] Test users created in Supabase

## Step 1: Install Dependencies

```bash
cd admin-panel
npm install
npx playwright install chromium
```

## Step 2: Configure Test Environment

### Option A: Manual User Creation (Recommended for first-time setup)

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Create two test users:
   - **Regular Admin**: `test@example.com` / `testpassword123`
   - **Super Admin**: `superadmin@example.com` / `superadminpassword123`
4. Confirm their emails automatically

### Option B: Automated User Creation

1. Add your Supabase service role key to `.env`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Run the setup script:
   ```bash
   npm run test:setup
   ```

### Configure Test Credentials

1. Copy the test environment template:
   ```bash
   cp .env.test .env.test.local
   ```

2. Update `.env.test.local` with your actual test credentials:
   ```env
   TEST_ADMIN_EMAIL=test@example.com
   TEST_ADMIN_PASSWORD=testpassword123
   TEST_SUPER_ADMIN_EMAIL=superadmin@example.com
   TEST_SUPER_ADMIN_PASSWORD=superadminpassword123
   ```

## Step 3: Run Tests

### Run All Tests (Headless)
```bash
npm run test:e2e
```

### Run Tests with UI (Interactive - Recommended for first run)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Run Tests in Debug Mode (Step-by-step)
```bash
npm run test:e2e:debug
```

### Run Specific Test Suite
```bash
npx playwright test --grep "Authentication"
npx playwright test --grep "Domains Management"
npx playwright test --grep "Questions Management"
```

### Run Single Test File
```bash
npx playwright test tests/admin-panel.e2e.spec.ts
```

## Step 4: View Results

### View HTML Report
```bash
npm run test:e2e:report
```

### View Test Results in Terminal
Results are automatically displayed after test execution.

## Common Issues and Solutions

### Issue: "Cannot find test users"
**Solution**: Make sure test users are created in Supabase and credentials in `.env.test.local` are correct.

### Issue: "Timeout waiting for page"
**Solution**: 
- Ensure dev server is running (`npm run dev`)
- Check if port 5173 is available
- Increase timeout in `playwright.config.ts`

### Issue: "Element not found"
**Solution**: 
- Run tests in headed mode to see what's happening
- Check if UI components have changed
- Update selectors in test file

### Issue: "Authentication failed"
**Solution**:
- Verify test user credentials
- Check Supabase connection
- Ensure users are confirmed in Supabase

## Test Execution Workflow

```
┌─────────────────────────────────────────┐
│  1. Install Dependencies                │
│     npm install                         │
│     npx playwright install chromium     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. Create Test Users                   │
│     Option A: Manual (Supabase UI)      │
│     Option B: Automated (npm run        │
│               test:setup)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. Configure Credentials               │
│     cp .env.test .env.test.local        │
│     Edit .env.test.local                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Run Tests                           │
│     npm run test:e2e:ui (first time)    │
│     npm run test:e2e (subsequent)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  5. Review Results                      │
│     npm run test:e2e:report             │
└─────────────────────────────────────────┘
```

## Test Coverage Summary

✅ **42 Total Tests** covering:

- **Authentication** (5 tests)
  - Login/logout flows
  - Error handling
  - Protected routes

- **Dashboard** (2 tests)
  - Statistics display
  - Navigation

- **Domains Management** (4 tests)
  - CRUD operations
  - List/filter functionality

- **Skills Management** (4 tests)
  - CRUD operations
  - Domain filtering

- **Questions Management** (5 tests)
  - CRUD operations
  - Question preview
  - Skill filtering

- **Publishing** (3 tests)
  - Change detection
  - Publish workflow

- **Version History** (2 tests)
  - Version listing
  - Version details

- **Account Settings** (3 tests)
  - Settings display
  - Profile updates

- **Super Admin** (3 tests)
  - User management
  - Invitation codes

- **Error Handling** (3 tests)
  - 404 pages
  - Form validation
  - Network errors

- **Responsive Design** (2 tests)
  - Mobile viewport
  - Tablet viewport

- **Performance** (2 tests)
  - Load times
  - Large lists

## Next Steps

After running tests successfully:

1. **Review Test Results**: Check the HTML report for detailed results
2. **Fix Failures**: Address any failing tests
3. **Add to CI/CD**: Integrate tests into your deployment pipeline
4. **Maintain Tests**: Update tests when UI changes
5. **Expand Coverage**: Add tests for new features

## Useful Commands Reference

```bash
# Installation
npm install                              # Install dependencies
npx playwright install chromium          # Install browser

# Test Execution
npm run test:e2e                        # Run all tests
npm run test:e2e:ui                     # Interactive UI mode
npm run test:e2e:headed                 # See browser
npm run test:e2e:debug                  # Debug mode

# Reporting
npm run test:e2e:report                 # View HTML report

# Specific Tests
npx playwright test --grep "pattern"    # Run matching tests
npx playwright test tests/file.spec.ts  # Run specific file

# Debugging
npx playwright test --debug             # Step through tests
npx playwright codegen                  # Generate test code
```

## Support

For detailed documentation, see `tests/README.md`

For Playwright documentation: https://playwright.dev

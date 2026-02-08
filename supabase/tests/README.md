# Supabase Regression Tests

## Overview

Automated regression tests for critical security vulnerabilities. These tests ensure that RLS policies, server-side validation, and security controls remain effective as the codebase evolves.

## Test Coverage

| Test | Vulnerability | Status |
|------|--------------|--------|
| `rls/mentor_isolation_test.sql` | VUL-002: Subject Leakage | ✅ Implemented |
| `functions/sync_validation_test.sql` | VUL-003: SQLite Integrity | ✅ Implemented |
| `security/rate_limiting_test.sql` | VUL-007: Join Code Brute-force | ✅ Implemented |

## Running Tests Locally

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase instance:
   ```bash
   cd supabase
   supabase start
   ```

### Run Individual Test

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f tests/rls/mentor_isolation_test.sql
```

### Run All Tests

```bash
cd supabase
./tests/run_all.sh
```

Expected output:
```
Running Supabase Regression Tests...
→ VUL-002: Mentor Domain Isolation
✅ PASS: Mentor sees only assigned domains

→ VUL-003: Server-Side Validation
✅ PASS: Server rejects tampered answers

→ VUL-007: Rate Limiting
✅ PASS: Rate limiting blocks brute-force

✅ All tests passed!
```

## Running Tests in CI

Tests run automatically via `.github/workflows/ci.yml` on every PR targeting `main`.

## Writing New Tests

All tests follow this pattern:

```sql
-- 1. Setup: Create test data
BEGIN;
-- ... create test entities

-- 2. Execute: Run the operation being tested
-- ... perform queries/RPC calls

-- 3. Assert: Verify expected behavior
DO $$
BEGIN
  IF (/* condition */) THEN
    RAISE NOTICE '✅ PASS: Test description';
  ELSE
    RAISE EXCEPTION '❌ FAIL: Test description';
  END IF;
END $$;

-- 4. Cleanup
ROLLBACK;
```

## Troubleshooting

### Connection Refused
```
psql: error: connection to server at "localhost" (::1), port 54322 failed
```
**Solution**: Ensure Supabase is running with `supabase status`. If not, run `supabase start`.

### Permission Denied
```
ERROR: permission denied for table skill_progress
```
**Solution**: Tests run as `postgres` superuser. Check that RLS is enabled with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

### Test Failures
If a test fails, it may indicate:
1. **Actual Vulnerability**: The security control being tested doesn't exist (expected for new tests)
2. **Regression**: A recent change broke the security control
3. **Test Bug**: The test itself has an error

Check the error message and review the relevant code/policies.

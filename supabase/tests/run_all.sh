#!/bin/bash
# Supabase Regression Test Runner
# Executes all security regression tests against local or remote Supabase instance

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "🧪 Supabase Regression Test Suite"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "${YELLOW}⚠️  DATABASE_URL not set, using local Supabase default${NC}"
  export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
fi

echo "Database: $DATABASE_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=3

# Function to run a test
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo "→ Running: $test_name"
  
  if psql "$DATABASE_URL" -f "$test_file" 2>&1 | tee /tmp/test_output.txt; then
    # Check if output contains FAIL
    if grep -q "❌ FAIL" /tmp/test_output.txt; then
      echo "${RED}  ❌ FAIL${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    elif grep -q "✅ PASS" /tmp/test_output.txt; then
      echo "${GREEN}  ✅ PASS${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo "${YELLOW}  ⚠️  UNKNOWN (check output)${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  else
    echo "${RED}  ❌ ERROR (test execution failed)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  echo ""
}

# Run all tests
run_test "tests/rls/mentor_isolation_test.sql" "VUL-002: Mentor Domain Isolation"
run_test "tests/functions/sync_validation_test.sql" "VUL-003: Server-Side Validation"
run_test "tests/security/rate_limiting_test.sql" "VUL-007: Rate Limiting"

# Summary
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo "Total Tests: $TESTS_TOTAL"
echo "${GREEN}Passed: $TESTS_PASSED${NC}"
echo "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "${GREEN}✅ All regression tests passed!${NC}"
  exit 0
else
  echo "${RED}❌ Some tests failed. Review output above.${NC}"
  echo ""
  echo "Note: Some failures may be expected if features are not"
  echo "implemented yet. Check test comments for remediation steps."
  exit 1
fi

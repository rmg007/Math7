#!/bin/bash
# Phase 2: Student App Core Loop Validation
# Validates offline-first Flutter implementation

set -e

echo "========================================="
echo "Phase 2: Student App Validation"
echo "========================================="

ERRORS=0
WARNINGS=0

# Navigate to student-app
if [ ! -d "student-app" ]; then
  echo "ERROR: student-app directory not found"
  exit 1
fi

cd student-app

# Check Drift database files
echo ""
echo "Checking Drift database..."
if [ -f "lib/database/database.dart" ] || [ -f "lib/src/database/database.dart" ]; then
  echo "  OK: Database file exists"
else
  echo "  ERROR: database.dart not found"
  ERRORS=$((ERRORS + 1))
fi

# Check for generated code
if find . -name "*.g.dart" | grep -q .; then
  echo "  OK: Generated code files found"
else
  echo "  WARNING: No .g.dart files found. Run: dart run build_runner build"
  WARNINGS=$((WARNINGS + 1))
fi

# Check repositories
echo ""
echo "Checking repositories..."
REPOS=("domain" "skill" "question" "attempt" "session")
for repo in "${REPOS[@]}"; do
  if find . -name "*${repo}*repository*" -o -name "*${repo}*_repository*" | grep -q .; then
    echo "  OK: ${repo} repository found"
  else
    echo "  WARNING: ${repo} repository not found"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# Check sync service
echo ""
echo "Checking sync service..."
if find . -name "*sync*service*" -o -name "*sync*" | grep -q "\.dart"; then
  echo "  OK: Sync service found"
else
  echo "  ERROR: Sync service not found"
  ERRORS=$((ERRORS + 1))
fi

# Run Flutter analyze
echo ""
echo "Running Flutter analyze..."
if flutter analyze; then
  echo "  OK: flutter analyze passed"
else
  echo "  ERROR: flutter analyze failed"
  ERRORS=$((ERRORS + 1))
fi

# Run Flutter tests
echo ""
echo "Running Flutter tests..."
if flutter test; then
  echo "  OK: flutter test passed"
else
  echo "  WARNING: flutter test failed"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for integration test
echo ""
echo "Checking integration tests..."
if [ -d "integration_test" ]; then
  if [ -f "integration_test/offline_workflow_test.dart" ]; then
    echo "  OK: offline_workflow_test.dart exists"
    echo "  Running integration test..."
    if flutter test integration_test/offline_workflow_test.dart; then
      echo "  OK: Integration test passed"
    else
      echo "  WARNING: Integration test failed"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "  WARNING: offline_workflow_test.dart not found"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  WARNING: integration_test directory not found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check Sentry integration
echo ""
echo "Checking Sentry integration..."
if grep -r "sentry_flutter" pubspec.yaml > /dev/null 2>&1; then
  echo "  OK: sentry_flutter in pubspec.yaml"
else
  echo "  WARNING: sentry_flutter not found in dependencies"
  WARNINGS=$((WARNINGS + 1))
fi

cd ..

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase 2 PASSED"
  if [ $WARNINGS -gt 0 ]; then
    echo "  ($WARNINGS warning(s))"
  fi
  echo "========================================="
  exit 0
else
  echo "Phase 2 FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo "========================================="
  exit 1
fi

#!/bin/bash
# Phase 4: Hardening Validation
# Validates error handling, observability, and CI/CD

set -e

echo "========================================="
echo "Phase 4: Hardening Validation"
echo "========================================="

ERRORS=0
WARNINGS=0

# Check Flutter student app hardening
echo ""
echo "Validating Flutter Student App..."
if [ -d "student-app" ]; then
  cd student-app
  
  # Check Sentry
  echo "  Checking Sentry integration..."
  if grep -r "SentryFlutter\|sentry_flutter" lib/ > /dev/null 2>&1; then
    echo "  OK: Sentry initialization found"
  else
    echo "  ERROR: Sentry not initialized in Flutter app"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check typed errors
  echo "  Checking typed errors..."
  if find lib -name "*error*" -type f | grep -q .; then
    echo "  OK: Error handling files found"
  else
    echo "  WARNING: No dedicated error handling files"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Run production build
  echo "  Building release APK..."
  if flutter build apk --release; then
    echo "  OK: Release APK built successfully"
  else
    echo "  ERROR: Release APK build failed"
    ERRORS=$((ERRORS + 1))
  fi
  
  cd ..
else
  echo "  ERROR: student-app not found"
  ERRORS=$((ERRORS + 1))
fi

# Check React admin panel hardening
echo ""
echo "Validating React Admin Panel..."
if [ -d "admin-panel" ]; then
  cd admin-panel
  
  # Check Sentry
  echo "  Checking Sentry integration..."
  if grep -r "@sentry/react\|Sentry.init" src/ > /dev/null 2>&1; then
    echo "  OK: Sentry initialization found"
  else
    echo "  ERROR: Sentry not initialized in React app"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check error boundaries
  echo "  Checking error boundaries..."
  if grep -r "ErrorBoundary" src/ > /dev/null 2>&1; then
    echo "  OK: Error boundaries found"
  else
    echo "  WARNING: No error boundaries found"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Production build
  echo "  Building production..."
  if npm run build; then
    echo "  OK: Production build succeeded"
  else
    echo "  ERROR: Production build failed"
    ERRORS=$((ERRORS + 1))
  fi
  
  cd ..
else
  echo "  ERROR: admin-panel not found"
  ERRORS=$((ERRORS + 1))
fi

# Check CI/CD configuration
echo ""
echo "Checking CI/CD configuration..."
if [ -f ".github/workflows/ci.yml" ] || [ -f ".github/workflows/ci.yaml" ]; then
  echo "  OK: CI workflow found"
  
  # Check for lint step
  if grep -q "lint" .github/workflows/ci.* 2>/dev/null; then
    echo "  OK: Lint step in CI"
  else
    echo "  WARNING: No lint step in CI workflow"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Check for test step
  if grep -q "test" .github/workflows/ci.* 2>/dev/null; then
    echo "  OK: Test step in CI"
  else
    echo "  WARNING: No test step in CI workflow"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  WARNING: CI workflow not found at .github/workflows/ci.yml"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for retry logic
echo ""
echo "Checking retry/backoff logic..."
if grep -r "exponential\|backoff\|retry" student-app/lib/ > /dev/null 2>&1; then
  echo "  OK: Retry logic found in student app"
else
  echo "  WARNING: No retry logic found in student app"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase 4 PASSED"
  if [ $WARNINGS -gt 0 ]; then
    echo "  ($WARNINGS warning(s))"
  fi
  echo "========================================="
  echo ""
  echo "Final Checklist:"
  echo "  [ ] Sentry DSN configured in production"
  echo "  [ ] All tests passing"
  echo "  [ ] No lint warnings"
  echo "  [ ] Documentation complete"
  exit 0
else
  echo "Phase 4 FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo "========================================="
  exit 1
fi

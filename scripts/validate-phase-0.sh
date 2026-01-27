#!/bin/bash
# Phase 0: Project Bootstrap Validation
# Validates Flutter and React apps are properly initialized

set -e

echo "========================================="
echo "Phase 0: Project Bootstrap Validation"
echo "========================================="

ERRORS=0
WARNINGS=0

# Check student-app exists
echo ""
echo "Checking Flutter Student App..."
if [ -d "student-app" ]; then
  echo "  Directory exists"
  
  cd student-app
  
  # Check pubspec.yaml
  if [ -f "pubspec.yaml" ]; then
    echo "  OK: pubspec.yaml exists"
  else
    echo "  ERROR: pubspec.yaml not found"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Run flutter analyze
  echo "  Running flutter analyze..."
  if flutter analyze 2>&1; then
    echo "  OK: flutter analyze passed"
  else
    echo "  ERROR: flutter analyze failed"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Run flutter test
  echo "  Running flutter test..."
  if flutter test 2>&1; then
    echo "  OK: flutter test passed"
  else
    echo "  WARNING: flutter test failed or no tests"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Check .env.example
  if [ -f ".env.example" ]; then
    echo "  OK: .env.example exists"
  else
    echo "  ERROR: .env.example not found"
    ERRORS=$((ERRORS + 1))
  fi
  
  cd ..
else
  echo "  ERROR: student-app directory not found"
  ERRORS=$((ERRORS + 1))
fi

# Check admin-panel exists
echo ""
echo "Checking React Admin Panel..."
if [ -d "admin-panel" ]; then
  echo "  Directory exists"
  
  cd admin-panel
  
  # Check package.json
  if [ -f "package.json" ]; then
    echo "  OK: package.json exists"
  else
    echo "  ERROR: package.json not found"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Run npm build
  echo "  Running npm run build..."
  if npm run build 2>&1; then
    echo "  OK: npm run build succeeded"
  else
    echo "  ERROR: npm run build failed"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Run npm lint
  echo "  Running npm run lint..."
  if npm run lint 2>&1; then
    echo "  OK: npm run lint passed"
  else
    echo "  WARNING: npm run lint failed or not configured"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Check .env.example
  if [ -f ".env.example" ]; then
    echo "  OK: .env.example exists"
  else
    echo "  ERROR: .env.example not found"
    ERRORS=$((ERRORS + 1))
  fi
  
  cd ..
else
  echo "  ERROR: admin-panel directory not found"
  ERRORS=$((ERRORS + 1))
fi

# Check PHASE_STATE.json
echo ""
echo "Checking project files..."
if [ -f "PHASE_STATE.json" ]; then
  echo "  OK: PHASE_STATE.json exists"
  # Validate JSON syntax
  if python3 -c "import json; json.load(open('PHASE_STATE.json'))" 2>/dev/null || python -c "import json; json.load(open('PHASE_STATE.json'))" 2>/dev/null; then
    echo "  OK: PHASE_STATE.json is valid JSON"
  else
    echo "  ERROR: PHASE_STATE.json is not valid JSON"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ERROR: PHASE_STATE.json not found"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase 0 PASSED"
  if [ $WARNINGS -gt 0 ]; then
    echo "  ($WARNINGS warning(s))"
  fi
  echo "========================================="
  exit 0
else
  echo "Phase 0 FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo "========================================="
  exit 1
fi

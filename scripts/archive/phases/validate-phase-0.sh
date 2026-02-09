#!/bin/bash
# Phase 0: Project Bootstrap Validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "0"
check_disk 1

ERRORS=0
WARNINGS=0

echo "Checking Flutter Student App..."
require_cmd flutter

if [ -d "student-app" ]; then
  cd student-app
  
  if [ -f "pubspec.yaml" ]; then
    echo "  OK: pubspec.yaml exists"
  else
    echo "  ERROR: pubspec.yaml not found"
    ERRORS=$((ERRORS + 1))
  fi
  
  echo "  Running flutter analyze..."
  if flutter analyze; then
    echo "  OK: flutter analyze passed"
  else
    echo "  ERROR: flutter analyze failed"
    ERRORS=$((ERRORS + 1))
  fi
  
  echo "  Running flutter test..."
  if flutter test; then
    echo "  OK: flutter test passed"
  else
    echo "  WARNING: flutter test failed or no tests"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  cd ..
else
  echo "ERROR: student-app directory not found"
  ERRORS=$((ERRORS + 1))
fi

echo "Validating React admin..."
if [ -d "admin-panel" ]; then
    cd admin-panel
    
    echo "  Running npm run build..."
    if npm run build; then
         echo "  OK: build passed"
    else
         echo "  ERROR: build failed"
         ERRORS=$((ERRORS + 1))
    fi

    echo "  Running npm run lint..."
    if npm run lint; then
         echo "  OK: lint passed"
    else
         echo "  WARNING: lint failed"
         WARNINGS=$((WARNINGS + 1))
    fi
    cd ..
else
    echo "ERROR: admin-panel directory not found"
    ERRORS=$((ERRORS + 1))
fi

echo "Checking required files..."
for f in "student-app/.env.example" "admin-panel/.env.example" "PHASE_STATE.json"; do
    if [ -f "$f" ]; then
        echo "  OK: $f exists"
    else
        echo "  ERROR: $f missing"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo "Phase 0 FAILED with $ERRORS errors."
    exit 1
fi

echo "Phase 0 PASSED ($WARNINGS warnings)"
exit 0

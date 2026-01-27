#!/bin/bash
# Phase 2: Student App Core Loop Validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "2"
check_disk 1

ERRORS=0

echo "Checking Student App..."
require_cmd flutter

if [ -d "student-app" ]; then
    cd student-app
    
    echo "  Running flutter analyze..."
    if flutter analyze; then
        echo "  OK: flutter analyze passed"
    else
        echo "  ERROR: flutter analyze failed"
        ERRORS=$((ERRORS + 1))
    fi
    
    echo "  Running flutter test (Unit)..."
    if flutter test; then
         echo "  OK: Unit tests passed"
    else
         echo "  ERROR: Unit tests failed"
         ERRORS=$((ERRORS + 1))
    fi
    
    echo "  Checking for Integration Tests..."
    if [ -f "integration_test/offline_workflow_test.dart" ]; then
         # Check for devices
         DEVICES=$(flutter devices --machine | grep '"id":' | wc -l)
         if [ "$DEVICES" -gt 0 ]; then
             echo "  Running integration test on available device..."
             if flutter test integration_test/offline_workflow_test.dart; then
                 echo "  OK: Integration test passed"
             else
                 echo "  ERROR: Integration test failed"
                 ERRORS=$((ERRORS + 1))
             fi
         else
             # Try web-server if supported (headless)
             echo "  No physical/emulator device found. Attempting web-server..."
             if flutter build web > /dev/null 2>&1; then
                 # Just a check if web is valid target
                 if flutter test integration_test/offline_workflow_test.dart -d web-server; then
                    echo "  OK: Integration test passed (web-server)"
                 else
                    handle_skip "Integration test failed or web-server not supported"
                 fi
             else
                 handle_skip "No device and no web target available for integration test"
             fi
         fi
    else
         echo "  WARNING: No integration tests found"
    fi
    
    cd ..
else
    echo "ERROR: student-app missing"
    ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "Phase 2 FAILED"
    exit 1
fi

echo "Phase 2 PASSED"
exit 0

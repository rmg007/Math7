#!/bin/bash
# Phase 3: Admin Panel MVP Validation

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "3"

ERRORS=0

echo "Checking Admin Panel..."
if [ -d "admin-panel" ]; then
    cd admin-panel
    
    echo "  Checking dependencies..."
    if grep -q "@tanstack/react-query" package.json &&        grep -q "@supabase/supabase-js" package.json; then
        echo "  OK: Key dependencies found"
    else
        echo "  ERROR: Key dependencies missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    echo "  Running npm run build..."
    if npm run build; then
         echo "  OK: Build passed"
    else
         echo "  ERROR: Build failed"
         ERRORS=$((ERRORS + 1))
    fi
    
    echo "  Running npm run lint..."
    if npm run lint; then
         echo "  OK: Lint passed"
    else
         # Lint failure is usually warning in dev, but strict in CI?
         # User said "If Strict mode is not set... simple checks".
         # Usually lint should pass. I'll make it warning if not strict, but let's see common.sh.
         # common.sh doesn't enforce strict on custom things, only on skip.
         # I'll keep it as warning if user didn't ask for strict lint. "Do not introduce new warnings/errors in Phase 0".
         # Phase 3 is Admin MVP.
         if [ "$STRICT" -eq 1 ]; then
             echo "  ERROR: Lint failed (STRICT)"
             ERRORS=$((ERRORS + 1))
         else
             echo "  WARNING: Lint failed"
             # Warnings don't fail the build in my script unless I specific check
         fi
    fi
    
    cd ..
else
    echo "ERROR: admin-panel missing"
    ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "Phase 3 FAILED"
    exit 1
fi

echo "Phase 3 PASSED"
exit 0

#!/bin/bash
# Phase 4: Hardening Validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "4"
check_disk 2

echo "Checking Flutter Student App Hardening..."
require_cmd flutter

# Check Sentry
if [ -f "student-app/pubspec.yaml" ] && grep -r "sentry_flutter" student-app/pubspec.yaml >/dev/null; then
  echo "  OK: Sentry found"
else
  echo "  WARNING: Sentry dependency missing in student-app"
fi

# Android Checks
echo "Checking Android Toolchain..."

# 1. Determine SDK Root
SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [ -z "$SDK_ROOT" ]; then
    handle_skip "ANDROID_SDK_ROOT/ANDROID_HOME not set"
fi
echo "  SDK Root: $SDK_ROOT"

# 2. Confirm Directory
if [ ! -d "$SDK_ROOT" ]; then
    handle_skip "Android SDK directory not found at $SDK_ROOT"
fi

# 3. Confirm sdkmanager
SDKMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
if [ ! -x "$SDKMANAGER" ]; then
   handle_skip "sdkmanager not found at $SDKMANAGER"
fi

# 4. Check Packages (36)
# Faster check than running sdkmanager --list
STATUS=0
if [ ! -d "$SDK_ROOT/platforms/android-36" ]; then
    echo "  Missing: platforms;android-36"
    STATUS=1
fi
# Check build tools 36.*
if ! ls "$SDK_ROOT/build-tools/36."* >/dev/null 2>&1; then
    echo "  Missing: build-tools;36.x"
    STATUS=1
fi

if [ "$STATUS" -eq 1 ]; then
    handle_skip "Required Android packages (API 36) missing"
fi

# 5. Build
echo "  Running 'flutter build apk --debug'..."
cd student-app
if flutter build apk --debug; then
    echo "  OK: Build passed"
else
    if [ "$STRICT" -eq 1 ]; then
        echo "ERROR: Build failed in STRICT mode"
        exit 1
    else
        echo "WARNING: Build failed"
        exit 1 
    fi
fi

echo "Checking Admin Panel Hardening..."
cd ../admin-panel
if [ -f "package.json" ] && grep -r "@sentry/react" package.json >/dev/null; then
    echo "  OK: React Sentry dependency found"
fi

echo "Phase 4 PASSED"

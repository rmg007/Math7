#!/bin/bash
# Phase -1: Environment Validation
# Validates all required tools are installed and accessible.

set -euo pipefail

# Find script directory to source common.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "-1"
check_disk 1

echo "Checking Flutter..."
require_cmd flutter

FLUTTER_VERSION=$(flutter --version | head -n 1 | awk '{print $2}')
REQUIRED_FLUTTER="3.19.0"
# Simple version comparison
if [ "$(printf '%s\n' "$REQUIRED_FLUTTER" "$FLUTTER_VERSION" | sort -V | head -n1)" != "$REQUIRED_FLUTTER" ]; then
    echo "BLOCKER: Flutter version $FLUTTER_VERSION is below minimum $REQUIRED_FLUTTER"
    exit 1
fi
echo "OK: Flutter $FLUTTER_VERSION"

echo "Checking Node..."
if ! command -v node &> /dev/null; then
    echo "BLOCKER: Node not found"
    exit 1
fi
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    echo "BLOCKER: Node version $NODE_VERSION is below minimum $REQUIRED_NODE"
    exit 1
fi
echo "OK: Node $NODE_VERSION"

echo "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "BLOCKER: Supabase CLI not found"
    exit 1
fi
echo "OK: Supabase CLI found"

echo "Checking Supabase auth..."
if command -v supabase &> /dev/null; then
    if ! supabase projects list > /dev/null 2>&1; then
        echo "WARNING: Supabase CLI not authenticated or network issue."
        # Not blocking for environment validation necessarily, as CI might use local emulator
    else
        echo "OK: Supabase authenticated"
    fi
fi

echo "All tools validated successfully"
exit 0

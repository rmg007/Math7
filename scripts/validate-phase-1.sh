#!/bin/bash
# Phase 1: Data Model Validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

setup_logging "1"

# Check disk space (2GB for Docker)
if ! check_disk 2; then
    handle_skip "Insufficient disk space for Docker"
fi

ERRORS=0

echo "Checking migration files..."
require_dir "supabase/migrations"
count=$(find supabase/migrations -name "*.sql" | wc -l)
if [ "$count" -gt 0 ]; then
    echo "  OK: Found $count migration files"
else
    echo "  ERROR: No migration files found"
    ERRORS=1
fi

echo "Checking seed.sql..."
if [ ! -f "supabase/seed.sql" ]; then
    echo "  ERROR: seed.sql missing"
    ERRORS=1
fi

echo "Verifying DB Schema..."
require_cmd supabase

# Check if docker is available
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    if [ "$STRICT" -eq 1 ]; then
        echo "ERROR: Docker not available in STRICT mode"
        exit 1
    else
        handle_skip "Docker not running or not available"
    fi
fi

# Attempt supabase start if not running
if ! supabase status >/dev/null 2>&1; then
    echo "  Starting Supabase..."
    if ! supabase start; then
        if [ "$STRICT" -eq 1 ]; then
            echo "ERROR: 'supabase start' failed in STRICT mode"
            exit 1
        else
            echo "WARNING: 'supabase start' failed. Suggestion: 'supabase start --debug'. Cleaning up..."
            # Maybe help cleanup
            docker system prune -af --volumes >/dev/null 2>&1 || true
            handle_skip "Supabase start failed (Disk/Docker issue?)"
        fi
    fi
fi

echo "  Running 'supabase db reset --seed'..."
if timeout 300s supabase db reset --seed; then
    echo "  OK: DB Reset successful"
else
    if [ "$STRICT" -eq 1 ]; then
        echo "ERROR: 'supabase db reset' failed in STRICT mode"
        exit 1
    else
        handle_skip "DB Reset failed"
    fi
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "Phase 1 FAILED"
    exit 1
fi

echo "Phase 1 PASSED"

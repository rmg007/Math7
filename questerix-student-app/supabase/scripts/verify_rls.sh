#!/usr/bin/env bash
# =============================================================================
# RLS Verification Script
# =============================================================================
# This script verifies that Row Level Security policies are correctly configured
# on all tables. It runs against the local Supabase instance.
#
# Requirements:
#   - psql (PostgreSQL client)
#   - Local Supabase stack running (supabase start)
#
# Usage:
#   make db_verify_rls
#   # or directly:
#   bash supabase/scripts/verify_rls.sh
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}RLS Verification Script${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""

# Check for required dependencies
if ! command -v supabase >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Missing dependency: supabase CLI${NC}"
    echo "Install from: https://supabase.com/docs/guides/cli"
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Missing dependency: psql (PostgreSQL client)${NC}"
    echo "Install postgresql-client in your environment."
    echo "  Ubuntu/Debian: apt-get install postgresql-client"
    echo "  macOS: brew install libpq"
    exit 1
fi

# Default local Supabase connection (standard ports from supabase start)
DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

# Ensure local Supabase stack is running
echo "Checking Supabase status..."
if ! supabase status >/dev/null 2>&1; then
    echo -e "${YELLOW}Supabase not running. Starting...${NC}"
    supabase start >/dev/null
fi

echo -e "Connecting to: ${DB_URL}"
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the SQL verification script
echo "Running RLS verification queries..."
echo ""

psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/verify_rls.sql"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}RLS verification complete.${NC}"
echo -e "${GREEN}=========================================${NC}"

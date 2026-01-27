#!/bin/bash
# Phase 1: Data Model + Contracts Validation
# Validates Supabase schema and RLS policies

set -e

echo "========================================="
echo "Phase 1: Data Model Validation"
echo "========================================="

ERRORS=0

# Check migration files exist
echo ""
echo "Checking migration files..."
if [ -d "supabase/migrations" ]; then
  MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
  if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo "  OK: Found $MIGRATION_COUNT migration file(s)"
    ls -1 supabase/migrations/*.sql
  else
    echo "  ERROR: No migration files found in supabase/migrations/"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ERROR: supabase/migrations directory not found"
  ERRORS=$((ERRORS + 1))
fi

# Check seed file exists
echo ""
echo "Checking seed file..."
if [ -f "supabase/seed.sql" ]; then
  echo "  OK: seed.sql exists"
else
  echo "  WARNING: supabase/seed.sql not found (optional but recommended)"
fi

# Apply migrations (requires Supabase CLI and project link)
echo ""
echo "Testing database reset..."
echo "NOTE: This requires Supabase CLI to be linked to a project"
echo "Run manually: supabase db reset --seed"

# Verify required tables (manual check instruction)
echo ""
echo "Required tables to verify:"
echo "  - profiles"
echo "  - domains"
echo "  - skills"
echo "  - questions"
echo "  - attempts"
echo "  - sessions"
echo "  - outbox (optional, client-side)"
echo "  - sync_meta"
echo "  - curriculum_meta"

# Verify RLS policies
echo ""
echo "RLS Policies to verify:"
echo "  - profiles: Users read/update own, admins read all"
echo "  - domains/skills/questions: Admins full access, students read published"
echo "  - attempts: Students insert/read own, admins read all"
echo "  - sessions: Students CRUD own, admins read all"

# Check SCHEMA.md alignment
echo ""
echo "Checking SCHEMA.md..."
if [ -f "AppShell/docs/SCHEMA.md" ]; then
  echo "  OK: SCHEMA.md exists"
  
  # Check for required sections
  if grep -q "profiles" AppShell/docs/SCHEMA.md; then
    echo "  OK: profiles table documented"
  else
    echo "  ERROR: profiles table not documented in SCHEMA.md"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "outbox" AppShell/docs/SCHEMA.md; then
    echo "  OK: outbox table documented"
  else
    echo "  ERROR: outbox table not documented in SCHEMA.md"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ERROR: SCHEMA.md not found"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase 1 PRE-VALIDATION PASSED"
  echo "========================================="
  echo ""
  echo "NEXT STEPS (Manual):"
  echo "1. Run: supabase db reset --seed"
  echo "2. Verify tables in Supabase dashboard"
  echo "3. Test RLS policies with test queries"
  exit 0
else
  echo "Phase 1 FAILED: $ERRORS error(s)"
  echo "========================================="
  exit 1
fi

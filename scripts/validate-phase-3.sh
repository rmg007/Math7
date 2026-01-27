#!/bin/bash
# Phase 3: Admin Panel MVP Validation
# Validates React admin panel implementation

set -e

echo "========================================="
echo "Phase 3: Admin Panel Validation"
echo "========================================="

ERRORS=0
WARNINGS=0

# Navigate to admin-panel
if [ ! -d "admin-panel" ]; then
  echo "ERROR: admin-panel directory not found"
  exit 1
fi

cd admin-panel

# Check dependencies
echo ""
echo "Checking dependencies..."
if grep -q "@tanstack/react-query" package.json; then
  echo "  OK: @tanstack/react-query found"
else
  echo "  ERROR: @tanstack/react-query not in dependencies"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "@supabase/supabase-js" package.json; then
  echo "  OK: @supabase/supabase-js found"
else
  echo "  ERROR: @supabase/supabase-js not in dependencies"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "zod" package.json; then
  echo "  OK: zod found"
else
  echo "  WARNING: zod not in dependencies (recommended for validation)"
  WARNINGS=$((WARNINGS + 1))
fi

if grep -q "react-hook-form" package.json; then
  echo "  OK: react-hook-form found"
else
  echo "  WARNING: react-hook-form not in dependencies (recommended)"
  WARNINGS=$((WARNINGS + 1))
fi

# Check auth implementation
echo ""
echo "Checking auth implementation..."
if find src -name "*auth*" -type f | grep -q .; then
  echo "  OK: Auth files found"
else
  echo "  WARNING: No auth files found in src/"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for admin role verification
if grep -r "is_admin\|isAdmin\|role.*admin\|verifyAdmin" src/ > /dev/null 2>&1; then
  echo "  OK: Admin role check found"
else
  echo "  ERROR: No admin role verification found"
  ERRORS=$((ERRORS + 1))
fi

# Check hooks
echo ""
echo "Checking React Query hooks..."
ENTITIES=("domain" "skill" "question")
for entity in "${ENTITIES[@]}"; do
  if find src -name "*${entity}*" -type f | grep -q .; then
    echo "  OK: ${entity} hooks/components found"
  else
    echo "  WARNING: ${entity} hooks/components not found"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# Check publish functionality
echo ""
echo "Checking publish functionality..."
if grep -r "publish" src/ > /dev/null 2>&1; then
  echo "  OK: Publish functionality found"
else
  echo "  WARNING: No publish functionality found"
  WARNINGS=$((WARNINGS + 1))
fi

# Run npm build
echo ""
echo "Running npm run build..."
if npm run build; then
  echo "  OK: Build succeeded"
else
  echo "  ERROR: Build failed"
  ERRORS=$((ERRORS + 1))
fi

# Run npm lint
echo ""
echo "Running npm run lint..."
if npm run lint; then
  echo "  OK: Lint passed"
else
  echo "  WARNING: Lint failed or not configured"
  WARNINGS=$((WARNINGS + 1))
fi

# Run tests
echo ""
echo "Running npm test..."
if npm test -- --passWithNoTests 2>/dev/null || npm test 2>/dev/null; then
  echo "  OK: Tests passed"
else
  echo "  WARNING: Tests failed or not configured"
  WARNINGS=$((WARNINGS + 1))
fi

# Check .env.example
echo ""
echo "Checking environment configuration..."
if [ -f ".env.example" ]; then
  echo "  OK: .env.example exists"
  if grep -q "SUPABASE_URL\|VITE_SUPABASE_URL" .env.example; then
    echo "  OK: Supabase URL placeholder found"
  else
    echo "  WARNING: No Supabase URL in .env.example"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  ERROR: .env.example not found"
  ERRORS=$((ERRORS + 1))
fi

cd ..

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase 3 PASSED"
  if [ $WARNINGS -gt 0 ]; then
    echo "  ($WARNINGS warning(s))"
  fi
  echo "========================================="
  exit 0
else
  echo "Phase 3 FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo "========================================="
  exit 1
fi

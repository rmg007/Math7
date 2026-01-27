#!/bin/bash
# Phase -1: Environment Validation
# This script verifies all required tools are installed

set -e

echo "========================================="
echo "Phase -1: Environment Validation"
echo "========================================="

ERRORS=0

# Check Flutter
echo ""
echo "Checking Flutter..."
if command -v flutter &> /dev/null; then
  FLUTTER_VERSION=$(flutter --version 2>/dev/null | head -n 1 | awk '{print $2}')
  REQUIRED_FLUTTER="3.19.0"
  if [ "$(printf '%s\n' "$REQUIRED_FLUTTER" "$FLUTTER_VERSION" | sort -V | head -n1)" != "$REQUIRED_FLUTTER" ]; then
    echo "  ERROR: Flutter version $FLUTTER_VERSION is below minimum $REQUIRED_FLUTTER"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK: Flutter $FLUTTER_VERSION"
  fi
else
  echo "  ERROR: Flutter not found"
  ERRORS=$((ERRORS + 1))
fi

# Check Node
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version | cut -d'v' -f2)
  REQUIRED_NODE="18.0.0"
  if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    echo "  ERROR: Node version $NODE_VERSION is below minimum $REQUIRED_NODE"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK: Node $NODE_VERSION"
  fi
else
  echo "  ERROR: Node.js not found"
  ERRORS=$((ERRORS + 1))
fi

# Check npm
echo ""
echo "Checking npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "  OK: npm $NPM_VERSION"
else
  echo "  ERROR: npm not found"
  ERRORS=$((ERRORS + 1))
fi

# Check Supabase CLI
echo ""
echo "Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
  SUPABASE_VERSION=$(supabase --version 2>/dev/null | awk '{print $3}')
  REQUIRED_SUPABASE="1.123.0"
  if [ "$(printf '%s\n' "$REQUIRED_SUPABASE" "$SUPABASE_VERSION" | sort -V | head -n1)" != "$REQUIRED_SUPABASE" ]; then
    echo "  WARNING: Supabase CLI version $SUPABASE_VERSION may be below recommended $REQUIRED_SUPABASE"
  else
    echo "  OK: Supabase CLI $SUPABASE_VERSION"
  fi
  
  # Check Supabase auth
  echo ""
  echo "Checking Supabase authentication..."
  if supabase projects list > /dev/null 2>&1; then
    echo "  OK: Supabase CLI authenticated"
  else
    echo "  WARNING: Supabase CLI not authenticated. Run 'supabase login'"
  fi
else
  echo "  ERROR: Supabase CLI not found"
  ERRORS=$((ERRORS + 1))
fi

# Check Git
echo ""
echo "Checking Git..."
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version | awk '{print $3}')
  echo "  OK: Git $GIT_VERSION"
else
  echo "  ERROR: Git not found"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "Phase -1 PASSED: All tools validated"
  echo "========================================="
  exit 0
else
  echo "Phase -1 FAILED: $ERRORS error(s) found"
  echo "========================================="
  echo "BLOCKER: Fix the errors above before proceeding"
  exit 1
fi

#!/bin/bash
# check-smoke-manifest.sh
set -e

# Path to manifest
MANIFEST="admin-panel/tests/smoke-coverage-manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "❌ Manifest not found at $MANIFEST"
  exit 1
fi

VIOLATIONS=0
# Find all page files in admin-panel/src/features/*/pages/
# Exclude test files (*.test.tsx, *.spec.tsx, and __tests__ directories)
PAGE_FILES=$(find admin-panel/src/features -type d -name "pages" -exec find {} -type f \( -name "*.tsx" -o -name "*.ts" \) ! -name "*.test.tsx" ! -name "*.spec.tsx" ! -path "*/__tests__/*" \;)

for FILE in $PAGE_FILES; do
  # Windows paths vs Unix paths fix: ensure forward slashes
  FILE_NATIVE=$(echo "$FILE" | sed 's|\\|/|g')
  
  # Search for the exact file path inside the JSON manifest
  if ! grep -q "\"$FILE_NATIVE\"" "$MANIFEST"; then
    echo "❌ Missing smoke test coverage in manifest for page: $FILE_NATIVE"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "❌ Found $VIOLATIONS page(s) missing from $MANIFEST."
  echo "   All UI pages must be mapped to a smoke test."
  exit 1
fi

echo "✅ All UI pages are correctly tracked in $MANIFEST."

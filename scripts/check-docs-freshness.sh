#!/bin/bash
# Lightweight docs freshness check
set -euo pipefail

echo "Checking docs freshness..."

# Files that should exist (referenced in docs)
files_to_check=(
    "Makefile"
    ".github/workflows/ci.yml"
    ".github/workflows/validate.yml"
    "scripts/validate-phase-0.sh"
    "scripts/validate-phase-1.sh"
    "scripts/validate-phase-2.sh"
    "scripts/validate-phase-3.sh"
    "scripts/validate-phase-4.sh"
    "scripts/common.sh"
    "admin-panel/package.json"
    "student-app/pubspec.yaml"
    "supabase/scripts/verify_rls.sh"
    "supabase/scripts/verify_rls.sql"
    "docs/DEVELOPMENT.md"
    "docs/CI_CONTRACT.md"
    "docs/VALIDATION.md"
    "AI_CODING_INSTRUCTIONS.md"
    ".github/copilot-instructions.md"
)

missing=()
for f in "${files_to_check[@]}"; do
    if [ ! -f "$f" ]; then
        missing+=("$f")
    fi
done

if [ "${#missing[@]}" -gt 0 ]; then
    echo "ERROR: Referenced files missing:"
    printf '  %s\n' "${missing[@]}"
    exit 1
fi

# Check that Makefile targets referenced in docs exist
make_targets=("web_setup" "web_dev" "web_lint" "web_test" "web_build" "flutter_setup" "flutter_gen" "flutter_analyze" "flutter_test" "flutter_run_web" "db_start" "db_stop" "db_migrate" "db_reset" "db_verify_rls" "ci")
missing_targets=()
for target in "${make_targets[@]}"; do
    if ! grep -q "^\.PHONY: $target" Makefile; then
        missing_targets+=("$target")
    fi
done

if [ "${#missing_targets[@]}" -gt 0 ]; then
    echo "ERROR: Referenced Makefile targets missing:"
    printf '  %s\n' "${missing_targets[@]}"
    exit 1
fi

echo "Docs freshness check passed"

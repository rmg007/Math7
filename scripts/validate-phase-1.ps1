# Phase 1: Data Model + Contracts Validation (PowerShell)
# Validates Supabase schema and RLS policies

$ErrorActionPreference = "Continue"
$errors = 0

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 1: Data Model Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Check migration files exist
Write-Host ""
Write-Host "Checking migration files..."
if (Test-Path "supabase/migrations") {
    $migrations = Get-ChildItem "supabase/migrations/*.sql" -ErrorAction SilentlyContinue
    if ($migrations) {
        Write-Host "  OK: Found $($migrations.Count) migration file(s)" -ForegroundColor Green
        $migrations | ForEach-Object { Write-Host "    - $($_.Name)" }
    } else {
        Write-Host "  ERROR: No migration files found in supabase/migrations/" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ERROR: supabase/migrations directory not found" -ForegroundColor Red
    $errors++
}

# Check seed file exists
Write-Host ""
Write-Host "Checking seed file..."
if (Test-Path "supabase/seed.sql") {
    Write-Host "  OK: seed.sql exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: supabase/seed.sql not found (required for Phase 1)" -ForegroundColor Red
    $errors++
}

# Apply migrations info
Write-Host ""
Write-Host "Testing database reset..."
Write-Host "NOTE: This requires Supabase CLI to be linked to a project" -ForegroundColor Yellow
Write-Host "Run manually: supabase db reset --seed"

# Required tables
Write-Host ""
Write-Host "Required tables to verify:"
Write-Host "  - profiles"
Write-Host "  - domains"
Write-Host "  - skills"
Write-Host "  - questions"
Write-Host "  - attempts"
Write-Host "  - sessions"
Write-Host "  - outbox (optional, client-side)"
Write-Host "  - sync_meta"
Write-Host "  - curriculum_meta"

# RLS policies
Write-Host ""
Write-Host "RLS Policies to verify:"
Write-Host "  - profiles: Users read/update own, admins read all"
Write-Host "  - domains/skills/questions: Admins full access, students read published"
Write-Host "  - attempts: Students insert/read own, admins read all"
Write-Host "  - sessions: Students CRUD own, admins read all"

# Check SCHEMA.md alignment
Write-Host ""
Write-Host "Checking SCHEMA.md..."
if (Test-Path "AppShell/docs/SCHEMA.md") {
    Write-Host "  OK: SCHEMA.md exists" -ForegroundColor Green
    
    $schemaContent = Get-Content "AppShell/docs/SCHEMA.md" -Raw
    
    if ($schemaContent -match "profiles") {
        Write-Host "  OK: profiles table documented" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: profiles table not documented in SCHEMA.md" -ForegroundColor Red
        $errors++
    }
    
    if ($schemaContent -match "outbox") {
        Write-Host "  OK: outbox table documented" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: outbox table not documented in SCHEMA.md" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ERROR: SCHEMA.md not found" -ForegroundColor Red
    $errors++
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase 1 PRE-VALIDATION PASSED" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NEXT STEPS (Manual):" -ForegroundColor Yellow
    Write-Host "1. Run: supabase db reset --seed"
    Write-Host "2. Verify tables in Supabase dashboard"
    Write-Host "3. Test RLS policies with test queries"
    exit 0
} else {
    Write-Host "Phase 1 FAILED: $errors error(s)" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 1
}

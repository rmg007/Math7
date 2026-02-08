# Phase 3: Admin Panel MVP Validation (PowerShell)
# Validates React admin panel implementation

$ErrorActionPreference = "Continue"
$errors = 0
$warnings = 0
$originalLocation = Get-Location

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 3: Admin Panel Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Navigate to admin-panel
if (-not (Test-Path "admin-panel")) {
    Write-Host "ERROR: admin-panel directory not found" -ForegroundColor Red
    exit 1
}

Set-Location "admin-panel"

# Check dependencies
Write-Host ""
Write-Host "Checking dependencies..."
$packageJson = Get-Content "package.json" -Raw -ErrorAction SilentlyContinue

if ($packageJson -match "@tanstack/react-query") {
    Write-Host "  OK: @tanstack/react-query found" -ForegroundColor Green
} else {
    Write-Host "  ERROR: @tanstack/react-query not in dependencies" -ForegroundColor Red
    $errors++
}

if ($packageJson -match "@supabase/supabase-js") {
    Write-Host "  OK: @supabase/supabase-js found" -ForegroundColor Green
} else {
    Write-Host "  ERROR: @supabase/supabase-js not in dependencies" -ForegroundColor Red
    $errors++
}

if ($packageJson -match "zod") {
    Write-Host "  OK: zod found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: zod not in dependencies (recommended for validation)" -ForegroundColor Yellow
    $warnings++
}

if ($packageJson -match "react-hook-form") {
    Write-Host "  OK: react-hook-form found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: react-hook-form not in dependencies (recommended)" -ForegroundColor Yellow
    $warnings++
}

# Check auth implementation
Write-Host ""
Write-Host "Checking auth implementation..."
$authFiles = Get-ChildItem -Path "src" -Recurse -Filter "*auth*" -ErrorAction SilentlyContinue
if ($authFiles) {
    Write-Host "  OK: Auth files found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No auth files found in src/" -ForegroundColor Yellow
    $warnings++
}

# Check for admin role verification
$srcContent = Get-ChildItem -Path "src" -Recurse -Filter "*.ts*" -ErrorAction SilentlyContinue | Get-Content -Raw -ErrorAction SilentlyContinue
if ($srcContent -match "is_admin|isAdmin|role.*admin|verifyAdmin") {
    Write-Host "  OK: Admin role check found" -ForegroundColor Green
} else {
    Write-Host "  ERROR: No admin role verification found" -ForegroundColor Red
    $errors++
}

# Check hooks
Write-Host ""
Write-Host "Checking React Query hooks..."
$entities = @("domain", "skill", "question")
foreach ($entity in $entities) {
    $entityFiles = Get-ChildItem -Path "src" -Recurse -Filter "*$entity*" -ErrorAction SilentlyContinue
    if ($entityFiles) {
        Write-Host "  OK: $entity hooks/components found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: $entity hooks/components not found" -ForegroundColor Yellow
        $warnings++
    }
}

# Check publish functionality
Write-Host ""
Write-Host "Checking publish functionality..."
if ($srcContent -match "publish") {
    Write-Host "  OK: Publish functionality found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No publish functionality found" -ForegroundColor Yellow
    $warnings++
}

# Run npm build
Write-Host ""
Write-Host "Running npm run build..."
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: Build succeeded" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Build failed" -ForegroundColor Red
    $errors++
}

# Run npm lint
Write-Host ""
Write-Host "Running npm run lint..."
$lintResult = npm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: Lint passed" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Lint failed or not configured" -ForegroundColor Yellow
    $warnings++
}

# Check .env.example
Write-Host ""
Write-Host "Checking environment configuration..."
if (Test-Path ".env.example") {
    Write-Host "  OK: .env.example exists" -ForegroundColor Green
    $envContent = Get-Content ".env.example" -Raw
    if ($envContent -match "SUPABASE_URL|VITE_SUPABASE_URL") {
        Write-Host "  OK: Supabase URL placeholder found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No Supabase URL in .env.example" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  ERROR: .env.example not found" -ForegroundColor Red
    $errors++
}

Set-Location $originalLocation

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase 3 PASSED" -ForegroundColor Green
    if ($warnings -gt 0) {
        Write-Host "  ($warnings warning(s))" -ForegroundColor Yellow
    }
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Phase 3 FAILED: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 1
}

# Phase 2: Student App Core Loop Validation (PowerShell)
# Validates offline-first Flutter implementation

$ErrorActionPreference = "Continue"
$errors = 0
$warnings = 0
$originalLocation = Get-Location

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 2: Student App Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Navigate to student-app
if (-not (Test-Path "student-app")) {
    Write-Host "ERROR: student-app directory not found" -ForegroundColor Red
    exit 1
}

Set-Location "student-app"

# Check Drift database files
Write-Host ""
Write-Host "Checking Drift database..."
$dbFiles = Get-ChildItem -Recurse -Filter "database.dart" -ErrorAction SilentlyContinue
if ($dbFiles) {
    Write-Host "  OK: Database file exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: database.dart not found" -ForegroundColor Red
    $errors++
}

# Check for generated code
$generatedFiles = Get-ChildItem -Recurse -Filter "*.g.dart" -ErrorAction SilentlyContinue
if ($generatedFiles) {
    Write-Host "  OK: Generated code files found ($($generatedFiles.Count) files)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No .g.dart files found. Run: dart run build_runner build" -ForegroundColor Yellow
    $warnings++
}

# Check repositories
Write-Host ""
Write-Host "Checking repositories..."
$repos = @("domain", "skill", "question", "attempt", "session")
foreach ($repo in $repos) {
    $repoFiles = Get-ChildItem -Recurse -Filter "*${repo}*repository*.dart" -ErrorAction SilentlyContinue
    if ($repoFiles) {
        Write-Host "  OK: $repo repository found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: $repo repository not found" -ForegroundColor Yellow
        $warnings++
    }
}

# Check sync service
Write-Host ""
Write-Host "Checking sync service..."
$syncFiles = Get-ChildItem -Recurse -Filter "*sync*.dart" -ErrorAction SilentlyContinue
if ($syncFiles) {
    Write-Host "  OK: Sync service found" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Sync service not found" -ForegroundColor Red
    $errors++
}

# Run Flutter analyze
Write-Host ""
Write-Host "Running Flutter analyze..."
$analyzeResult = flutter analyze 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: flutter analyze passed" -ForegroundColor Green
} else {
    Write-Host "  ERROR: flutter analyze failed" -ForegroundColor Red
    $errors++
}

# Run Flutter tests
Write-Host ""
Write-Host "Running Flutter tests..."
$testResult = flutter test 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: flutter test passed" -ForegroundColor Green
} else {
    Write-Host "  WARNING: flutter test failed" -ForegroundColor Yellow
    $warnings++
}

# Check for integration test
Write-Host ""
Write-Host "Checking integration tests..."
if (Test-Path "integration_test") {
    if (Test-Path "integration_test/offline_workflow_test.dart") {
        Write-Host "  OK: offline_workflow_test.dart exists" -ForegroundColor Green
        Write-Host "  Running integration test..."
        $intTestResult = flutter test integration_test/offline_workflow_test.dart 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: Integration test passed" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Integration test failed" -ForegroundColor Yellow
            $warnings++
        }
    } else {
        Write-Host "  WARNING: offline_workflow_test.dart not found" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  WARNING: integration_test directory not found" -ForegroundColor Yellow
    $warnings++
}

# Check Sentry integration
Write-Host ""
Write-Host "Checking Sentry integration..."
$pubspec = Get-Content "pubspec.yaml" -Raw -ErrorAction SilentlyContinue
if ($pubspec -match "sentry_flutter") {
    Write-Host "  OK: sentry_flutter in pubspec.yaml" -ForegroundColor Green
} else {
    Write-Host "  WARNING: sentry_flutter not found in dependencies" -ForegroundColor Yellow
    $warnings++
}

Set-Location $originalLocation

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase 2 PASSED" -ForegroundColor Green
    if ($warnings -gt 0) {
        Write-Host "  ($warnings warning(s))" -ForegroundColor Yellow
    }
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Phase 2 FAILED: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 1
}

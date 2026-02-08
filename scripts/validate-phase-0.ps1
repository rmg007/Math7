# Phase 0: Project Bootstrap Validation (PowerShell)
# Validates Flutter and React apps are properly initialized

$ErrorActionPreference = "Continue"
$errors = 0
$warnings = 0
$originalLocation = Get-Location

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 0: Project Bootstrap Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Check student-app exists
Write-Host ""
Write-Host "Checking Flutter Student App..."
if (Test-Path "student-app") {
    Write-Host "  Directory exists"
    
    Set-Location "student-app"
    
    # Check pubspec.yaml
    if (Test-Path "pubspec.yaml") {
        Write-Host "  OK: pubspec.yaml exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: pubspec.yaml not found" -ForegroundColor Red
        $errors++
    }
    
    # Run flutter analyze
    Write-Host "  Running flutter analyze..."
    $analyzeResult = flutter analyze 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: flutter analyze passed" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: flutter analyze failed" -ForegroundColor Red
        Write-Host $analyzeResult
        $errors++
    }
    
    # Run flutter test
    Write-Host "  Running flutter test..."
    $testResult = flutter test 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: flutter test passed" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: flutter test failed or no tests" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check .env.example
    if (Test-Path ".env.example") {
        Write-Host "  OK: .env.example exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: .env.example not found" -ForegroundColor Red
        $errors++
    }
    
    Set-Location $originalLocation
} else {
    Write-Host "  ERROR: student-app directory not found" -ForegroundColor Red
    $errors++
}

# Check admin-panel exists
Write-Host ""
Write-Host "Checking React Admin Panel..."
if (Test-Path "admin-panel") {
    Write-Host "  Directory exists"
    
    Set-Location "admin-panel"
    
    # Check package.json
    if (Test-Path "package.json") {
        Write-Host "  OK: package.json exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: package.json not found" -ForegroundColor Red
        $errors++
    }
    
    # Run npm build
    Write-Host "  Running npm run build..."
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: npm run build succeeded" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: npm run build failed" -ForegroundColor Red
        $errors++
    }
    
    # Run npm lint
    Write-Host "  Running npm run lint..."
    $lintResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: npm run lint passed" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: npm run lint failed or not configured" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check .env.example
    if (Test-Path ".env.example") {
        Write-Host "  OK: .env.example exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: .env.example not found" -ForegroundColor Red
        $errors++
    }
    
    Set-Location $originalLocation
} else {
    Write-Host "  ERROR: admin-panel directory not found" -ForegroundColor Red
    $errors++
}

# Check PHASE_STATE.json
Write-Host ""
Write-Host "Checking project files..."
if (Test-Path "PHASE_STATE.json") {
    Write-Host "  OK: PHASE_STATE.json exists" -ForegroundColor Green
    try {
        $null = Get-Content "PHASE_STATE.json" | ConvertFrom-Json
        Write-Host "  OK: PHASE_STATE.json is valid JSON" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: PHASE_STATE.json is not valid JSON" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ERROR: PHASE_STATE.json not found" -ForegroundColor Red
    $errors++
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase 0 PASSED" -ForegroundColor Green
    if ($warnings -gt 0) {
        Write-Host "  ($warnings warning(s))" -ForegroundColor Yellow
    }
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Phase 0 FAILED: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 1
}

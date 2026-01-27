# Phase 4: Hardening Validation (PowerShell)
# Validates error handling, observability, and CI/CD

$ErrorActionPreference = "Continue"
$errors = 0
$warnings = 0
$originalLocation = Get-Location

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 4: Hardening Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Check Flutter student app hardening
Write-Host ""
Write-Host "Validating Flutter Student App..."
if (Test-Path "student-app") {
    Set-Location "student-app"
    
    # Check Sentry
    Write-Host "  Checking Sentry integration..."
    $libContent = Get-ChildItem -Path "lib" -Recurse -Filter "*.dart" -ErrorAction SilentlyContinue | Get-Content -Raw -ErrorAction SilentlyContinue
    if ($libContent -match "SentryFlutter|sentry_flutter") {
        Write-Host "  OK: Sentry initialization found" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Sentry not initialized in Flutter app" -ForegroundColor Red
        $errors++
    }
    
    # Check typed errors
    Write-Host "  Checking typed errors..."
    $errorFiles = Get-ChildItem -Path "lib" -Recurse -Filter "*error*" -ErrorAction SilentlyContinue
    if ($errorFiles) {
        Write-Host "  OK: Error handling files found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No dedicated error handling files" -ForegroundColor Yellow
        $warnings++
    }
    
    # Run production build
    Write-Host "  Building release APK..."
    $buildResult = flutter build apk --release 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: Release APK built successfully" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Release APK build failed" -ForegroundColor Red
        $errors++
    }
    
    Set-Location $originalLocation
} else {
    Write-Host "  ERROR: student-app not found" -ForegroundColor Red
    $errors++
}

# Check React admin panel hardening
Write-Host ""
Write-Host "Validating React Admin Panel..."
if (Test-Path "admin-panel") {
    Set-Location "admin-panel"
    
    # Check Sentry
    Write-Host "  Checking Sentry integration..."
    $srcContent = Get-ChildItem -Path "src" -Recurse -Filter "*.ts*" -ErrorAction SilentlyContinue | Get-Content -Raw -ErrorAction SilentlyContinue
    if ($srcContent -match "@sentry/react|Sentry.init") {
        Write-Host "  OK: Sentry initialization found" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Sentry not initialized in React app" -ForegroundColor Red
        $errors++
    }
    
    # Check error boundaries
    Write-Host "  Checking error boundaries..."
    if ($srcContent -match "ErrorBoundary") {
        Write-Host "  OK: Error boundaries found" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No error boundaries found" -ForegroundColor Yellow
        $warnings++
    }
    
    # Production build
    Write-Host "  Building production..."
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: Production build succeeded" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Production build failed" -ForegroundColor Red
        $errors++
    }
    
    Set-Location $originalLocation
} else {
    Write-Host "  ERROR: admin-panel not found" -ForegroundColor Red
    $errors++
}

# Check CI/CD configuration
Write-Host ""
Write-Host "Checking CI/CD configuration..."
$ciFile = Get-ChildItem -Path ".github/workflows" -Filter "ci.*" -ErrorAction SilentlyContinue
if ($ciFile) {
    Write-Host "  OK: CI workflow found" -ForegroundColor Green
    
    $ciContent = Get-Content $ciFile.FullName -Raw
    
    if ($ciContent -match "lint") {
        Write-Host "  OK: Lint step in CI" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No lint step in CI workflow" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($ciContent -match "test") {
        Write-Host "  OK: Test step in CI" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No test step in CI workflow" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  WARNING: CI workflow not found at .github/workflows/ci.yml" -ForegroundColor Yellow
    $warnings++
}

# Check for retry logic
Write-Host ""
Write-Host "Checking retry/backoff logic..."
if (Test-Path "student-app/lib") {
    $studentLibContent = Get-ChildItem -Path "student-app/lib" -Recurse -Filter "*.dart" -ErrorAction SilentlyContinue | Get-Content -Raw -ErrorAction SilentlyContinue
    if ($studentLibContent -match "exponential|backoff|retry") {
        Write-Host "  OK: Retry logic found in student app" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No retry logic found in student app" -ForegroundColor Yellow
        $warnings++
    }
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase 4 PASSED" -ForegroundColor Green
    if ($warnings -gt 0) {
        Write-Host "  ($warnings warning(s))" -ForegroundColor Yellow
    }
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Final Checklist:" -ForegroundColor Yellow
    Write-Host "  [ ] Sentry DSN configured in production"
    Write-Host "  [ ] All tests passing"
    Write-Host "  [ ] No lint warnings"
    Write-Host "  [ ] Documentation complete"
    exit 0
} else {
    Write-Host "Phase 4 FAILED: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 1
}

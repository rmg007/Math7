<#
.SYNOPSIS
    Production Smoke Test Gate for Questerix.
.DESCRIPTION
    Runs Playwright @smoke tagged tests against the live deployment URL.
    Includes a safety audit to ensure no @mutating tests are tagged @smoke.
.PARAMETER Target
    Which app to smoke test: 'admin-panel', 'questerix-student-app', or 'all' (default)
.PARAMETER Url
    The live URL to test against.
.EXAMPLE
    ./scripts/smoke-gate.ps1 -Target admin-panel -Url https://admin.questerix.com
#>
 
param(
    [ValidateSet('admin-panel', 'questerix-student-app', 'all')]
    [string]$Target = 'all',
    
    [string]$Url
)
 
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
 
# 1. Safety Audit: Ensure @smoke tests are strictly read-only
Write-Host '🔍 Running safety audit on @smoke tests...' -ForegroundColor Cyan
 
# Grep for cases where @smoke and @mutating are in the same file
$Violations = 0
 
if ($Target -eq 'all' -or $Target -eq 'admin-panel') {
    $AdminTestsDir = Join-Path $ProjectRoot "admin-panel/tests"
    if (Test-Path $AdminTestsDir) {
        $SmokeFiles = Get-ChildItem -Path $AdminTestsDir -Filter *.spec.ts -Recurse | Select-String -Pattern "@smoke" | Select-Object -ExpandProperty Path -Unique
        foreach ($file in $SmokeFiles) {
            $content = Get-Content $file -Raw
            if ($content -match '@mutating' -or $file -match 'mutating') {
                Write-Host "❌ SAFETY VIOLATION: File $file contains `@mutating tag or is in a mutating/ directory!" -ForegroundColor Red
                $Violations++
            }
        }
    }
}
 
if ($Violations -gt 0) {
    Write-Host '❌ Safety audit failed. Aborting smoke tests for production safety.' -ForegroundColor Red
    exit 1
}
 
Write-Host '✅ Safety audit passed. No @mutating tests tagged @smoke.' -ForegroundColor Green
 
# 2. Run Smoke Tests
Write-Host "🚀 Running smoke tests for target: $Target" -ForegroundColor Cyan
 
if ($Url) {
    # Set BASE_URL for Playwright
    $env:BASE_URL = $Url
    Write-Host "Testing against URL: $Url" -ForegroundColor Gray
}
 
# Target-Aware Execution
if ($Target -eq 'all' -or $Target -eq 'admin-panel') {
    $AdminDir = Join-Path $ProjectRoot "admin-panel"
    if (Test-Path $AdminDir) {
        Write-Host 'Running Admin Panel smoke tests...' -ForegroundColor Cyan
        Push-Location $AdminDir
        try {
            npx playwright test --grep '@smoke' --project=desktop --reporter=list
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        } finally {
            Pop-Location
        }
    }
}
 
# questerix-student-app is a sibling
if ($Target -eq 'all' -or $Target -eq 'questerix-student-app') {
    $AdminDir = Join-Path $ProjectRoot "admin-panel"
    if (Test-Path $AdminDir) {
        Write-Host 'Running Student App smoke tests via Playwright (student-smoke config)...' -ForegroundColor Cyan
        Push-Location $AdminDir
        try {
            # Use specific student-app-smoke file and optimized config
            npx playwright test tests/student-app-smoke.spec.ts -c playwright.student-smoke.config.ts --reporter=list
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        } finally {
            Pop-Location
        }
    }
}
 
Write-Host '✨ All smoke tests passed!' -ForegroundColor Green
exit 0

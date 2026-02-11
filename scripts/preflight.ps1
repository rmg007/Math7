# preflight.ps1 - Parallel Validation Suite
# Runs type checks, linting, and dependency validation in parallel to save time.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/preflight"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "`n⚡ Starting Preflight Validation Suite..." -ForegroundColor Cyan

$jobs = @()

# 1. Admin Panel Typecheck
$jobs += Start-Job -Name "admin-typecheck" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npx tsc --noEmit 2>&1 | Out-File "$root/.agent/logs/preflight/admin-typecheck.log"
    return ($LastExitCode -eq 0)
} -ArgumentList $PSScriptRoot/..

# 2. Admin Panel Linting
$jobs += Start-Job -Name "admin-lint" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npm run lint 2>&1 | Out-File "$root/.agent/logs/preflight/admin-lint.log"
    return ($LastExitCode -eq 0)
} -ArgumentList $PSScriptRoot/..

# 3. Student App Static Analysis
$jobs += Start-Job -Name "student-analyze" -ScriptBlock {
    param($root)
    if (Test-Path "$root/student-app") {
        Set-Location "$root/student-app"
        flutter analyze 2>&1 | Out-File "$root/.agent/logs/preflight/student-analyze.log"
        return ($LastExitCode -eq 0)
    }
    return $true # Skip if student-app not present
} -ArgumentList $PSScriptRoot/..

# 4. Dependency Validation
$jobs += Start-Job -Name "deps-validate" -ScriptBlock {
    param($root)
    Set-Location $root
    npm run deps:validate 2>&1 | Out-File "$root/.agent/logs/preflight/deps-validate.log"
    return ($LastExitCode -eq 0)
} -ArgumentList $PSScriptRoot/..

Write-Host "⏳ Waiting for jobs to complete..." -ForegroundColor Yellow

$results = Wait-Job $jobs | Receive-Job

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n📋 Preflight Results (Duration: $($duration.TotalSeconds.ToString("F1"))s):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
$index = 0
foreach ($job in $jobs) {
    $status = if ($results[$index]) { 
        Write-Host "[✓] PASS: $($job.Name)" -ForegroundColor Green
    } else { 
        Write-Host "[✗] FAIL: $($job.Name) - See $logDir/$($job.Name).log" -ForegroundColor Red
        $failCount++
    }
    $index++
}

Remove-Job $jobs

if ($failCount -gt 0) {
    Write-Host "`n🚨 Preflight FAILED with $failCount error(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✨ Preflight PASSED!" -ForegroundColor Green
    exit 0
}

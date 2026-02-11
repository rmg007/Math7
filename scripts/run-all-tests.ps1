# run-all-tests.ps1 - Fast Parallel Test Execution
# Spawns all test suites in parallel and produces a unified summary.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/tests"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "🧪 Starting Full Test Suite Execution..." -ForegroundColor Cyan

$rootPath = Resolve-Path "$PSScriptRoot/.."
$jobs = @()

# 1. Admin Panel Tests
$jobs += Start-Job -Name "admin-tests" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npm run test -- --coverage 2>&1 | Out-File "$root/.agent/logs/tests/admin-tests.log"
} -ArgumentList $rootPath

# 2. Student App Tests
$jobs += Start-Job -Name "student-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/student-app") {
        Set-Location "$root/student-app"
        flutter test --coverage 2>&1 | Out-File "$root/.agent/logs/tests/student-tests.log"
    }
} -ArgumentList $rootPath

# 3. Content Engine Tests
$jobs += Start-Job -Name "content-engine-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/content-engine") {
        Set-Location "$root/content-engine"
        if (Get-Command "coverage" -ErrorAction SilentlyContinue) {
            coverage run -m pytest -q 2>&1 | Out-File "$root/.agent/logs/tests/content-engine-tests.log"
        } else {
            pytest -q 2>&1 | Out-File "$root/.agent/logs/tests/content-engine-tests.log"
        }
    }
} -ArgumentList $rootPath

# 4. Supabase Functions Tests
$jobs += Start-Job -Name "supabase-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/supabase/functions") {
        Set-Location "$root/supabase/functions"
        deno test --allow-all 2>&1 | Out-File "$root/.agent/logs/tests/supabase-tests.log"
    }
} -ArgumentList $rootPath

Write-Host "⏳ Waiting for test suites to complete..." -ForegroundColor Yellow
$jobs | Wait-Job | Out-Null

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n📋 Test Execution Summary (Duration: $($duration.TotalMinutes.ToString("F1"))m):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
foreach ($job in $jobs) {
    if ($job.ChildJobs[0].ExitCode -eq 0) {
        Write-Host "[✓] PASS: $($job.Name)" -ForegroundColor Green
    } else {
        Write-Host "[✗] FAIL: $($job.Name) - See $logDir/$($job.Name).log" -ForegroundColor Red
        $failCount++
    }
}

Remove-Job $jobs

if ($failCount -gt 0) {
    Write-Host "`n🚨 Testing completed with $failCount failure(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✨ All test suites PASSED!" -ForegroundColor Green
    exit 0
}

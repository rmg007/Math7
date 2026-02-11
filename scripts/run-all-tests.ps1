# run-all-tests.ps1 - Fast Parallel Test Execution
# Spawns all test suites in parallel and produces a unified summary.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/tests"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "`n🧪 Starting Full Test Suite Execution..." -ForegroundColor Cyan

$jobs = @()

# 1. Admin Panel Tests
$jobs += Start-Job -Name "admin-tests" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npm run test -- --coverage 2>&1 | Out-File "$root/.agent/logs/tests/admin-tests.log"
    return ($LastExitCode -eq 0)
} -ArgumentList $PSScriptRoot/..

# 2. Student App Tests
$jobs += Start-Job -Name "student-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/student-app") {
        Set-Location "$root/student-app"
        flutter test --coverage 2>&1 | Out-File "$root/.agent/logs/tests/student-tests.log"
        return ($LastExitCode -eq 0)
    }
    return $true
} -ArgumentList $PSScriptRoot/..

# 3. Content Engine Tests
$jobs += Start-Job -Name "content-engine-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/content-engine") {
        Set-Location "$root/content-engine"
        # Check if pytest and coverage are available
        if (Get-Command "coverage" -ErrorAction SilentlyContinue) {
            coverage run -m pytest -q 2>&1 | Out-File "$root/.agent/logs/tests/content-engine-tests.log"
            return ($LastExitCode -eq 0)
        } else {
            pytest -q 2>&1 | Out-File "$root/.agent/logs/tests/content-engine-tests.log"
            return ($LastExitCode -eq 0)
        }
    }
    return $true
} -ArgumentList $PSScriptRoot/..

# 4. Supabase Functions Tests
$jobs += Start-Job -Name "supabase-tests" -ScriptBlock {
    param($root)
    if (Test-Path "$root/supabase/functions") {
        Set-Location "$root/supabase/functions"
        # Run all test files found in functions
        deno test --allow-all 2>&1 | Out-File "$root/.agent/logs/tests/supabase-tests.log"
        return ($LastExitCode -eq 0)
    }
    return $true
} -ArgumentList $PSScriptRoot/..

Write-Host "⏳ Waiting for test suites to complete (this may take several minutes)..." -ForegroundColor Yellow

# Use a loop to show progress every 30s
while ($jobs.State -match "Running") {
    Start-Sleep -Seconds 30
    Write-Host "..." -NoNewline
}
Write-Host " Done."

$results = Receive-Job $jobs

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n📋 Test Execution Summary (Duration: $($duration.TotalMinutes.ToString("F1"))m):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
$index = 0
foreach ($job in $jobs) {
    if ($results[$index]) { 
        Write-Host "[✓] PASS: $($job.Name)" -ForegroundColor Green
    } else { 
        Write-Host "[✗] FAIL: $($job.Name) - See $logDir/$($job.Name).log" -ForegroundColor Red
        $failCount++
    }
    $index++
}

Remove-Job $jobs

if ($failCount -gt 0) {
    Write-Host "`n🚨 Testing completed with $failCount failure(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✨ All test suites PASSED!" -ForegroundColor Green
    exit 0
}

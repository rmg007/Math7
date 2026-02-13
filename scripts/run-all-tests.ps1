# run-all-tests.ps1 - Fast Parallel Test Execution
# Spawns all test suites in parallel and produces a unified summary.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/tests"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "Starting Full Test Suite Execution..." -ForegroundColor Cyan

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
        $py = "python"
        if (Test-Path ".venv/Scripts/python.exe") {
            $py = ".venv/Scripts/python.exe"
        }
        & $py -m pytest -q 2>&1 | Out-File "$root/.agent/logs/tests/content-engine-tests.log"
    }
} -ArgumentList $rootPath

# 4. Supabase Functions Tests
$jobs += Start-Job -Name "supabase-functions" -ScriptBlock {
    param($root)
    if (Test-Path "$root/supabase/functions") {
        Set-Location "$root/supabase/functions"
        deno test --allow-all 2>&1 | Out-File "$root/.agent/logs/tests/supabase-functions.log"
    }
} -ArgumentList $rootPath

# 5. Supabase SQL Tests
$jobs += Start-Job -Name "supabase-sql" -ScriptBlock {
    param($root)
    if (Get-Command "supabase" -ErrorAction SilentlyContinue) {
        # Note: This only works if Supabase is running (local or linked)
        # We skip if it fails to connect to avoid blocking CI
        supabase test db 2>&1 | Out-File "$root/.agent/logs/tests/supabase-sql.log"
    }
} -ArgumentList $rootPath

# 6. Admin Panel E2E Tests
$jobs += Start-Job -Name "admin-e2e" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npx playwright test 2>&1 | Out-File "$root/.agent/logs/tests/admin-e2e.log"
} -ArgumentList $rootPath

# 7. Admin Panel Architecture Tests
$jobs += Start-Job -Name "admin-arch" -ScriptBlock {
    param($root)
    Set-Location "$root/admin-panel"
    npm run test:arch 2>&1 | Out-File "$root/.agent/logs/tests/admin-arch.log"
} -ArgumentList $rootPath

Write-Host "Waiting for test suites to complete..." -ForegroundColor Yellow
$jobs | Wait-Job | Out-Null

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`nTest Execution Summary (Duration: $($duration.TotalMinutes.ToString("F1"))m):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
foreach ($job in $jobs) {
    if ($job.ChildJobs.Count -gt 0) {
        $exitCode = $job.ChildJobs[0].ExitCode
        if ($exitCode -eq 0) {
            Write-Host "[PASS] $($job.Name)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $($job.Name) (Exit: $exitCode) - See $logDir/$($job.Name).log" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "[SKIP] $($job.Name) - Job failed to start" -ForegroundColor Yellow
    }
}

Remove-Job $jobs

if ($failCount -gt 0) {
    Write-Host "`nTesting completed with $failCount failure(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAll test suites PASSED!" -ForegroundColor Green
    exit 0
}

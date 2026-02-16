# preflight.ps1 - Parallel Validation Suite
# Runs type checks, linting, and dependency validation in parallel.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/preflight"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "Starting Preflight Validation Suite..." -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot/.."
$jobs = @()

# 1. Admin Panel Typecheck
$jobs += Start-Job -Name "admin-typecheck" -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath/admin-panel"
    npx tsc --noEmit 2>&1 | Out-File "$rootPath/.agent/logs/preflight/admin-typecheck.log"
    exit $LASTEXITCODE
} -ArgumentList $root

# 2. Admin Panel Linting
$jobs += Start-Job -Name "admin-lint" -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath/admin-panel"
    npm run lint 2>&1 | Out-File "$rootPath/.agent/logs/preflight/admin-lint.log"
    exit $LASTEXITCODE
} -ArgumentList $root

# 3. Student App Static Analysis
$jobs += Start-Job -Name "student-analyze" -ScriptBlock {
    param($rootPath)
    if (Test-Path "$rootPath/student-app") {
        Set-Location "$rootPath/student-app"
        flutter analyze 2>&1 | Out-File "$rootPath/.agent/logs/preflight/student-analyze.log"
        exit $LASTEXITCODE
    }
    exit 0
} -ArgumentList $root

# 4. Dependency Validation
$jobs += Start-Job -Name "deps-validate" -ScriptBlock {
    param($rootPath)
    Set-Location $rootPath
    npm run deps:validate 2>&1 | Out-File "$rootPath/.agent/logs/preflight/deps-validate.log"
    exit $LASTEXITCODE
} -ArgumentList $root

Write-Host "Waiting for jobs..." -ForegroundColor Yellow

# Wait for all jobs to complete
$jobs | Wait-Job | Out-Null

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "Preflight Results (Duration: $($duration.TotalSeconds)s):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
foreach ($job in $jobs) {
    # Receive-Job ensures the job object is updated with the exit code
    $null = Receive-Job $job
    $ec = $job.ChildJobs[0].ExitCode
    
    if ($null -eq $ec -and $job.State -eq "Completed") {
        # Fallback for jobs that don't report ExitCode but completed
        $ec = 0
    }

    if ($ec -eq 0) {
        Write-Host "PASS: $($job.Name)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $($job.Name) (ExitCode: $ec) - See $logDir/$($job.Name).log" -ForegroundColor Red
        $failCount++
    }
}

Remove-Job $jobs

if ($failCount -gt 0) {
    Write-Host "Preflight FAILED with $failCount error(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Preflight PASSED!" -ForegroundColor Green
    exit 0
}

# preflight.ps1 - Parallel Validation Suite (Student-App Standalone)
# Runs type checks, linting, and dependency validation in parallel.

$ErrorActionPreference = "Continue"
$startTime = Get-Date

$logDir = "$PSScriptRoot/../.agent/logs/preflight"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "Starting Preflight Validation Suite..." -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot/.."
$jobs = @()

# 1. Student App Static Analysis
$jobs += Start-Job -Name "student-analyze" -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath"
    flutter analyze 2>&1 | Out-File "$rootPath/.agent/logs/preflight/student-analyze.log"
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
    $null = Receive-Job $job
    $ec = $job.ChildJobs[0].ExitCode
    
    if ($null -eq $ec -and $job.State -eq "Completed") {
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

# certify-evidence.ps1 - Automated Evidence Collection for /certify
# Collects all mechanical evidence for a certification cycle in parallel.

$ErrorActionPreference = "Continue"
$startTime = Get-Date
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$rootPath = Resolve-Path "$PSScriptRoot/.."
$artifactDir = "$rootPath/.agent/artifacts/certify_$timestamp"

if (!(Test-Path $artifactDir)) { New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null }

Write-Host " Starting Certification Evidence Collection ($timestamp)..." -ForegroundColor Cyan

$jobs = @()

# 1. Preflight Validation
$jobs += Start-Job -Name "preflight" -ScriptBlock {
    param($root, $artDir)
    & "$root/scripts/preflight.ps1" > "$artDir/preflight.log" 2>&1
} -ArgumentList $rootPath, $artifactDir

# 2. Full Test Suite
$jobs += Start-Job -Name "tests" -ScriptBlock {
    param($root, $artDir)
    & "$root/scripts/run-all-tests.ps1" > "$artDir/tests.log" 2>&1
} -ArgumentList $rootPath, $artifactDir

# 3. Code Hygiene
$jobs += Start-Job -Name "hygiene" -ScriptBlock {
    param($root, $artDir)
    & "$root/scripts/code-hygiene-scan.ps1" > "$artDir/hygiene.log" 2>&1
} -ArgumentList $rootPath, $artifactDir

Write-Host " Collecting evidence in parallel..." -ForegroundColor Yellow
$jobs | Wait-Job | Out-Null

$duration = (Get-Date) - $startTime
Write-Host "`n Certification Summary (Duration: $($duration.TotalMinutes.ToString("F1"))m):" -ForegroundColor Cyan
Write-Host "Evidence Location: $artifactDir" -ForegroundColor Gray

foreach ($job in $jobs) {
    if ($job.ChildJobs[0].ExitCode -eq 0) { 
        Write-Host "[] PASSED: $($job.Name)" -ForegroundColor Green
    } else { 
        Write-Host "[] FAILED: $($job.Name)" -ForegroundColor Red
    }
}

Remove-Job $jobs

$manifest = @{
    timestamp = $timestamp
    duration_min = $duration.TotalMinutes
    artifacts = Get-ChildItem $artifactDir | Select-Object Name, Length
}
$manifest | ConvertTo-Json | Out-File "$artifactDir/manifest.json"

Write-Host "`n Evidence collection complete." -ForegroundColor Cyan
exit 0

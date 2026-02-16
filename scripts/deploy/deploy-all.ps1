<#
.SYNOPSIS
    Parallel deployment to Cloudflare Pages
.DESCRIPTION
    Deploys Questerix applications to Cloudflare Pages.
    By default, ONLY Admin Panel and Student App are deployed.
    Use -IncludeLanding to also deploy landing pages.
.PARAMETER ConfigFile
    Path to the master-config.json file
.PARAMETER IncludeLanding
    If set, will also deploy the landing pages project
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,

    [switch]$IncludeLanding
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Load configuration
$config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

$cfLanding = $config.cloudflare.landing_project
$cfAdmin = $config.cloudflare.admin_project
$cfStudent = $config.cloudflare.student_project

Write-Host "Starting parallel deployments..." -ForegroundColor Cyan

# =============================================================================
# DEPLOY IN PARALLEL
# =============================================================================
if ($IncludeLanding) {
    if (-not $cfLanding) {
        Write-Warning "Landing project not defined in config, but -IncludeLanding was specified."
    }
    $landingJob = Start-Job -ScriptBlock {
        param($Dir, $ProjectName)
        $landingDir = Join-Path $Dir 'landing-pages\dist'
        npx -y wrangler pages deploy $landingDir --project-name $ProjectName --commit-dirty --branch main 2>&1
    } -ArgumentList $RootDir, $cfLanding
} else {
    Write-Host "ℹ️  Skipping Landing Pages (Default Behavior)" -ForegroundColor Gray
}

$adminJob = Start-Job -ScriptBlock {
    param($Dir, $ProjectName)
    $adminDist = Join-Path $Dir 'admin-panel\dist'
    npx -y wrangler pages deploy $adminDist --project-name $ProjectName --commit-dirty --branch main 2>&1
} -ArgumentList $RootDir, $cfAdmin

$studentJob = Start-Job -ScriptBlock {
    param($Dir, $ProjectName)
    $studentBuild = Join-Path $Dir 'student-app\build\web'
    npx -y wrangler pages deploy $studentBuild --project-name $ProjectName --commit-dirty --branch main 2>&1
} -ArgumentList $RootDir, $cfStudent

# =============================================================================
# WAIT AND COLLECT RESULTS
# =============================================================================
$deployStatus = 0

if ($IncludeLanding) {
    $landingResult = Receive-Job -Job $landingJob -Wait
    if ($landingJob.State -eq 'Completed') {
        Write-Host "✅ Landing Pages deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Landing Pages deployment FAILED" -ForegroundColor Red
        Write-Host ($landingResult -join "`n") -ForegroundColor Red
        $deployStatus = 1
    }
}

$adminResult = Receive-Job -Job $adminJob -Wait
if ($adminJob.State -eq 'Completed') {
    Write-Host "✅ Admin Panel deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Admin Panel deployment FAILED" -ForegroundColor Red
    Write-Host ($adminResult -join "`n") -ForegroundColor Red
    $deployStatus = 1
}

$studentResult = Receive-Job -Job $studentJob -Wait
if ($studentJob.State -eq 'Completed') {
    Write-Host "✅ Student App deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Student App deployment FAILED" -ForegroundColor Red
    Write-Host ($studentResult -join "`n") -ForegroundColor Red
    $deployStatus = 1
}

# Cleanup jobs
$jobsToClean = @($adminJob, $studentJob)
if ($IncludeLanding) { $jobsToClean += $landingJob }
Remove-Job -Job $jobsToClean

# Cleanup temp files
$flutterDefines = Join-Path $RootDir '.flutter-defines.tmp'
if (Test-Path $flutterDefines) {
    Remove-Item -Force $flutterDefines
}

if ($deployStatus -ne 0) {
    Write-Host "One or more deployments failed" -ForegroundColor Red
    exit 1
}

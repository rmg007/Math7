# deploy-all.ps1 - Sequential Deployment to Cloudflare Pages
# Hardened for reliability in this environment.
# Supports selective deployment via --Target parameter.

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,

    [ValidateSet('admin-panel', 'all')]
    [string]$Target = 'all',

    [switch]$IncludeLanding,
    
    [switch]$SkipLanding
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Load configuration
$config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

$cfLanding = $config.cloudflare.landing_project
$cfAdmin = $config.cloudflare.admin_project
$cfStudent = $config.cloudflare.student_project

Write-Host "Starting deployments (Target: $Target)..." -ForegroundColor Cyan

# Use current environment's CLOUDFLARE_API_TOKEN if set
if ($env:CLOUDFLARE_API_TOKEN) {
    Write-Host "[INFO] Using CLOUDFLARE_API_TOKEN from environment." -ForegroundColor Gray
}

# 1. Landing Pages (Optional)
if ($IncludeLanding -and $cfLanding -and ($Target -eq 'all')) {
    Write-Host "[DEPLOY] Deploying Landing Pages..." -ForegroundColor Cyan
    $landingDir = Join-Path $RootDir 'landing-pages\dist'
    npx -y wrangler pages deploy $landingDir --project-name $cfLanding --commit-dirty --branch main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Landing Pages deployed successfully" -ForegroundColor Green
    } else {
        Write-Error "Landing Pages deployment FAILED"
    }
}

# 2. Admin Panel
if ($Target -eq 'all' -or $Target -eq 'admin-panel') {
    Write-Host "[DEPLOY] Deploying Admin Panel..." -ForegroundColor Cyan
    $adminDist = Join-Path $RootDir 'admin-panel\dist'
    npx -y wrangler pages deploy $adminDist --project-name $cfAdmin --commit-dirty --branch main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Admin Panel deployed successfully" -ForegroundColor Green
    } else {
        Write-Error "Admin Panel deployment FAILED"
    }
}

# Cleanup temp files
$flutterDefines = Join-Path $RootDir '.flutter-defines.tmp'
if (Test-Path $flutterDefines) {
    Remove-Item -Force $flutterDefines
}

Write-Host "Deployments complete (Target: $Target)." -ForegroundColor Green

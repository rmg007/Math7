# deploy-all.ps1 - Sequential Deployment to Cloudflare Pages
# Hardened for reliability in this environment.
# Supports selective deployment via --Target parameter.
 
param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,
 
    [ValidateSet('admin-panel', 'questerix-student-app', 'all')]
    [string]$Target = 'all',
 
    [string]$Branch = 'main',
    
    [string]$StudentAppDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) '..\questerix-student-app')
)
 
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
 
# Load configuration
$config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
 
$cfAdmin = $config.cloudflare.admin_project
$cfStudent = $config.cloudflare.student_project
 
Write-Host "Starting deployments (Target: $Target, Branch: $Branch)..." -ForegroundColor Cyan
 
# Use current environment's CLOUDFLARE_API_TOKEN if set
if ($env:CLOUDFLARE_API_TOKEN) {
    Write-Host "[INFO] Using CLOUDFLARE_API_TOKEN from environment." -ForegroundColor Gray
}
 
# 1. Admin Panel (Allowed deploy target)
if ($Target -eq 'all' -or $Target -eq 'admin-panel') {
    Write-Host "[DEPLOY] Deploying Admin Panel..." -ForegroundColor Cyan
    $adminDist = Join-Path $RootDir 'admin-panel\dist'
    npx.cmd -y wrangler pages deploy $adminDist --project-name $cfAdmin --commit-dirty --branch $Branch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Admin Panel deployed successfully" -ForegroundColor Green
    } else {
        Write-Error "Admin Panel deployment FAILED"
    }
}
 
# 2. Student App (Allowed deploy target)
if ($Target -eq 'all' -or $Target -eq 'questerix-student-app') {
    Write-Host "[DEPLOY] Deploying Student App..." -ForegroundColor Cyan
    # Student App is a sibling by default, can be passed in
    $studentDist = Join-Path $StudentAppDir 'build\web'
    
    if (-not (Test-Path $studentDist)) {
      Write-Error "Student App build output NOT FOUND at $studentDist. Run build-student.ps1 first."
      exit 1
    }
 
    npx.cmd -y wrangler pages deploy $studentDist --project-name $cfStudent --commit-dirty --branch $Branch
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Student App deployed successfully" -ForegroundColor Green
    } else {
        Write-Error "Student App deployment FAILED"
    }
}
 
# Cleanup temp files
$flutterDefines = Join-Path $RootDir '.flutter-defines.tmp'
if (Test-Path $flutterDefines) {
    Remove-Item -Force $flutterDefines
}
 
Write-Host "Deployments complete (Target: $Target)." -ForegroundColor Green

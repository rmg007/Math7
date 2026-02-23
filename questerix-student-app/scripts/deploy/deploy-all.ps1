# deploy-all.ps1 - Sequential Deployment to Cloudflare Pages
# Standalone version for questerix-student-app

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,

    [ValidateSet('questerix-student-app')]
    [string]$Target = 'questerix-student-app'
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Load configuration
$config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
$cfStudent = $config.cloudflare.student_project

Write-Host "Starting Student App deployment..." -ForegroundColor Cyan

# Use current environment's CLOUDFLARE_API_TOKEN if set
if ($env:CLOUDFLARE_API_TOKEN) {
    Write-Host "[INFO] Using CLOUDFLARE_API_TOKEN from environment." -ForegroundColor Gray
}

# 1. Student App
Write-Host "[DEPLOY] Deploying Student App..." -ForegroundColor Cyan
$studentBuild = Join-Path $RootDir 'build\web'

if (-not (Test-Path $studentBuild)) {
    Write-Error "Build output not found at $studentBuild"
    exit 1
}

npx -y wrangler pages deploy $studentBuild --project-name $cfStudent --commit-dirty --branch main
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Student App deployed successfully" -ForegroundColor Green
} else {
    Write-Error "Student App deployment FAILED"
    exit 1
}

# Cleanup temp files
$flutterDefines = Join-Path $RootDir '.flutter-defines.tmp'
if (Test-Path $flutterDefines) {
    Remove-Item -Force $flutterDefines
}

Write-Host "Deployment complete." -ForegroundColor Green

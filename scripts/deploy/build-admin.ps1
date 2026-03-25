<#
.SYNOPSIS
    React Admin Panel build wrapper
.DESCRIPTION
    Builds the Admin Panel React application with Vite
#>

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$AdminDir = Join-Path $RootDir 'admin-panel'

Set-Location $AdminDir

# Clean previous build
if (Test-Path 'dist') {
    Remove-Item -Recurse -Force 'dist'
}

Write-Host "Installing Admin Panel dependencies..." -ForegroundColor Cyan
npm.cmd install --silent

Write-Host "Building Admin Panel with Vite..." -ForegroundColor Cyan
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host " npm run build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

if (Test-Path (Join-Path $AdminDir 'dist')) {
    Write-Host " Admin Panel build complete: dist/" -ForegroundColor Green
} else {
    Write-Host " Admin Panel build failed! dist/ directory not found." -ForegroundColor Red
    exit 1
}

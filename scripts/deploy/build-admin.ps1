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

Write-Host "Installing Admin Panel dependencies..." -ForegroundColor Cyan
npm ci --silent

Write-Host "Building Admin Panel with Vite..." -ForegroundColor Cyan
npm run build

if (Test-Path (Join-Path $AdminDir 'dist')) {
    Write-Host "✅ Admin Panel build complete: dist/" -ForegroundColor Green
} else {
    Write-Host "❌ Admin Panel build failed!" -ForegroundColor Red
    exit 1
}

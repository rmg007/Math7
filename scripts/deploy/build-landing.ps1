<#
.SYNOPSIS
    Builds the Landing Pages (React/Vite)
.DESCRIPTION
    Executes npm install and npm run build in the landing-pages directory
#>

$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$LandingDir = Join-Path $RootDir "landing-pages"

Write-Host " Building Landing Pages..." -ForegroundColor Cyan

Push-Location $LandingDir

try {
    Write-Host "  [1/2] Installing dependencies..." -ForegroundColor Gray
    npm install --legacy-peer-deps
    
    Write-Host "  [2/2] Running production build..." -ForegroundColor Gray
    npm run build
    
    Write-Host " Landing Pages build complete!" -ForegroundColor Green
}
finally {
    Pop-Location
}

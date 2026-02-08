<#
.SYNOPSIS
    Flutter web build with dart-define injection
.DESCRIPTION
    Builds the Flutter Student App for web with environment variables
    injected via --dart-define flags
#>

param(
    [string]$DefinesFile
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$StudentAppDir = Join-Path $RootDir 'student-app'

if (-not $DefinesFile) {
    $DefinesFile = Join-Path $RootDir '.flutter-defines.tmp'
}

# Check dart-define flags file exists
if (-not (Test-Path $DefinesFile)) {
    Write-Host "ERROR: $DefinesFile not found." -ForegroundColor Red
    Write-Host "Run generate-env.ps1 first." -ForegroundColor Red
    exit 1
}

$flutterDefines = Get-Content $DefinesFile -Raw

Set-Location $StudentAppDir

Write-Host "Cleaning previous Flutter build..." -ForegroundColor Cyan
flutter clean

Write-Host "Getting Flutter packages..." -ForegroundColor Cyan
flutter pub get

Write-Host "Building Flutter web with dart-define flags..." -ForegroundColor Cyan
$buildCommand = "flutter build web --release --web-renderer canvaskit $flutterDefines"
Write-Host "Command: $buildCommand" -ForegroundColor DarkGray
Invoke-Expression $buildCommand

if (Test-Path (Join-Path $StudentAppDir 'build\web')) {
    Write-Host "✅ Flutter web build complete: build/web/" -ForegroundColor Green
} else {
    Write-Host "❌ Flutter web build failed!" -ForegroundColor Red
    exit 1
}

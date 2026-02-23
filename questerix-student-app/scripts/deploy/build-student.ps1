<#
.SYNOPSIS
    Flutter web build with dart-define injection
.DESCRIPTION
    Builds the Flutter Student App for web with environment variables
    injected via --dart-define flags. Run from the questerix-student-app root.
#>

param(
    [string]$DefinesFile
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# The repo root IS the student app — two levels up from scripts/deploy/
$StudentAppDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

if (-not $DefinesFile) {
    $DefinesFile = Join-Path $StudentAppDir '.flutter-defines.tmp'
}

# Check dart-define flags file exists
if (-not (Test-Path $DefinesFile)) {
    Write-Host "ERROR: $DefinesFile not found." -ForegroundColor Red
    Write-Host "Run generate-env.ps1 first." -ForegroundColor Red
    exit 1
}

$definesContent = Get-Content $DefinesFile
$dartDefineFlags = ""
foreach ($line in $definesContent) {
    if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith("#")) {
        $dartDefineFlags += " --dart-define=$line"
    }
}

Set-Location $StudentAppDir

Write-Host "Cleaning previous Flutter build..." -ForegroundColor Cyan
flutter clean

Write-Host "Getting Flutter packages..." -ForegroundColor Cyan
flutter pub get

Write-Host "Building Flutter web with dart-define flags..." -ForegroundColor Cyan
$buildCommand = "flutter build web --release $dartDefineFlags"
Write-Host "Command: flutter build web --release [FLAGS_HIDDEN]" -ForegroundColor DarkGray
Invoke-Expression $buildCommand

if (Test-Path (Join-Path $StudentAppDir 'build\web')) {
    Write-Host " Flutter web build complete: build/web/" -ForegroundColor Green
} else {
    Write-Host " Flutter web build failed!" -ForegroundColor Red
    exit 1
}

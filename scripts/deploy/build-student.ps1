<#
.SYNOPSIS
    Flutter web build with dart-define injection
.DESCRIPTION
    Builds the Flutter Student App for web with environment variables
    injected via --dart-define flags
#>
 
param(
    [string]$DefinesFile,
    [string]$StudentAppDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) '..\questerix-student-app')
)
 
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
 
if (-not $DefinesFile) {
    $DefinesFile = Join-Path $RootDir '.flutter-defines.tmp'
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
$buildCommand = "flutter build web --release --no-tree-shake-icons $dartDefineFlags"
Write-Host "Command: flutter build web --release --no-tree-shake-icons [FLAGS_HIDDEN]" -ForegroundColor DarkGray
Invoke-Expression $buildCommand
 
if (Test-Path (Join-Path $StudentAppDir 'build\web')) {
    Write-Host " Flutter web build complete: build/web/" -ForegroundColor Green
} else {
    Write-Host " Flutter web build failed!" -ForegroundColor Red
    exit 1
}

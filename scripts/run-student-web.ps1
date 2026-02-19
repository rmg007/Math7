<#
.SYNOPSIS
    Runs the student app locally with environment variables.
#>

$ScriptDir = $PSScriptRoot
$RootDir = Split-Path -Parent $ScriptDir
$DefinesFile = Join-Path $RootDir '.flutter-defines.tmp'

if (-not (Test-Path $DefinesFile)) {
    Write-Host "Generating environment variables..." -ForegroundColor Cyan
    powershell -File (Join-Path $ScriptDir "generate-env.ps1") -ConfigFile "master-config.json"
}

Write-Host "Starting Student App on port 3001..." -ForegroundColor Cyan
Set-Location (Join-Path $RootDir "student-app")

# Run flutter
flutter run -d chrome --web-port 3001 --dart-define-from-file=../.flutter-defines.tmp

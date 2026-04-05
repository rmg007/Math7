<#
.SYNOPSIS
    Runs the student app locally with environment variables.
#>

$ScriptDir = $PSScriptRoot
$RootDir = Split-Path -Parent $ScriptDir

$StudentAppDir = $null
$Nested = Join-Path $RootDir "questerix-student-app"
$Sibling = Join-Path (Split-Path $RootDir -Parent) "questerix-student-app"
if (Test-Path $Nested) {
    $StudentAppDir = (Resolve-Path $Nested).Path
} elseif (Test-Path $Sibling) {
    $StudentAppDir = (Resolve-Path $Sibling).Path
} elseif (Test-Path (Join-Path $RootDir "student-app")) {
    $StudentAppDir = (Resolve-Path (Join-Path $RootDir "student-app")).Path
}

if (-not $StudentAppDir) {
    Write-Error "questerix-student-app not found (checked under repo root and sibling of Questerix/)."
    exit 1
}

$DefinesFile = Join-Path $RootDir '.flutter-defines.tmp'

if (-not (Test-Path $DefinesFile)) {
    Write-Host "Generating environment variables..." -ForegroundColor Cyan
    $genEnv = Join-Path $ScriptDir "generate-env.ps1"
    if (Test-Path $genEnv) {
        powershell -File $genEnv -ConfigFile "master-config.json"
    } else {
        Write-Warning "generate-env.ps1 not found at $genEnv — create .flutter-defines.tmp manually or run deploy env script."
    }
}

if (-not (Test-Path $DefinesFile)) {
    Write-Error "Missing defines file: $DefinesFile"
    exit 1
}

$DefinesResolved = (Resolve-Path $DefinesFile).Path

Write-Host "Starting Student App from $StudentAppDir on port 3001..." -ForegroundColor Cyan
Push-Location $StudentAppDir
try {
    flutter run -d chrome --web-port 3001 "--dart-define-from-file=$DefinesResolved"
} finally {
    Pop-Location
}

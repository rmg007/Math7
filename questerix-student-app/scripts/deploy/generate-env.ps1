<#
.SYNOPSIS
    Generates Flutter dart-define environment file
.DESCRIPTION
    Combines master-config.json and .secrets to produce .flutter-defines.tmp
    for use with `flutter build web --dart-define=...`
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
# Two levels up from scripts/deploy/ = repo root
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

$configPath = $ConfigFile
if (-not (Test-Path $configPath)) {
    $configPath = Join-Path $RootDir $ConfigFile
}

if (-not (Test-Path $configPath)) {
    Write-Host " Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$secretsPath = Join-Path $RootDir '.secrets'
if (-not (Test-Path $secretsPath)) {
    Write-Host " Secrets file not found: $secretsPath" -ForegroundColor Red
    exit 1
}

# Load Secrets
$secrets = @{}
Get-Content $secretsPath | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') {
        $key = $Matches[1]
        $value = $Matches[2].Trim()
        if ($value) {
            $secrets[$key] = $value
        }
    }
}

# Load Config
$configJson = Get-Content $configPath | ConvertFrom-Json

# Helper to resolve placeholders
function Resolve-Value {
    param($val)
    
    if (-not $val) { return "" }
    
    # Replace ${global.VAR}
    if ($val -match '\$\{global\.([A-Z_a-z]+)\}') {
        $refKey = $Matches[1]
        if ($configJson.global.$refKey) {
            $realVal = Resolve-Value -val $configJson.global.$refKey
            $placeHolder = '${global.' + $refKey + '}'
            $val = $val.Replace($placeHolder, $realVal)
        } elseif ($secrets.ContainsKey($refKey)) {
            $realVal = $secrets[$refKey]
            $placeHolder = '${global.' + $refKey + '}'
            $val = $val.Replace($placeHolder, $realVal)
        }
    }
    
    # Replace ${version}
    if ($val -match '\$\{version\}') {
        $val = $val.Replace('${version}', $configJson.version)
    }
    
    return $val
}

# Generate Student App .flutter-defines.tmp
Write-Host "  Generating .flutter-defines.tmp..." -ForegroundColor Cyan
$flutterEnvContent = @()
$flutterEnvContent += "# Generated from $ConfigFile on $(Get-Date)"

foreach ($prop in $configJson.student.PSObject.Properties) {
    if ($prop.Name -eq "_comment") { continue }
    $val = $prop.Value
    $resolvedVal = Resolve-Value -val $val
    
    $flutterEnvContent += "$($prop.Name)=$resolvedVal"
}

$flutterDefinesPath = Join-Path $RootDir ".flutter-defines.tmp"
Set-Content -Path $flutterDefinesPath -Value $flutterEnvContent
Write-Host "   Created: $flutterDefinesPath" -ForegroundColor Green

Write-Host " Environment generation complete." -ForegroundColor Green

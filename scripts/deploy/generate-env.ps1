<#
.SYNOPSIS
    Generates environment specific configuration files
.DESCRIPTION
    Combines master-config.json and .secrets to produce .env files
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { $ScriptDir = Get-Location }

$RootDir = Resolve-Path (Join-Path $ScriptDir '..\..')
if (-not $RootDir) { $RootDir = (Get-Item $ScriptDir).Parent.Parent.FullName }

$configPath = $ConfigFile
if (-not [System.IO.Path]::IsPathRooted($configPath)) {
    $configPath = Join-Path $RootDir $ConfigFile
}
$secretsPath = Join-Path $RootDir '.secrets'

if (-not (Test-Path $configPath)) {
    Write-Host "❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $secretsPath)) {
    Write-Host "❌ Secrets file not found: $secretsPath" -ForegroundColor Red
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
    if ($val -match '\$\{global\.([A-Z_]+)\}') {
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

# Generate Admin Panel .env.local
Write-Host "⚙️  Generating admin-panel/.env.local..." -ForegroundColor Cyan
$adminEnvContent = @()
$adminEnvContent += "# Generated from $ConfigFile on $(Get-Date)"
$adminEnvContent += "# DO NOT EDIT MANUALLY"

foreach ($prop in $configJson.admin.PSObject.Properties) {
    if ($prop.Name -eq "_comment") { continue }
    
    $val = $prop.Value
    # Check if empty string but mapped to a secret? 
    # Logic: If value is "" and key looks like secret, check secrets? 
    # Or strict substitution?
    # The config has "VITE_SUPABASE_ANON_KEY": "${global.SUPABASE_ANON_KEY}" which resolves to global.
    # But Global has "SUPABASE_ANON_KEY": "..." hardcoded or potentially placeholder.
    # Let's assume master-config.json *might* have secrets placeholders too.
    
    # Better logic: Resolve placeholders first.
    $resolvedVal = Resolve-Value -val $val
    
    $adminEnvContent += "$($prop.Name)=$resolvedVal"
}

$adminEnvPath = Join-Path $RootDir "admin-panel\.env.local"
Set-Content -Path $adminEnvPath -Value $adminEnvContent
Write-Host "  ✅ Created: $adminEnvPath" -ForegroundColor Green


# Generate Student App .flutter-defines.tmp
# This file is usually KEY=VALUE lines used by orchestrator or flutter run
Write-Host "⚙️  Generating .flutter-defines.tmp..." -ForegroundColor Cyan
$flutterEnvContent = @()
$flutterEnvContent += "# Generated from $ConfigFile on $(Get-Date)"

foreach ($prop in $configJson.student.PSObject.Properties) {
    $val = $prop.Value
    $resolvedVal = Resolve-Value -val $val
    
    # Flutter often needs escaped quotes if passed via command line, but if this is a file to be read:
    # If orchestrated via --dart-define-from-file (available in recent Flutter), JSON is best.
    # If using --dart-define, key=value is needed.
    # Let's write as key=value
    
    $flutterEnvContent += "$($prop.Name)=$resolvedVal"
}

$flutterDefinesPath = Join-Path $RootDir ".flutter-defines.tmp"
Set-Content -Path $flutterDefinesPath -Value $flutterEnvContent
Write-Host "  ✅ Created: $flutterDefinesPath" -ForegroundColor Green

Write-Host "✅ Environment generation complete." -ForegroundColor Green

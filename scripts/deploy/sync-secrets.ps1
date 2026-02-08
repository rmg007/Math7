<#
.SYNOPSIS
    Sync service-level secrets to Cloudflare Workers
.DESCRIPTION
    Use this when rotating Supabase service key or other
    server-side secrets that need to be pushed to Workers
#>

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Load secrets
$secretsPath = Join-Path $RootDir '.secrets'

if (-not (Test-Path $secretsPath)) {
    Write-Host "ERROR: .secrets file not found" -ForegroundColor Red
    exit 1
}

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

if (-not $secrets.ContainsKey('SUPABASE_SERVICE_KEY') -or -not $secrets['SUPABASE_SERVICE_KEY']) {
    Write-Host "ERROR: SUPABASE_SERVICE_KEY not set in .secrets" -ForegroundColor Red
    exit 1
}

Write-Host "Secret sync complete." -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: If you have Cloudflare Workers that need the service key," -ForegroundColor Yellow
Write-Host "uncomment and configure the wrangler commands below:" -ForegroundColor Yellow
Write-Host ""
Write-Host '# Push secrets to Cloudflare Worker' -ForegroundColor DarkGray
Write-Host '# $secretValue = $secrets["SUPABASE_SERVICE_KEY"]' -ForegroundColor DarkGray
Write-Host '# echo "SUPABASE_SERVICE_KEY=$secretValue" | wrangler secret bulk --name questerix-api-worker' -ForegroundColor DarkGray

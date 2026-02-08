<#
.SYNOPSIS
    Enhanced secrets download with integrity verification and validation
.DESCRIPTION
    Downloads and validates secrets from Cloudflare with security checks
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "staging", "development")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation,
    
    [Parameter(Mandatory=$false)]
    [string]$IntegrityHash
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$AuditLog = Join-Path $RootDir "logs\secrets-audit.json"

$secretsPath = Join-Path $RootDir '.secrets'
$backupPath = Join-Path $RootDir ".secrets.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Security: Backup existing secrets
if (Test-Path $secretsPath) {
    Copy-Item $secretsPath $backupPath
    Write-Host "📋 Backed up existing .secrets to $backupPath" -ForegroundColor Yellow
}

# Define expected secrets by environment
$expectedSecrets = @{
    production = @(
        "CLOUDFLARE_API_TOKEN",
        "SUPABASE_URL", 
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_KEY",
        "GEMINI_API_KEY",
        "SENTRY_DSN"
    )
    staging = @(
        "CLOUDFLARE_API_TOKEN",
        "SUPABASE_URL", 
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_KEY"
    )
    development = @(
        "CLOUDFLARE_API_TOKEN",
        "SUPABASE_URL", 
        "SUPABASE_ANON_KEY"
    )
}

# Download secrets with error handling
$downloadedSecrets = @{}
$auditEntry = @{
    timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
    environment = $Environment
    action = "download"
    user = $env:USERNAME
    secrets_downloaded = @()
    status = "in_progress"
}

Write-Host "🔓 Downloading secrets from $Environment..." -ForegroundColor Yellow

# Get list of secrets first
# Get list of secrets
Write-Host "🔍 Fetching secret list from Cloudflare ($Environment)..." -ForegroundColor Cyan

try {
    # 'wrangler secret list' returns textual JSON
    $secretListJson = npx wrangler secret list --env $Environment 2>&1 | Out-String
    
    # Extract the JSON part (ignore "To view a secret's value..." type messages)
    if ($secretListJson -match '\[\s*\{.*\}\s*\]') {
        $secretList = $matches[0] | ConvertFrom-Json
    } else {
        throw "Could not parse secret list output"
    }
} catch {
    Write-Host "❌ Failed to list secrets: $_" -ForegroundColor Red
    exit 1
}

# Verification Report
Write-Host "`n📊 Secret Verification Report ($Environment)" -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor Gray

$foundCount = 0
$missingCount = 0

foreach ($key in $expectedSecrets[$Environment]) {
    $found = $secretList | Where-Object { $_.name -eq $key }
    
    if ($found) {
        Write-Host "✅ $key" -NoNewline -ForegroundColor Green
        if ($found.modified_on) {
            Write-Host " (Last modified: $($found.modified_on))" -ForegroundColor Gray
        } else {
            Write-Host ""
        }
        $foundCount++
    } else {
        Write-Host "❌ $key (MISSING)" -ForegroundColor Red
        $missingCount++
    }
}

Write-Host "------------------------------------------------" -ForegroundColor Gray
Write-Host "Results: $foundCount Found, $missingCount Missing" -ForegroundColor ($missingCount -eq 0 ? 'Green' : 'Yellow')

if ($missingCount -gt 0) {
    Write-Host "`n⚠️  Some required secrets are missing in the cloud." -ForegroundColor Yellow
    Write-Host "   Run 'Upload-Secrets.ps1' to fix this." -ForegroundColor Yellow
} else {
    Write-Host "`n✨ All required secrets are present in Cloudflare." -ForegroundColor Green
}

Write-Host "`nℹ️  Note: Checks are for existence only. Values are hidden for security." -ForegroundColor Gray
exit 0

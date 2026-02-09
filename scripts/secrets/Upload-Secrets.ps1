<#
.SYNOPSIS
    Enhanced secrets upload with validation, encryption, and audit logging
.DESCRIPTION
    Uploads secrets to Cloudflare with comprehensive security checks
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "staging", "development")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$AuditLog = Join-Path $RootDir "logs\secrets-audit.json"

# Ensure audit directory exists
$auditDir = Split-Path $AuditLog -Parent
if (-not (Test-Path $auditDir)) { New-Item -ItemType Directory -Path $auditDir -Force }

# Security: Validate environment
if ($Environment -eq "production" -and -not $Force) {
    $confirmation = Read-Host "🚨 PRODUCTION ENVIRONMENT - Type 'CONFIRM' to proceed"
    if ($confirmation -ne "CONFIRM") {
        Write-Host "❌ Production upload cancelled" -ForegroundColor Red
        exit 1
    }
}

# Load and validate secrets
$secretsPath = Join-Path $RootDir '.secrets'
if (-not (Test-Path $secretsPath)) {
    Write-Host "❌ .secrets file not found" -ForegroundColor Red
    exit 1
}

# Security: Create backup before any changes
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$autoBackup = Join-Path $RootDir ".secrets.backup.$timestamp"
Copy-Item $secretsPath $autoBackup
Write-Host "📋 Backup created: $autoBackup" -ForegroundColor Yellow

# Load secrets with validation
$secrets = @{}
$requiredSecrets = @(
    "CLOUDFLARE_API_TOKEN",
    "SUPABASE_URL", 
    "SUPABASE_ANON_KEY"
)

$environmentSpecificSecrets = @{
    production = @("SUPABASE_SERVICE_KEY", "GEMINI_API_KEY", "SENTRY_DSN")
    staging = @("SUPABASE_SERVICE_KEY")
    development = @()
}

$allRequiredSecrets = $requiredSecrets + $environmentSpecificSecrets[$Environment]

Get-Content $secretsPath | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') {
        $key = $Matches[1]
        $value = $Matches[2].Trim()
        if ($value) {
            $secrets[$key] = $value
        }
    }
}

# Validate required secrets
$missingSecrets = $allRequiredSecrets | Where-Object { -not $secrets.ContainsKey($_) -or -not $secrets[$_] }

if ($missingSecrets) {
    Write-Host "⚠️  WARNING: The following secrets are missing or empty:" -ForegroundColor Yellow
    $missingSecrets | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    
    $proceed = Read-Host "Do you want to proceed with uploading ONLY the available secrets? (Y/N)"
    if ($proceed -ne "Y" -and $proceed -ne "y") {
        Write-Host "❌ Upload cancelled." -ForegroundColor Red
        exit 1
    }
    Write-Host "⚠️  Proceeding with partial upload..." -ForegroundColor Yellow
}

# Upload with audit logging
$auditEntry = @{
    timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
    environment = $Environment
    action = "upload"
    user = $env:USERNAME
    secrets_uploaded = @()
    status = "in_progress"
}

Write-Host "🔒 Uploading secrets to $Environment..." -ForegroundColor Yellow

# Prepare the secrets file content for piping
$envContent = ""

foreach ($secret in $secrets.GetEnumerator()) {
    $key = $secret.Key
    $value = $secret.Value
    
    # Skip empty values to avoid wiping cloud secrets with empty strings
    if (-not $value) { continue }
    
    # We construct the input for wrangler secret bulk
    $envContent += "{`"name`":`"$key`",`"text`":`"$value`"} `n"
    $auditEntry.secrets_uploaded += $key
}

# Create a temporary JSON file for bulk upload
$tempJsonPath = Join-Path $RootDir "temp-secrets-$timestamp.json"
$secretsJson = $secrets | ConvertTo-Json
Set-Content -Path $tempJsonPath -Value $secretsJson

try {
    Write-Host "  📤 Executing wrangler secret bulk..." -ForegroundColor Cyan
    # Use npx wrangler here to ensure it uses local or cached version if global is missing
    # We pipe the JSON file content to standard input if possible, or use the file
    
    # Wrangler secret bulk takes a JSON file as input
    $cmd = "npx wrangler secret bulk $tempJsonPath --env $Environment"
    Invoke-Expression $cmd
    
    Write-Host "  ✅ Upload completed" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ Failed: $_" -ForegroundColor Red
    $auditEntry.status = "failed"
    $auditEntry.error = $_.Exception.Message
    
    # Log failure and exit
    $auditEntry | ConvertTo-Json -Depth 10 | Add-Content $AuditLog
    Remove-Item $tempJsonPath -Force -ErrorAction SilentlyContinue
    exit 1
}
finally {
     Remove-Item $tempJsonPath -Force -ErrorAction SilentlyContinue
}

# Success audit
$auditEntry.status = "completed"
$auditEntry | ConvertTo-Json -Depth 10 | Add-Content $AuditLog

Write-Host "✅ Secrets uploaded successfully to $Environment" -ForegroundColor Green
Write-Host "📊 Audit log updated: $AuditLog" -ForegroundColor Yellow

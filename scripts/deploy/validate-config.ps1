<#
.SYNOPSIS
    Validate configuration and pre-flight checks
.DESCRIPTION
    Performs all pre-deployment validation:
    - Required tools check
    - Secrets file validation
    - Configuration JSON validation
    - Security checks
.PARAMETER ConfigFile
    Path to the master-config.json file
#>

param(
    [string]$ConfigFile
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

Write-Host "Running pre-flight validation..." -ForegroundColor Cyan

# =============================================================================
# CHECK REQUIRED TOOLS
# =============================================================================
$requiredTools = @(
    @{ Name = 'node'; Label = 'Node.js' },
    @{ Name = 'npm'; Label = 'NPM' },
    @{ Name = 'flutter'; Label = 'Flutter' },
    @{ Name = 'wrangler'; Label = 'Cloudflare Wrangler' }
)

$missingTools = @()
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool.Name -ErrorAction SilentlyContinue)) {
        $missingTools += $tool.Label
    }
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing required tools:" -ForegroundColor Red
    foreach ($tool in $missingTools) {
        Write-Host "   - $tool" -ForegroundColor Red
    }
    exit 1
}
Write-Host "✅ All required tools available" -ForegroundColor Green

# =============================================================================
# CHECK SECRETS FILE
# =============================================================================
$secretsPath = Join-Path $RootDir '.secrets'
$secretsTemplate = Join-Path $RootDir '.secrets.template'

if (-not (Test-Path $secretsPath)) {
    Write-Host "❌ .secrets file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this:" -ForegroundColor Yellow
    Write-Host "1. Copy .secrets.template to .secrets" -ForegroundColor Yellow
    Write-Host "2. Fill in your API keys and credentials" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run: Copy-Item '$secretsTemplate' '$secretsPath'" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ .secrets file found" -ForegroundColor Green

# =============================================================================
# VERIFY .secrets IS IN .gitignore
# =============================================================================
$gitignorePath = Join-Path $RootDir '.gitignore'
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -notmatch '\.secrets') {
        Write-Host "❌ SECURITY RISK: .secrets is NOT in .gitignore!" -ForegroundColor Red
        Write-Host "   Add '.secrets' to .gitignore before proceeding." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ .secrets is in .gitignore" -ForegroundColor Green

# =============================================================================
# VALIDATE SECRETS CONTENT
# =============================================================================
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

$requiredSecrets = @('CLOUDFLARE_API_TOKEN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY')
$missingSecrets = @()

foreach ($secret in $requiredSecrets) {
    if (-not $secrets.ContainsKey($secret) -or -not $secrets[$secret]) {
        $missingSecrets += $secret
    }
}

if ($missingSecrets.Count -gt 0) {
    Write-Host "❌ Missing required secrets in .secrets:" -ForegroundColor Red
    foreach ($secret in $missingSecrets) {
        Write-Host "   - $secret" -ForegroundColor Red
    }
    exit 1
}
Write-Host "✅ All required secrets configured" -ForegroundColor Green

# =============================================================================
# VALIDATE CONFIGURATION JSON
# =============================================================================
if ($ConfigFile -and (Test-Path $ConfigFile)) {
    try {
        $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
        Write-Host "✅ Configuration JSON is valid: $ConfigFile" -ForegroundColor Green
        
        # Check for placeholder values
        $placeholders = @()
        if ($config.global.SUPABASE_URL -match 'PLACEHOLDER') {
            $placeholders += 'global.SUPABASE_URL'
        }
        if ($config.global.SUPABASE_ANON_KEY -match 'PLACEHOLDER') {
            $placeholders += 'global.SUPABASE_ANON_KEY'
        }
        if ($config.cloudflare.account_id -match 'PLACEHOLDER') {
            $placeholders += 'cloudflare.account_id'
        }
        
        if ($placeholders.Count -gt 0) {
            Write-Host "⚠️  Warning: Placeholder values found in config:" -ForegroundColor Yellow
            foreach ($p in $placeholders) {
                Write-Host "   - $p" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "❌ Invalid JSON in $ConfigFile" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        exit 1
    }
}

# =============================================================================
# CHECK BUILD DIRECTORIES EXIST
# =============================================================================
$landingDir = Join-Path $RootDir 'landing-pages'
$adminDir = Join-Path $RootDir 'admin-panel'
$studentDir = Join-Path $RootDir 'student-app'

if (-not (Test-Path $landingDir)) {
    Write-Host "❌ Landing pages directory not found: $landingDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $adminDir)) {
    Write-Host "❌ Admin panel directory not found: $adminDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $studentDir)) {
    Write-Host "❌ Student app directory not found: $studentDir" -ForegroundColor Red
    exit 1
}
Write-Host "✅ All application directories found" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ALL PRE-FLIGHT CHECKS PASSED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green

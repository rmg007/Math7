# init_agent_env.ps1
# Windows PowerShell environment initialization script
# Run this script to set up the development environment

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AppShell Agent Environment Initialization"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running with appropriate permissions
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "Note: Running without administrator privileges. Some operations may require elevation." -ForegroundColor Yellow
    Write-Host ""
}

# Phase -1: Environment Validation
Write-Host "Phase -1: Validating environment..." -ForegroundColor Cyan
Write-Host ""

$requiredTools = @{
    "flutter" = @{ MinVersion = "3.19.0"; CheckCommand = "flutter --version" }
    "node" = @{ MinVersion = "18.0.0"; CheckCommand = "node --version" }
    "npm" = @{ MinVersion = "8.0.0"; CheckCommand = "npm --version" }
    "git" = @{ MinVersion = "2.0.0"; CheckCommand = "git --version" }
}

$missingTools = @()

foreach ($tool in $requiredTools.Keys) {
    Write-Host "Checking $tool... " -NoNewline
    try {
        $output = Invoke-Expression $requiredTools[$tool].CheckCommand 2>$null
        if ($output) {
            Write-Host "OK" -ForegroundColor Green
        } else {
            throw "Not found"
        }
    } catch {
        Write-Host "MISSING" -ForegroundColor Red
        $missingTools += $tool
    }
}

# Check Supabase CLI separately (optional for initial setup)
Write-Host "Checking supabase CLI... " -NoNewline
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        Write-Host "OK" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "MISSING (install with: scoop install supabase)" -ForegroundColor Yellow
}

Write-Host ""

if ($missingTools.Count -gt 0) {
    Write-Host "ERROR: Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Please install the missing tools and run this script again." -ForegroundColor Red
    exit 1
}

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Cyan

$directories = @(
    "AppShell/docs/specs",
    "scripts",
    "student-app/lib/src/core",
    "student-app/lib/src/features",
    "student-app/lib/src/database",
    "student-app/lib/src/repositories",
    "student-app/lib/src/services",
    "student-app/lib/src/routing",
    "student-app/lib/src/widgets",
    "student-app/integration_test",
    "admin-panel/src/components/ui",
    "admin-panel/src/features",
    "admin-panel/src/hooks",
    "admin-panel/src/lib",
    "admin-panel/src/pages",
    "admin-panel/src/utils",
    "supabase/migrations",
    ".github/workflows"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor DarkGray
    }
}

Write-Host ""

# Initialize PHASE_STATE.json if not exists
Write-Host "Checking PHASE_STATE.json..." -ForegroundColor Cyan
if (-not (Test-Path "PHASE_STATE.json")) {
    $phaseState = @{
        current_phase = -1
        completed_phases = @()
        phase_artifacts = @{}
        blocked_on = $null
        pending_clarifications = @()
        last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        last_error = $null
    }
    $phaseState | ConvertTo-Json -Depth 10 | Set-Content "PHASE_STATE.json"
    Write-Host "  Created: PHASE_STATE.json" -ForegroundColor Green
} else {
    Write-Host "  Exists: PHASE_STATE.json" -ForegroundColor DarkGray
}

Write-Host ""

# Create .env.example files
Write-Host "Creating .env.example files..." -ForegroundColor Cyan

$studentEnvExample = @"
# Student App Environment Variables
# Copy this file to .env and fill in actual values

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Sentry Configuration (Optional)
SENTRY_DSN=

# Environment
ENV=development
"@

$adminEnvExample = @"
# Admin Panel Environment Variables
# Copy this file to .env and fill in actual values

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Sentry Configuration (Optional)
VITE_SENTRY_DSN=
"@

if (-not (Test-Path "student-app/.env.example")) {
    $studentEnvExample | Set-Content "student-app/.env.example"
    Write-Host "  Created: student-app/.env.example" -ForegroundColor Green
}

if (-not (Test-Path "admin-panel/.env.example")) {
    $adminEnvExample | Set-Content "admin-panel/.env.example"
    Write-Host "  Created: admin-panel/.env.example" -ForegroundColor Green
}

Write-Host ""

# Create .gitignore if not exists
Write-Host "Checking .gitignore..." -ForegroundColor Cyan
if (-not (Test-Path ".gitignore")) {
    $gitignore = @"
# Environment files
.env
.env.local
.env.*.local

# Dependencies
node_modules/
.dart_tool/
.packages

# Build outputs
build/
dist/
*.apk
*.ipa

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Generated
*.g.dart
*.freezed.dart
"@
    $gitignore | Set-Content ".gitignore"
    Write-Host "  Created: .gitignore" -ForegroundColor Green
} else {
    Write-Host "  Exists: .gitignore" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Environment initialization complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run Phase -1 validation: .\scripts\validate-phase--1.ps1"
Write-Host "  2. Initialize Flutter app: cd student-app && flutter create ."
Write-Host "  3. Initialize React app: cd admin-panel && npm create vite@latest . -- --template react-ts"
Write-Host "  4. Link Supabase project: supabase login && supabase link"
Write-Host ""
Write-Host "Refer to AppShell/docs/AGENTS.md for the full execution contract."

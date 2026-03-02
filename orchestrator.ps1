<#
.SYNOPSIS
    Questerix Unified Deployment Orchestrator
.DESCRIPTION
    Single-command deployment pipeline for all Questerix applications:
    - Landing Pages (Static HTML/CSS)
    - Admin Panel (React + Vite)
    - Student App (Flutter Web)
    - Supabase (Schema migrations + Edge Functions)
.PARAMETER Env
    Environment to deploy to: 'production' or 'test'
.PARAMETER Target
    Which app(s) to deploy: 'admin-panel', 'questerix-student-app', or 'all' (default)
.PARAMETER ConfirmProd
    Required safety flag for production deploys. Without it, production deploys are blocked.
.PARAMETER SkipBuild
    Skip the build phase (useful for re-deploying existing builds)
.PARAMETER SkipSupabase
    Skip the Supabase sync phase (schema push + Edge Functions deploy)
.PARAMETER DryRun
    Validate everything but don't actually deploy
.EXAMPLE
    ./orchestrator.ps1 -Env test -Target admin-panel
    ./orchestrator.ps1 -Env production -ConfirmProd -Target all
    ./orchestrator.ps1 -Env test -DryRun
    ./orchestrator.ps1 -Env production -ConfirmProd -SkipBuild
#>

param(
    [ValidateSet('production', 'test')]
    [string]$Env = 'production',
    
    [ValidateSet('admin-panel', 'questerix-student-app', 'all')]
    [string]$Target = 'all',
    
    [switch]$ConfirmProd,
    
    [switch]$SkipBuild,
    
    [switch]$SkipTesting,
    
    [switch]$SkipSupabase,

    [switch]$SkipSmoke,
    
    [switch]$DryRun
)

# HARD RULE: Never publish landing pages during development phase
$SkipLanding = $true

# =============================================================================
# CONFIGURATION
# =============================================================================
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ScriptDir "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================
function Write-Log {
    param([string]$Level, [string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "$timestamp [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage
    
    switch ($Level) {
        'INFO'    { Write-Host $logMessage -ForegroundColor Cyan }
        'SUCCESS' { Write-Host $logMessage -ForegroundColor Green }
        'WARN'    { Write-Host $logMessage -ForegroundColor Yellow }
        'ERROR'   { Write-Host $logMessage -ForegroundColor Red }
        default   { Write-Host $logMessage }
    }
}

function Write-Info    { param([string]$Msg) Write-Log 'INFO' $Msg }
function Write-Success { param([string]$Msg) Write-Log 'SUCCESS' $Msg }
function Write-Warn    { param([string]$Msg) Write-Log 'WARN' $Msg }
function Write-Err     { param([string]$Msg) Write-Log 'ERROR' $Msg }

function Write-Phase {
    param([string]$Name)
    Write-Host ""
    Write-Info "-------------------------------------------------------"
    Write-Info $Name
    Write-Info "-------------------------------------------------------"
}

# =============================================================================
# PHASE 0: PRE-DEPLOY TESTING
# =============================================================================
function Invoke-PhaseTesting {
    Write-Phase "PHASE 0: PRE-DEPLOY TESTING"
    
    # 1. Run Preflight (Typecheck, Lint)
    Write-Info "Running fast preflight checks..."
    & (Join-Path $ScriptDir 'scripts\preflight.ps1')
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Preflight failed. Aborting deployment."
        exit 1
    }
    
    # 2. Run Full Test Suite (Parallel Fail-Fast Gate)
    $TestGateTimeout = 300 # 5 minutes total for the gate
    Write-Info "Running full test suite (Parallel Fail-Fast Gate, Timeout: ${TestGateTimeout}s)..."
    & (Join-Path $ScriptDir 'scripts\run-all-tests.ps1') -Target $Target -TimeoutSec $TestGateTimeout
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Test suite gate FAILED. Deployment aborted."
        exit 1
    }
    
    Write-Success "All pre-deploy test suites PASSED (Green Suite Rule)"
}

# =============================================================================
# PHASE 1: VALIDATION
# =============================================================================
function Invoke-PhaseValidation {
    Write-Phase "PHASE 1: VALIDATION"
    
    # Check required tools
    $requiredTools = @('node', 'npm', 'flutter')
    foreach ($tool in $requiredTools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Err "Required tool not found: $tool"
            exit 1
        }
    }
    
    if (Get-Command 'wrangler' -ErrorAction SilentlyContinue) {
        Write-Success "Wrangler found in PATH"
    } else {
        Write-Info "Wrangler not found in PATH, assuming available via npx"
    }
    Write-Success "All required tools available"
    
    # FIX O1: Check environment variables FIRST (for CI/CD), then fall back to .secrets file
    $secretsPath = Join-Path $ScriptDir '.secrets'
    
    # Check if running in CI/CD (environment variables already set)
    $hasEnvSecrets = $env:CLOUDFLARE_API_TOKEN -and $env:CLOUDFLARE_API_TOKEN -ne 'REPLACE_ME'
    
    if ($hasEnvSecrets) {
        Write-Success "Running in CI/CD mode - using environment variables"
    } elseif (Test-Path $secretsPath) {
        # Local development - load from .secrets file
        # Verify .secrets is in .gitignore
        $gitignorePath = Join-Path $ScriptDir '.gitignore'
        if (Test-Path $gitignorePath) {
            $gitignoreContent = Get-Content $gitignorePath -Raw
            if ($gitignoreContent -notmatch '\.secrets') {
                Write-Err ".secrets is NOT in .gitignore! This is a security risk. Aborting."
                exit 1
            }
        }
        Write-Success ".secrets file found and is in .gitignore"
        
        # Load secrets into environment
        Get-Content $secretsPath | ForEach-Object {
            if ($_ -match '^([A-Z_]+)=(.*)$') {
                $key = $Matches[1]
                $value = $Matches[2]
                if ($value -and $value.Trim()) {
                    Set-Item -Path "Env:$key" -Value $value.Trim()
                }
            }
        }
    } else {
        Write-Err "No secrets available. Either set CLOUDFLARE_API_TOKEN env var or create .secrets file."
        exit 1
    }
    
    if ($env:CLOUDFLARE_API_TOKEN -eq 'REPLACE_ME') {
        Remove-Item Env:CLOUDFLARE_API_TOKEN
    }
    
    if (-not $env:CLOUDFLARE_API_TOKEN) {
        Write-Warn "CLOUDFLARE_API_TOKEN not set. Deployment will rely on local Wrangler login."
    } else {
        Write-Success "Cloudflare credentials loaded"
    }
    
    # Determine config file
    $script:ConfigFile = Join-Path $ScriptDir 'master-config.json'
    if ($Env -eq 'test') {
        $script:ConfigFile = Join-Path $ScriptDir 'master-config.test.json'
    }
    
    if (-not (Test-Path $script:ConfigFile)) {
        Write-Err "Config file not found: $($script:ConfigFile)"
        exit 1
    }
    
    # Validate JSON syntax
    try {
        $script:Config = Get-Content $script:ConfigFile -Raw | ConvertFrom-Json
    } catch {
        Write-Err "Invalid JSON in $($script:ConfigFile): $_"
        exit 1
    }
    Write-Success "Configuration validated: $($script:ConfigFile)"
    
    $script:DeployVersion = $script:Config.version
    Write-Info "Deployment version: $($script:DeployVersion)"
    Write-Info "Environment: $Env"
}

# =============================================================================
# PHASE 2: ENVIRONMENT GENERATION
# =============================================================================
function Invoke-PhaseGenerateEnv {
    Write-Phase "PHASE 2: ENVIRONMENT GENERATION"
    
    & (Join-Path $ScriptDir 'scripts\deploy\generate-env.ps1') -ConfigFile $script:ConfigFile
    
    $definesPath = Join-Path $ScriptDir '.flutter-defines.tmp'
    if (Test-Path "$definesPath") {
        Write-Success "Environment files generated and verified: $definesPath"
    } else {
        Write-Err "Environment files generated but verification failed: $definesPath NOT FOUND"
        exit 1
    }
}

# =============================================================================
# PHASE 2.5: SUPABASE SYNC (Schema + Edge Functions)
# =============================================================================
function Invoke-PhaseSupabaseSync {
    Write-Phase "PHASE 2.5: SUPABASE SYNC"
    
    $projectRef = $script:Config.supabase.project_ref
    if (-not $projectRef) {
        Write-Err "supabase.project_ref not set in config file. Cannot sync."
        exit 1
    }
    
    Write-Info "Target Supabase project: $projectRef (env: $Env)"
    
    if ($DryRun) {
        Write-Warn "Dry run - would push migrations and deploy Edge Functions to $projectRef"
        return
    }
    
    # Link project first (required for db push)
    Write-Info "Linking Supabase project $projectRef..."
    $dbPassword = $null
    if (Test-Path ".secrets") {
        $secrets = Get-Content ".secrets" | ConvertFrom-StringData
        $dbPassword = $secrets["SUPABASE_DB_PASSWORD"]
    }
    
    if ($null -ne $dbPassword) {
        npx supabase link --project-ref $projectRef --password $dbPassword
    } else {
        Write-Warn "SUPABASE_DB_PASSWORD not found in .secrets. Linking may fail or ask for password."
        npx supabase link --project-ref $projectRef
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Supabase link FAILED for project $projectRef"
        exit 1
    }

    # Push schema migrations
    Write-Info "Pushing schema migrations..."
    npx supabase db push --linked
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Schema migration push FAILED for project $projectRef"
        exit 1
    }
    Write-Success "Schema migrations applied to $projectRef"
    
    # Deploy Edge Functions
    Write-Info "Deploying Edge Functions..."
    npx supabase functions deploy --project-ref $projectRef
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Edge Functions deployment FAILED for project $projectRef"
        exit 1
    }
    Write-Success "Edge Functions deployed to $projectRef"
}

# =============================================================================
# PHASE 3: PARALLEL BUILD
# =============================================================================
function Invoke-PhaseBuild {
    Write-Phase "PHASE 3: PARALLEL BUILD"
    
    if ($DryRun) {
        Write-Warn "Dry run - skipping build phase"
        return
    }

    if ($SkipBuild) {
        Write-Warn "Skipping build phase (--SkipBuild flag)"
        return
    }
    
    # Clean previous builds (immutable build principle)
    Write-Info "Cleaning previous build artifacts..."
    $adminDist = Join-Path $ScriptDir 'admin-panel\dist'
    $studentBuild = Join-Path $ScriptDir 'questerix-student-app\build\web'
    
    if (Test-Path $adminDist) { Remove-Item -Recurse -Force $adminDist }
    if (Test-Path $studentBuild) { Remove-Item -Recurse -Force $studentBuild }
    
    # Build sequentially for maximum reliability in this environment
    Write-Host "[BUILD] Building Admin Panel..." -ForegroundColor Cyan
    Set-Location (Join-Path $ScriptDir 'admin-panel')
    npm run build
    Set-Location $ScriptDir

    Write-Host "[BUILD] Building Student App..." -ForegroundColor Cyan
    Set-Location (Join-Path $ScriptDir 'questerix-student-app')
    flutter clean
    # Proper format dart defines

    $definesList = Get-Content (Join-Path $ScriptDir '.flutter-defines.tmp')
    $definesArg = @()
    foreach ($line in $definesList) {
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#")) {
            $definesArg += "--dart-define=$trimmed"
        }
    }
    
    Write-Info "Building Student App with defines..."
    # Use direct call with array to correctly pass arguments through PowerShell's native argument handling
    & flutter build web --release --no-tree-shake-icons $definesArg
    Set-Location $ScriptDir

    
    # Verify build outputs exist
    if (-not (Test-Path $adminDist)) {
        Write-Err "Admin Panel build output not found. Check $LogFile for details."
        exit 1
    }
    
    if (-not (Test-Path $studentBuild)) {
        Write-Err "Student App build output not found. Check $LogFile for details."
        exit 1
    }
    
    Write-Success "All builds completed successfully"
}

# =============================================================================
# PHASE 4: DEPLOY
# =============================================================================
function Invoke-PhaseDeploy {
    Write-Phase "PHASE 4: PARALLEL DEPLOY TO CLOUDFLARE"
    
    $cfLanding = $script:Config.cloudflare.landing_project
    $cfAdmin = $script:Config.cloudflare.admin_project
    $cfStudent = $script:Config.cloudflare.student_project
    
    if ($DryRun) {
        Write-Warn "Dry run mode - skipping actual deployment"
        Write-Info "Would deploy:"
        Write-Info "  - Landing Pages -> $cfLanding"
        Write-Info "  - Admin Panel   -> $cfAdmin"
        Write-Info "  - Student App   -> $cfStudent"
        return
    }
    
    & (Join-Path $ScriptDir 'scripts\deploy\deploy-all.ps1') -ConfigFile $script:ConfigFile -Target $Target -SkipLanding:$SkipLanding
    
    Write-Success "All applications deployed"
}

# =============================================================================
# PHASE 4.5: POST-DEPLOY SMOKE TEST
# =============================================================================
function Invoke-PhaseSmoke {
    Write-Phase "PHASE 4.5: POST-DEPLOY SMOKE TEST"

    if ($DryRun) {
        Write-Warn "Dry run - skipping smoke test"
        return
    }

    if ($SkipSmoke) {
        Write-Warn "Skipping smoke test (--SkipSmoke flag)"
        return
    }

    # New PowerShell Smoke Gate (Replaces smoke-test.sh)
    $smokeScript = Join-Path $ScriptDir 'scripts\smoke-gate.ps1'
    
    if (-not (Test-Path $smokeScript)) {
        Write-Warn "Smoke gate script not found at $smokeScript - skipping"
        return
    }

    # Determine URL based on target for smoke test
    $smokeUrl = ""
    if ($Target -eq 'admin-panel') {
        $smokeUrl = "https://$($script:Config.cloudflare.admin_project).pages.dev"
    } elseif ($Target -eq 'questerix-student-app') {
        $smokeUrl = "https://$($script:Config.cloudflare.student_project).pages.dev"
    }

    Write-Info "Running production smoke gate against: $Target"
    & $smokeScript -Target $Target -Url $smokeUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Smoke gate FAILED. Production verification did not pass."
        exit 1
    }
    
    Write-Success "Smoke verification passed"
}

# =============================================================================
# PHASE 5: CLEANUP & REPORT
# =============================================================================
function Invoke-PhaseCleanup {
    Write-Phase "PHASE 5: CLEANUP & REPORT"
    
    # Remove generated env files (prevent stale config)
    $envLocal = Join-Path $ScriptDir 'admin-panel\.env.local'
    $envProd = Join-Path $ScriptDir 'admin-panel\.env.production.local'
    $flutterDefines = Join-Path $ScriptDir '.flutter-defines.tmp'
    
    if (Test-Path $envLocal) { Remove-Item -Force $envLocal }
    if (Test-Path $envProd) { Remove-Item -Force $envProd }
    if (Test-Path $flutterDefines) { Remove-Item -Force $flutterDefines }
    
    # Update AI Performance Registry
    Write-Info "Syncing AI Performance Registry..."
    try {
        & (Join-Path $ScriptDir 'scripts\knowledge-base\sync-registry.ps1')
        # Note: Actual database update happens via agent tool or manual CLI. 
        # In a headless CI environment, we would use 'supabase db execute'.
    } catch {
        Write-Warn "Registry sync failed: $_"
    }

    # Final report
    $cfLanding = $script:Config.cloudflare.landing_project
    $cfAdmin = $script:Config.cloudflare.admin_project
    $cfStudent = $script:Config.cloudflare.student_project
    
    Write-Host ""
    Write-Success "-------------------------------------------------------"
    Write-Success "DEPLOYMENT COMPLETE"
    Write-Success "-------------------------------------------------------"
    Write-Info "Version: $($script:DeployVersion)"
    Write-Info "Environment: $Env"
    Write-Host ""
    Write-Info "Live URLs:"
    Write-Info "  Landing:  https://$cfLanding.pages.dev"
    Write-Info "  Admin:    https://$cfAdmin.pages.dev"
    Write-Info "  Student:  https://$cfStudent.pages.dev"
    Write-Host ""
    Write-Info "Log file: $LogFile"
}

function Update-DeploymentLog {
    param([string]$Status, [string]$Details = "")
    
    $logFile = Join-Path $ScriptDir "questerix-cortex/outputs/DEPLOY_LOG.md"
    $logDir = Split-Path $logFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $entry = "| $timestamp | $Target | $Env | $Status | $Details |"
    
    if (-not (Test-Path $logFile)) {
        Set-Content -Path $logFile -Value "# Questerix Deployment Log`n`n| Timestamp | Target | Env | Status | Details |`n|---|---|---|---|---|`n$entry"
    } else {
        Add-Content -Path $logFile -Value $entry
    }
    
    # Prune log if it gets too long (keep last 50 entries)
    $lines = Get-Content $logFile
    if ($lines.Count -gt 55) {
        $header = $lines[0..4]
        $lastFifty = $lines | Select-Object -Last 50
        $header + $lastFifty | Set-Content $logFile
    }
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
function Main {
    try {
        Write-Host ""
        Write-Info "QUESTERIX UNIFIED DEPLOYMENT PIPELINE"
        Write-Info "Started at: $(Get-Date)"
        Write-Info "Environment: $Env | Target: $Target"
        Write-Host ""

        # 1. Start Watchdog (8-hour hung check)
        $watchdogScript = Join-Path $ScriptDir 'scripts\watchdog.ps1'
        if (Test-Path $watchdogScript) {
            Start-Job -Name "deploy-watchdog" -ScriptBlock {
                param($script, $orchPid, $target) # orchPid avoids reserved 'pid'
                & $script -OrchestratorPid $orchPid -Target $target
            } -ArgumentList $watchdogScript, $PID, $Target | Out-Null
            Write-Info "Watchdog started (PID: $PID)"
        }
        
        # ---- PRODUCTION SAFETY LOCK ----
        if ($Env -eq 'production' -and -not $ConfirmProd) {
            Write-Err "PRODUCTION DEPLOY BLOCKED: You must pass -ConfirmProd to deploy to production."
            Write-Err "Example: ./orchestrator.ps1 -Env production -ConfirmProd -Target admin-panel"
            exit 1
        }
        
        if (-not $SkipTesting) {
            Invoke-PhaseTesting
        } else {
            Write-Warn "Skipping testing phase (--SkipTesting flag)"
            Update-DeploymentLog "WARN" "Testing skipped"
        }
        
        Invoke-PhaseValidation
        Invoke-PhaseGenerateEnv
        
        if (-not $SkipSupabase) {
            Invoke-PhaseSupabaseSync
        } else {
            Write-Warn "Skipping Supabase sync phase (--SkipSupabase flag)"
        }
        
        Invoke-PhaseBuild
        Invoke-PhaseDeploy
        Invoke-PhaseSmoke
        
        # Final success notification
        $notifyScript = Join-Path $ScriptDir 'scripts\notify.ps1'
        if (Test-Path $notifyScript) {
            & $notifyScript -Type SUCCESS -Target $Target -Env $Env -Message "Deployment successful. Log: $LogFile"
        }
        
        Invoke-PhaseCleanup
        Update-DeploymentLog "SUCCESS" "Log: $LogFile"

    } catch {
        $err = $_.Exception.Message
        Write-Err "DEPLOYMENT FAILED: $err"
        
        # Failure notification
        $notifyScript = Join-Path $ScriptDir 'scripts\notify.ps1'
        if (Test-Path $notifyScript) {
            & $notifyScript -Type FAIL -Target $Target -Env $Env -Message "Deployment failed: $err"
        }
        
        Update-DeploymentLog "FAIL" "Error: $err"
        exit 1
    } finally {
        # Ensure any background jobs (except watchdog) are cleaned up if needed
        # (watchdog will die on its own when it detects this PID is gone)
    }
}

# Run main function
Main

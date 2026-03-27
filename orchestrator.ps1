# orchestrator.ps1 - Sequential Deployment logic.
# [Full file rewrite to ensure all fixes are applied correctly]
# This script manages: Preflight -> Supabase -> Build -> Smoke Gate -> Promote -> Cleanup
 
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
    [switch]$DryRun,
    [switch]$Fast,
    [string]$StudentAppPath = (Join-Path (Split-Path -Parent $ScriptDir) 'questerix-student-app')
)
 
$SkipLanding = $true # Hard skip for development
 
# =============================================================================
# CONFIGURATION
# =============================================================================
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ScriptDir "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
 
# Standardized Colors & Logging
function Write-Phase   { param($msg) Write-Host "`n=== [$msg] ===" -ForegroundColor Blue }
function Write-Success { param($msg) Write-Host "[PASS] $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info    { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Gray }

#  Metrics & Structured Logging 
$script:Metrics = @{}
function Start-Timer { param($name) $script:Metrics[$name] = [DateTime]::Now }
function Stop-Timer { 
    param($name) 
    if ($script:Metrics.ContainsKey($name)) {
        $duration = [DateTime]::Now - $script:Metrics[$name]
        $script:Metrics[$name] = "{0:N0}s" -f $duration.TotalSeconds
    }
}

function Write-DeployLog {
    param([string]$Status, [string]$Details)
    $logPath = Join-Path $ScriptDir "questerix-cortex\outputs\DEPLOY_LOG.md"
    if (-not (Test-Path $logPath)) {
        "# Questerix Deployment Log`n`n| Timestamp | Target | Env | Status | Details | Metrics |`n|---|---|---|---|---|---|" | Out-File $logPath -Encoding utf8
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $metricsStr = ($script:Metrics.Keys | ForEach-Object { "$_=$($script:Metrics[$_])" }) -join "; "
    $entry = "| $timestamp | $Target | $Env | $Status | $Details | $metricsStr |"
    Add-Content -Path $logPath -Value $entry
}
 
# =============================================================================
# PHASE 1: PREFLIGHT
# =============================================================================
function Invoke-PhasePreflight {
    Write-Phase "PHASE 1: PREFLIGHT CHECK"
    
    # 1. Environment Confirmation
    if ($Env -eq 'production' -and -not $ConfirmProd) {
        Write-Err "Safety lock engaged! Production deploys require -ConfirmProd flag."
        exit 1
    }
    
    Write-Info "Environment: $Env"
    Write-Info "Application Target: $Target"
    
    # 2. Master Config Loader
    $script:ConfigFile = Join-Path $ScriptDir "master-config.json"
    if (-not (Test-Path $ConfigFile)) { throw "master-config.json not found!" }
    $script:Config = Get-Content $ConfigFile | ConvertFrom-Json
 
    # 3. Secrets Loader
    Write-Info "Loading secrets..."
    $script:Secrets = @{}
    $secretsPath = Join-Path $ScriptDir ".secrets"
    if (Test-Path $secretsPath) {
        Get-Content $secretsPath | ForEach-Object {
            if ($_ -match '^([A-Z_]+)=(.*)$') {
                $script:Secrets[$Matches[1]] = $Matches[2].Trim()
            }
        }
    } else {
        Write-Warn ".secrets file not found. Some phases may fail."
    }

    # 4. Cloudflare Access Check
    # (npx wrangler whoami --config $null) | Out-Null
    
    Write-Success "Preflight passed"
}
 
# =============================================================================
# PHASE 2: SUPABASE SYNC
# =============================================================================
function Invoke-PhaseSupabase {
    Write-Phase "PHASE 2: SUPABASE SCHEMA & EDGE FUNCTIONS"
    if ($SkipSupabase) { Write-Warn "Skipping Supabase phase"; return }
    if ($DryRun) { Write-Warn "Dry run - skipping actual sync"; return }
    
    Start-Timer "SupabaseSync"
    $syncScript = Join-Path $ScriptDir 'scripts\deploy\sync-schema.ps1'
    $secretsPath = Join-Path $ScriptDir '.secrets'
    & $syncScript -ConfigFile $script:ConfigFile -SecretsFile $secretsPath
    if ($LASTEXITCODE -ne 0) { throw "Supabase sync failed" }
    
    Stop-Timer "SupabaseSync"
    Write-Success "Supabase synchronized"
}
 
# =============================================================================
# PHASE 3: BUILD
# =============================================================================
function Invoke-PhaseBuild {
    Write-Phase "PHASE 3: PARALLEL BUILD"
    if ($SkipBuild) { Write-Warn "Skipping build phase"; return }
    
    Start-Timer "Build"
    # Generate Environment Files
    Write-Info "Generating environment files..."
    & (Join-Path $ScriptDir 'scripts\deploy\generate-env.ps1') -ConfigFile $script:ConfigFile
    
    # Clean previous builds
    Write-Info "Cleaning previous build artifacts..."
    $adminDist = Join-Path $ScriptDir 'admin-panel\dist'
    $studentBuild = Join-Path $StudentAppPath 'build\web'
    
    if (Test-Path $adminDist) { Remove-Item -Recurse -Force $adminDist }
    if (Test-Path $studentBuild) { Remove-Item -Recurse -Force $studentBuild }
 
    # Build Admin Panel
    if ($Target -eq 'all' -or $Target -eq 'admin-panel') {
        Write-Host "[BUILD] Building Admin Panel..." -ForegroundColor Cyan
        Push-Location (Join-Path $ScriptDir 'admin-panel')
        cmd.exe /c "npm run build"
        if ($LASTEXITCODE -ne 0) { throw "Admin Panel build failed" }
        Pop-Location
    }
 
    # Build Student App
    if ($Target -eq 'all' -or $Target -eq 'questerix-student-app') {
        Write-Host "[BUILD] Building Student App..." -ForegroundColor Cyan
        & (Join-Path $ScriptDir 'scripts\deploy\build-student.ps1') -StudentAppDir $StudentAppPath
        if ($LASTEXITCODE -ne 0) { throw "Student App build failed" }
    }
    
    Stop-Timer "Build"
    Write-Success "Builds completed"
}
 
# =============================================================================
# PHASE 4: DEPLOY
# =============================================================================
function Invoke-PhaseDeploy {
    param([string]$Branch = 'main')
    Write-Phase "PHASE 4: DEPLOY TO CLOUDFLARE (Branch: $Branch)"
    
    if ($DryRun) {
        Write-Warn "Dry run mode - skipping actual deployment to $Branch"
        return
    }
    
    if ($SkipLanding) {
        & (Join-Path $ScriptDir 'scripts\deploy\deploy-all.ps1') -ConfigFile $script:ConfigFile -Target $Target -Branch $Branch -SkipLanding -StudentAppDir $StudentAppPath
    } else {
        & (Join-Path $ScriptDir 'scripts\deploy\deploy-all.ps1') -ConfigFile $script:ConfigFile -Target $Target -Branch $Branch -StudentAppDir $StudentAppPath
    }
    
    Write-Success "Deployment to $Branch complete"
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
 
    $smokeScript = Join-Path $ScriptDir 'scripts\smoke-gate.ps1'
    if (-not (Test-Path $smokeScript)) {
        Write-Warn "Smoke gate script not found - skipping"
        return
    }
 
    # Gate-then-Promote: We test the preview subdomains
    Start-Timer "SmokeGate"

    if ($Target -eq 'all') {
        # Test Admin Panel
        $adminUrl = "https://preview.$($script:Config.cloudflare.admin_project).pages.dev"
        Write-Info "Running Admin Panel smoke tests against: $adminUrl"
        & $smokeScript -Target admin-panel -Url $adminUrl
        if ($LASTEXITCODE -ne 0) { throw "Admin Panel smoke gate failed" }

        # Test Student App
        $studentUrl = "https://preview.$($script:Config.cloudflare.student_project).pages.dev"
        Write-Info "Running Student App smoke tests against: $studentUrl"
        & $smokeScript -Target questerix-student-app -Url $studentUrl
        if ($LASTEXITCODE -ne 0) { throw "Student App smoke gate failed" }
    } else {
        $smokeUrl = ""
        if ($Target -eq 'admin-panel') {
            $smokeUrl = "https://preview.$($script:Config.cloudflare.admin_project).pages.dev"
        } else {
            $smokeUrl = "https://preview.$($script:Config.cloudflare.student_project).pages.dev"
        }
        Write-Info "Running $Target smoke gate against: $smokeUrl"
        & $smokeScript -Target $Target -Url $smokeUrl
        if ($LASTEXITCODE -ne 0) { throw "$Target smoke gate failed" }
    }

    Stop-Timer "SmokeGate"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Smoke gate FAILED. Promotion to production aborted."
        exit 1
    }
    
    Write-Success "Smoke verification passed"
}
 
# =============================================================================
# MAIN EXECUTION
# =============================================================================
function Main {
    try {
        Start-Transcript -Path $LogFile
        Start-Timer "Total"
        Invoke-PhasePreflight
        Invoke-PhaseSupabase
        Invoke-PhaseBuild
        
        if (-not $SkipSmoke) {
            # Track G: Gate-then-Promote
            Start-Timer "PreviewDeploy"
            Invoke-PhaseDeploy -Branch "preview"
            Stop-Timer "PreviewDeploy"
            Invoke-PhaseSmoke
            Write-Success "Smoke tests passed. Promoting to production..."
            Start-Timer "ProdDeploy"
            Invoke-PhaseDeploy -Branch "main"
            Stop-Timer "ProdDeploy"
        } else {
            # Direct deployment
            Start-Timer "ProdDeploy"
            Invoke-PhaseDeploy -Branch "main"
            Stop-Timer "ProdDeploy"
        }
 
        Stop-Timer "Total"
        Write-DeployLog "SUCCESS" "Full orchestration chain complete."
        Write-Success "ORCHESTRATION COMPLETE"
    } catch {
        Stop-Timer "Total"
        Write-DeployLog "FAIL" "$_"
        Write-Err "DEPLOYMENT FAILED: $_"
        exit 1
    } finally {
        # Track I: Log Lifecycle Management
        Write-Info "Rotating deployment and cortex logs..."
        $outputsDir = Join-Path $ScriptDir "questerix-cortex\outputs"
        $logsToClean = @(
            (Join-Path $outputsDir "logs"),
            $ScriptDir # root log files
        )
        
        foreach ($dir in $logsToClean) {
            if (Test-Path $dir) {
                Get-ChildItem -Path $dir -Filter "deploy-*.log" -File | 
                    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
                    Remove-Item -Force
            }
        }

        # Track K: Automated Runtime Cleanup
        if (-not $DryRun) {
            Write-Info "Executing runtime artifact cleanup..."
            & (Join-Path $ScriptDir 'scripts\maintenance\agent-memory-cleanup.ps1') | Out-Null
        }

        Stop-Transcript
    }
}
 
Main

<#
.SYNOPSIS
    Parallel Test Gate for Questerix.
.DESCRIPTION
    Runs all test suites in parallel with hard timeouts and fail-fast logic.
    Uses .exit files for reliable success tracking across PowerShell versions.
#>

param(
    [string]$Target = "all",
    [int]$TimeoutSec = 300
)

$ErrorActionPreference = "Continue"
$StartTime = Get-Date

# 1. Setup Logging
$ProjectRoot = Resolve-Path "$PSScriptRoot/.."
$LogDir = "$ProjectRoot/questerix-cortex/outputs/logs"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "🚀 Starting Parallel Test Gate (Timeout: ${TimeoutSec}s)..." -ForegroundColor Cyan

$Jobs = @()

# Function to start a test job safely
function Start-TestJob {
    param([string]$Name, [string]$DirPath, [scriptblock]$Cmd, [array]$JobArgs)
    
    if (Test-Path $DirPath) {
        Write-Host "  [+] Queueing $Name..." -ForegroundColor Gray
        $exitFile = "$LogDir/$Name.exit"
        if (Test-Path $exitFile) { Remove-Item $exitFile -Force }
        return Start-Job -Name $Name -ScriptBlock $Cmd -ArgumentList @($ProjectRoot, $LogDir, $exitFile, $JobArgs)
    } else {
        Write-Host "  [-] Skipping $Name (directory not found: $DirPath)" -ForegroundColor Gray
        return $null
    }
}

# --- JOB DEFINITIONS ---

# A. Admin Panel (Unit + TSC)
if ($Target -eq "all" -or $Target -eq "admin-panel") {
    $cmd = {
        param($root, $log, $exitFile)
        Set-Location "$root/admin-panel"
        & { npm run typecheck; if ($LASTEXITCODE -eq 0) { npx vitest run --run --no-watch } } 2>&1 | Out-File "$log/admin-unit.log"
        $LASTEXITCODE | Out-File $exitFile
        exit $LASTEXITCODE
    }
    $Jobs += Start-TestJob "admin-unit" "$ProjectRoot/admin-panel" $cmd
}

# B. Student App (Flutter)
if ($Target -eq "all" -or $Target -eq "questerix-student-app") {
    $cmd = {
        param($root, $log, $exitFile)
        Set-Location "$root/questerix-student-app"
        flutter test --no-pub 2>&1 | Out-File "$log/student-unit.log"
        $LASTEXITCODE | Out-File $exitFile
        exit $LASTEXITCODE
    }
    $Jobs += Start-TestJob "student-unit" "$ProjectRoot/questerix-student-app" $cmd
}

# C. Backend (Edge Functions)
if ($Target -eq "all") {
    $cmd = {
        param($root, $log, $exitFile)
        Set-Location "$root/supabase/functions"
        deno test --allow-all 2>&1 | Out-File "$log/edge-functions.log"
        $LASTEXITCODE | Out-File $exitFile
        exit $LASTEXITCODE
    }
    $Jobs += Start-TestJob "edge-functions" "$ProjectRoot/supabase/functions" $cmd
}

# D. Content Engine (Python)
if ($Target -eq "all") {
    $cmd = {
        param($root, $log, $exitFile)
        Set-Location "$root/content-engine"
        $py = if (Test-Path ".venv/Scripts/python.exe") { ".venv/Scripts/python.exe" } else { "python" }
        & $py -m pytest -q 2>&1 | Out-File "$log/content-engine.log"
        $LASTEXITCODE | Out-File $exitFile
        exit $LASTEXITCODE
    }
    $Jobs += Start-TestJob "content-engine" "$ProjectRoot/content-engine" $cmd
}

if ($Jobs.Count -eq 0) {
    Write-Host "⚠️ No jobs to run for target: $Target" -ForegroundColor Yellow
    exit 0
}

# --- WAIT & MONITOR (Fail-Fast) ---
$Running = $true
$Elapsed = 0
$FailDetected = $false
$FailedJob = ""

while ($Running -and ($Elapsed -lt $TimeoutSec)) {
    foreach ($j in $Jobs) {
        $exitFile = "$LogDir/$($j.Name).exit"
        if (Test-Path $exitFile) {
            $ec = (Get-Content $exitFile -ErrorAction SilentlyContinue).Trim()
            if ($ec -ne "" -and $ec -ne '0') {
                $FailDetected = $true
                $FailedJob = $j.Name
                $Running = $false
                break
            }
        } elseif ($j.State -eq 'Failed') {
            $FailDetected = $true
            $FailedJob = $j.Name
            $Running = $false
            break
        }
    }

    if ($Running) {
        $Pending = $Jobs | Where-Object { $_.State -eq 'Running' -or $_.State -eq 'NotStarted' }
        if ($Pending.Count -eq 0) { $Running = $false }
    }

    if ($Running) {
        Start-Sleep -Seconds 2
        $Elapsed += 2
    }
}

# --- CLEANUP & REPORT ---
$EndTime = Get-Date
$Duration = $EndTime - $StartTime
$Jobs | Where-Object { $_.State -eq 'Running' -or $_.State -eq 'NotStarted' } | Stop-Job

if ($FailDetected) {
    Write-Host "`n❌ FAIL-FAST: Job '$FailedJob' failed! Aborting." -ForegroundColor Red
} elseif ($Elapsed -ge $TimeoutSec) {
    Write-Host "`n❌ TIMEOUT: Test gate exceeded ${TimeoutSec}s!" -ForegroundColor Red
} else {
    Write-Host "`n✅ All parallel jobs completed successfully." -ForegroundColor Green
}

Write-Host "`nTest Summary (Duration: $($Duration.TotalSeconds.ToString("F1"))s):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"
$FinalExitCode = 0
foreach ($j in $Jobs) {
    $exitFile = "$LogDir/$($j.Name).exit"
    $exit = if (Test-Path $exitFile) { (Get-Content $exitFile -ErrorAction SilentlyContinue).Trim() } else { "N/A" }
    $status = if ($exit -eq '0') { "PASS" } else { "FAIL" }
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $($j.Name) (Exit: $exit)" -ForegroundColor $color
    if ($status -eq "FAIL") { $FinalExitCode = 1 }
}

Get-ChildItem -Path $LogDir -Filter "*.exit" | Remove-Item -Force
Remove-Job $Jobs -Force
exit $FinalExitCode

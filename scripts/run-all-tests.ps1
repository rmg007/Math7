<#
.SYNOPSIS
    Parallel Test Gate for Questerix.
.DESCRIPTION
    Runs all test suites in parallel with hard timeouts and fail-fast logic.
    If any job fails or times out, all other jobs are killed immediately.
.PARAMETER Target
    Filter for specific target: 'admin-panel' or 'questerix-student-app'.
.PARAMETER TimeoutSec
    Hard timeout for the entire gate (default 180s).
.EXAMPLE
    ./scripts/run-all-tests.ps1 -Target admin-panel -TimeoutSec 120
#>

param(
    [string]$Target = "all",
    [int]$TimeoutSec = 180
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
    param([string]$Name, [string]$DirPath, [scriptblock]$Cmd)
    
    if (Test-Path $DirPath) {
        Write-Host "  [+] Queueing $Name..." -ForegroundColor Gray
        return Start-Job -Name $Name -ScriptBlock $Cmd -ArgumentList $ProjectRoot, $LogDir
    } else {
        Write-Host "  [-] Skipping $Name (directory not found: $DirPath)" -ForegroundColor Gray
        return $null
    }
}

# --- JOB DEFINITIONS ---

# A. Admin Panel (Unit + TSC + Lint)
if ($Target -eq "all" -or $Target -eq "admin-panel") {
    $Jobs += Start-TestJob "admin-unit" "$ProjectRoot/admin-panel" {
        param($root, $log)
        Set-Location "$root/admin-panel"
        # Combine tsc and vitest for a single "Admin Gate" job
        npm run typecheck; if ($LASTEXITCODE -eq 0) { npm run test -- --run } 2>&1 | Out-File "$log/admin-unit.log"
    }
}

# B. Student App (Flutter)
if ($Target -eq "all" -or $Target -eq "questerix-student-app") {
    $Jobs += Start-TestJob "student-unit" "$ProjectRoot/questerix-student-app" {
        param($root, $log)
        Set-Location "$root/questerix-student-app"
        flutter test --no-pub 2>&1 | Out-File "$log/student-unit.log"
    }
}

# C. Backend (Edge Functions)
if ($Target -eq "all") {
    $Jobs += Start-TestJob "edge-functions" "$ProjectRoot/supabase/functions" {
        param($root, $log)
        Set-Location "$root/supabase/functions"
        deno test --allow-all 2>&1 | Out-File "$log/edge-functions.log"
    }
}

# D. Content Engine (Python)
if ($Target -eq "all") {
    $Jobs += Start-TestJob "content-engine" "$ProjectRoot/content-engine" {
        param($root, $log)
        Set-Location "$root/content-engine"
        $py = if (Test-Path ".venv/Scripts/python.exe") { ".venv/Scripts/python.exe" } else { "python" }
        & $py -m pytest -q 2>&1 | Out-File "$log/content-engine.log"
    }
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
    # Check for any failures
    foreach ($j in $Jobs) {
        if ($j.State -eq 'Failed' -or ($j.State -eq 'Completed' -and $j.ChildJobs[0].ExitCode -ne 0)) {
            $FailDetected = $true
            $FailedJob = $j.Name
            $Running = $false
            break
        }
    }

    # Check if all completed
    if ($Running) {
        $Pending = $Jobs | Where-Object { $_.State -eq 'Running' -or $_.State -eq 'NotStarted' }
        if ($Pending.Count -eq 0) {
            $Running = $false
        }
    }

    if ($Running) {
        Start-Sleep -Seconds 2
        $Elapsed += 2
    }
}

# --- CLEANUP & REPORT ---
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

# Kill any surviving jobs (Fail-Fast or Timeout)
$Jobs | Where-Object { $_.State -eq 'Running' } | Stop-Job

if ($FailDetected) {
    Write-Host "`n❌ FAIL-FAST: Job '$FailedJob' failed! Aborting all tests." -ForegroundColor Red
} elseif ($Elapsed -ge $TimeoutSec) {
    Write-Host "`n❌ TIMEOUT: Test gate exceeded ${TimeoutSec}s! Aborting." -ForegroundColor Red
} else {
    Write-Host "`n✅ All parallel jobs completed successfully." -ForegroundColor Green
}

# Summary Table
Write-Host "`nTest Summary (Duration: $($Duration.TotalSeconds.ToString("F1"))s):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"
$FinalExitCode = 0
foreach ($j in $Jobs) {
    $status = if ($j.State -eq 'Completed' -and $j.ChildJobs[0].ExitCode -eq 0) { "PASS" } else { "FAIL" }
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    $exit = if ($j.ChildJobs.Count -gt 0) { $j.ChildJobs[0].ExitCode } else { "N/A" }
    
    Write-Host "[$status] $($j.Name) (Exit: $exit)" -ForegroundColor $color
    if ($status -eq "FAIL") { $FinalExitCode = 1 }
}

Remove-Job $Jobs -Force
exit $FinalExitCode

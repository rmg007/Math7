<#
.SYNOPSIS
    Parallel Test Gate for Questerix.
.DESCRIPTION
    Runs all test suites in parallel with hard timeouts and fail-fast logic.
    Each job is isolated in a temporary script file for maximum reliability.
#>

param(
    [string]$Target = "all",
    [int]$TimeoutSec = 300
)

$ErrorActionPreference = "Continue"
$StartTime = Get-Date

# 1. Setup Logging & Temp Workdir
$ProjectRoot = Resolve-Path "$PSScriptRoot/.."
$LogDir = "$ProjectRoot/questerix-cortex/outputs/logs"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$TempScripts = "$LogDir/tmp_scripts"
if (!(Test-Path $TempScripts)) { New-Item -ItemType Directory -Path $TempScripts -Force | Out-Null }

Write-Host "🚀 Starting Parallel Test Gate (Timeout: ${TimeoutSec}s)..." -ForegroundColor Cyan

$Jobs = @()

# Function to start a test job safely
function Start-TestJob {
    param([string]$Name, [string]$DirPath, [string]$CommandText)
    
    if (Test-Path $DirPath) {
        Write-Host "  [+] Queueing $Name..." -ForegroundColor Gray
        $exitFile = "$LogDir/$Name.exit"
        $logFile = "$LogDir/$Name.log"
        $scriptPath = "$TempScripts/$Name.ps1"
        
        if (Test-Path $exitFile) { Remove-Item $exitFile -Force -ErrorAction SilentlyContinue }
        if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
        
        # Isolation script: runs the command and writes the exit code to the file
        $scriptContent = @"
try {
    Set-Location "$DirPath"
    & { $CommandText } *>> "$logFile"
    `$LASTEXITCODE | Out-File "$exitFile"
} catch {
    `$_.Exception.Message | Out-File "$logFile" -Append
    1 | Out-File "$exitFile"
}
"@
        # Start isolated job using pwsh if available, fallback to powershell
        $exe = if (Get-Command "pwsh" -ErrorAction SilentlyContinue) { "pwsh.exe" } else { "powershell.exe" }
        return Start-Job -Name $Name -ScriptBlock { param($s, $e) & $e -NoProfile -ExecutionPolicy Bypass -File $s } -ArgumentList $scriptPath, $exe
    } else {
        Write-Host "  [-] Skipping $Name (directory not found: $DirPath)" -ForegroundColor Gray
        return $null
    }
}

# --- JOB DEFINITIONS ---

# A. Admin Panel (Unit + TSC)
if ($Target -eq "all" -or $Target -eq "admin-panel") {
    $cmdText = "npm run typecheck; if (`$LASTEXITCODE -eq 0) { npx vitest run --run --no-watch }"
    $Jobs += Start-TestJob "admin-unit" "$ProjectRoot/admin-panel" $cmdText
}

# B. Student App (Flutter)
if ($Target -eq "all" -or $Target -eq "questerix-student-app") {
    $cmdText = "flutter test --no-pub"
    $Jobs += Start-TestJob "student-unit" "$ProjectRoot/questerix-student-app" $cmdText
}

# C. Backend (Edge Functions)
if ($Target -eq "all") {
    $cmdText = "deno test --allow-all"
    $Jobs += Start-TestJob "edge-functions" "$ProjectRoot/supabase/functions" $cmdText
}

# D. Content Engine (Python)
if ($Target -eq "all") {
    $cmdText = "`$py = if (Test-Path '.venv/Scripts/python.exe') { '.venv/Scripts/python.exe' } else { 'python' }; & `$py -m pytest -q"
    $Jobs += Start-TestJob "content-engine" "$ProjectRoot/content-engine" $cmdText
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
            $content = Get-Content $exitFile -ErrorAction SilentlyContinue
            if ($null -ne $content) {
                $ec = $content.ToString().Trim()
                if ($ec -ne "" -and $ec -ne '0') {
                    $FailDetected = $true
                    $FailedJob = $j.Name
                    $Running = $false
                    break
                }
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
    $exitContent = if (Test-Path $exitFile) { Get-Content $exitFile -ErrorAction SilentlyContinue } else { "N/A" }
    $exit = if ($null -ne $exitContent) { $exitContent.ToString().Trim() } else { "N/A" }
    $status = if ($exit -eq '0') { "PASS" } else { "FAIL" }
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $($j.Name) (Exit: $exit)" -ForegroundColor $color
    if ($status -eq "FAIL") { $FinalExitCode = 1 }
}

# Final Pruning
# Remove-Item -Path $TempScripts -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $LogDir -Filter "*.exit" | Remove-Item -Force -ErrorAction SilentlyContinue
Remove-Job $Jobs -Force
exit $FinalExitCode

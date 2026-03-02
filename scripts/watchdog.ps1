<#
.SYNOPSIS
    8-hour watchdog detector for Questerix Deploy Pipeline.
.DESCRIPTION
    Checks if an orchestrator process is still alive after 8 hours.
    Fires a warning if it does not exit.
.EXAMPLE
    ./scripts/watchdog.ps1 -OrchestratorPid 1234 -Target admin-panel
#>

param(
    [Parameter(Mandatory=$true)]
    [int]$OrchestratorPid,
    
    [string]$Target = "unknown"
)

# 1. Setup local logging for watchdog itself
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WatchdogLog = Join-Path (Split-Path -Parent $ScriptDir) "questerix-cortex\outputs\watchdog.log"

function Write-WatchdogLog {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -Path $WatchdogLog -Value "$timestamp [WATCHDOG] $Message" -ErrorAction SilentlyContinue
}

Write-WatchdogLog "Starting 8-hour watchdog for orchestrator PID: $OrchestratorPid (Target: $Target)"

# 2. Wait 8 hours (28,800 seconds)
# But we'll periodically check if the process is STILL alive 
# (if the process dies legitimately, we exit quietly)
$WaitSeconds = 8 * 3600
$Interval = 300 # check every 5 mins

$Elapsed = 0
while ($Elapsed -lt $WaitSeconds) {
    if (-not (Get-Process -Id $OrchestratorPid -ErrorAction SilentlyContinue)) {
        Write-WatchdogLog "Orchestrator PID ($OrchestratorPid) died or exited gracefully. Watchdog exiting."
        exit 0
    }
    
    Start-Sleep -Seconds $Interval
    $Elapsed += $Interval
}

# 3. If we are here, 8 hours passed and PID is STILL alive
Write-WatchdogLog "WATCHDOG TRIGGERED: Orchestrator PID ($OrchestratorPid) still alive after 8 hours!"

# 4. Fire notification
$NotifyScript = Join-Path $ScriptDir "notify.ps1"
if (Test-Path $NotifyScript) {
    # Fires to whatever channel notify.ps1 supports
    & $NotifyScript -Type WATCHDOG -Target $Target -Message "Deploy process has been running for 8 hours (PID: $OrchestratorPid). Check if it is hung."
} else {
    Write-WatchdogLog "Unable to fire notification (notify.ps1 not found)"
}

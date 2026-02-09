<#
.SYNOPSIS
    Registers the Agent Memory Cleanup script as a Windows Scheduled Task.
.DESCRIPTION
    Creates a weekly scheduled task that runs every Sunday at 3:00 AM.
    Run this script ONCE with elevated (Admin) privileges to register the task.
.NOTES
    To unregister: Unregister-ScheduledTask -TaskName "QuesterixAgentCleanup" -Confirm:$false
#>

$TaskName = "QuesterixAgentCleanup"
$ScriptPath = "$env:USERPROFILE\OneDrive\Desktop\Important Projects\Questerix\scripts\maintenance\agent-memory-cleanup.ps1"

# Validate script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Error "Cleanup script not found at: $ScriptPath"
    exit 1
}

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Define the action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -RetainDays 3 -RetainSessions 15"

# Define the trigger: Weekly on Sunday at 3:00 AM
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "3:00AM"

# Define settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

# Register the task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Weekly cleanup of Questerix agent persistent memory (.gemini/antigravity/brain). Strips media, prunes stale sessions, recovers disk space." `
    -RunLevel Limited

Write-Host ""
Write-Host "Task '$TaskName' registered successfully!" -ForegroundColor Green
Write-Host "Schedule: Every Sunday at 3:00 AM"
Write-Host "Script:   $ScriptPath"
Write-Host ""
Write-Host "To test now (dry run):  & '$ScriptPath' -DryRun -Verbose"
Write-Host "To test now (live):     & '$ScriptPath' -Verbose"
Write-Host "To unregister:          Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"

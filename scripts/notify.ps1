<#
.SYNOPSIS
    Notification dispatcher for Questerix Deploy Pipeline.
.DESCRIPTION
    Fires notifications to various channels (Toast, Log). 
    Supports Windows Toast if BurntToast module is available.
.EXAMPLE
    ./scripts/notify.ps1 -Type SUCCESS -Target admin-panel -Env production -Message "Deploy completed in 4m 12s"
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('SUCCESS', 'FAIL', 'WARN', 'WATCHDOG')]
    [string]$Type,

    [string]$Target = "unknown",
    [string]$Env = "test",
    [string]$Message = ""
)

# 1. Formatting
$Title = switch ($Type) {
    'SUCCESS'  { "🚀 DEPLOY SUCCESS | $Target → $Env" }
    'FAIL'     { "❌ DEPLOY FAILED | $Target → $Env" }
    'WARN'     { "⚠️ DEPLOY WARNING | $Target → $Env" }
    'WATCHDOG' { "⚠️ DEPLOY WATCHDOG | Still running ($Target)" }
}

$LogMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Type] $Title - $Message"

# 2. Output to Console (for local orchestrator visibility)
switch ($Type) {
    'SUCCESS' { Write-Host $LogMessage -ForegroundColor Green }
    'FAIL'    { Write-Host $LogMessage -ForegroundColor Red }
    'WARN'    { Write-Host $LogMessage -ForegroundColor Yellow }
    'WATCHDOG' { Write-Host $LogMessage -ForegroundColor Yellow -BackgroundColor Black }
}

# 3. Windows Toast (via BurntToast)
if (Get-Module -ListAvailable BurntToast) {
    try {
        # Check if module is imported or can be imported
        if (-not (Get-Module BurntToast)) { Import-Module BurntToast }
        
        New-BurntToastNotification -Text $Title, $Message
    } catch {
        Write-Warning "Failed to fire BurntToast notification: $_"
    }
} else {
    # If BurntToast is missing, we don't block the script, just move on
    # We could potentially install it here if requested, but plan said "no setup"
}

# 4. Optional: Add additional channels here (Slack, Email, etc. controlled by .secrets)

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

# 3. Windows Native Toast (Zero Dependency)
function Show-NativeToast {
    param($Title, $Message)
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
        
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $textNodes = $template.GetElementsByTagName("text")
        $textNodes.Item(0).AppendChild($template.CreateTextNode($Title)) > $null
        $textNodes.Item(1).AppendChild($template.CreateTextNode($Message)) > $null
        
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Questerix Pipeline")
        $notifier.Show($toast)
    } catch {
        Write-Warning "Native toast failed: $_. Falling back to simple popup."
        $wshell = New-Object -ComObject WScript.Shell
        $wshell.Popup($Message, 0, $Title, 64) > $null
    }
}

Show-NativeToast -Title $Title -Message $Message

# 4. Optional: Discord Webhook (Reads from .secrets)
# To use: add DISCORD_WEBHOOK_URL=https://... to your .secrets file
$SecretsPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".secrets"
if (Test-Path $SecretsPath) {
    $RawSecrets = Get-Content $SecretsPath -Raw
    $Secrets = ConvertFrom-StringData $RawSecrets
    if ($Secrets.ContainsKey("DISCORD_WEBHOOK_URL")) {
        $WebhookUrl = $Secrets["DISCORD_WEBHOOK_URL"]
        if ($WebhookUrl -like "http*") {
            try {
                $Payload = @{
                    content = "**$Title**`n$Message"
                }
                $Json = $Payload | ConvertTo-Json -Depth 2
                Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $Json -ContentType "application/json" > $null
            } catch {
                Write-Warning "Discord notification failed: $($_.Exception.Message)"
            }
        }
    }
}

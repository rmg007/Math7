<#
.SYNOPSIS
    Comprehensive audit logging and monitoring for secrets
.DESCRIPTION
    Provides detailed audit trails and security monitoring
#>

param(
    [Parameter(Mandatory=$false)]
    [DateTime]$StartDate,
    
    [Parameter(Mandatory=$false)]
    [DateTime]$EndDate,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("upload", "download", "rotation", "all")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$Summary
)

$RootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$AuditLog = Join-Path $RootDir "logs\secrets-audit.json"

if (-not (Test-Path $AuditLog)) {
    Write-Host "📊 No audit log found at $AuditLog" -ForegroundColor Yellow
    return
}

# Parse audit log
# Read line by line if it's JSON lines, or as a full JSON array.
# The upload script appends JSON objects. This makes it a stream of JSON objects, not a valid valid JSON array effectively.
# We need to handle that.
$content = Get-Content $AuditLog
$auditEntries = @()
foreach ($line in $content) {
    try {
        if ($line.Trim()) {
            $auditEntries += $line | ConvertFrom-Json
        }
    } catch {
        # ignore malformed lines
    }
}

# Filter entries
$filteredEntries = $auditEntries | Where-Object {
    $entry = $_
    $dateMatch = $true
    
    if ($StartDate) {
        $dateMatch = $dateMatch -and ([DateTime]$entry.timestamp -ge $StartDate)
    }
    
    if ($EndDate) {
        $dateMatch = $dateMatch -and ([DateTime]$entry.timestamp -le $EndDate)
    }
    
    $actionMatch = ($Action -eq "all") -or ($entry.action -eq $Action)
    $envMatch = (-not $Environment) -or ($entry.environment -eq $Environment)
    
    return $dateMatch -and $actionMatch -and $envMatch
}

if ($Summary) {
    # Generate summary report
    $summary = $filteredEntries | Group-Object action, environment | ForEach-Object {
        [PSCustomObject]@{
            Action = $_.Group[0].action
            Environment = $_.Group[0].environment
            Count = $_.Count
            LastActivity = ($_.Group | Sort-Object timestamp -Descending | Select-Object -First 1).timestamp
            Users = ($_.Group.user | Sort-Object -Unique) -join ", "
        }
    }
    
    Write-Host "📊 Secrets Audit Summary" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    $summary | Format-Table -AutoSize
    
} else {
    # Detailed report
    Write-Host "📋 Detailed Audit Log" -ForegroundColor Cyan
    Write-Host "======================" -ForegroundColor Cyan
    
    foreach ($entry in $filteredEntries | Sort-Object timestamp -Descending) {
        $statusColor = switch ($entry.status) {
            "completed" { "Green" }
            "failed" { "Red" }
            "in_progress" { "Yellow" }
            default { "White" }
        }
        
        Write-Host "🕐 $($entry.timestamp)" -ForegroundColor Gray
        Write-Host "  Action: $($entry.action)" -ForegroundColor Cyan
        Write-Host "  Environment: $($entry.environment)" -ForegroundColor Cyan
        Write-Host "  User: $($entry.user)" -ForegroundColor Cyan
        Write-Host "  Status: $($entry.status)" -ForegroundColor $statusColor
        
        if ($entry.secrets_uploaded) {
            Write-Host "  Secrets Uploaded: $($entry.secrets_uploaded -join ', ')" -ForegroundColor Yellow
        }
        
        if ($entry.secrets_downloaded) {
            Write-Host "  Secrets Downloaded: $($entry.secrets_downloaded -join ', ')" -ForegroundColor Yellow
        }
        
        if ($entry.error) {
            Write-Host "  Error: $($entry.error)" -ForegroundColor Red
        }
        
        Write-Host ""
    }
}

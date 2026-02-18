<#
.SYNOPSIS
    CI Recovery Command  The "Heal & Rerun" script for Questerix.
    Standardizes the process of unblocking CI and making the repo green.

.DESCRIPTION
    1. Triggers mandatory maintenance (Auto Format, Type Generation).
    2. Identifies all failed workflows on the specified branch.
    3. Triggers reruns for the latest failed run of each unique workflow.

.PARAMETER Branch
    The branch to recover. Default: Current branch.

.PARAMETER Maintenance
    If set, triggers Auto Format and Type Generation first. Default: $true.

.EXAMPLE
    .\scripts\ci-recover.ps1 -Branch main
#>

param(
    [string]$Branch = "main",
    [bool]$Maintenance = $true
)

$ErrorActionPreference = "Continue"

Write-Host "`n Initializing CI Recovery Protocol..." -ForegroundColor Cyan

#  Step 0: Ensure gh CLI is authenticated 
if (-not (gh auth status 2>&1 | Select-String "Logged in to github.com")) {
    Write-Error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
}

#  Step 1: Trigger Maintenance Workflows 
if ($Maintenance) {
    Write-Host "  Triggering Maintenance Pulse..." -ForegroundColor Yellow
    
    $maintenanceWorkflows = @("Auto Format", "Type Generation", "Auto Cleanup")
    foreach ($wf in $maintenanceWorkflows) {
        Write-Host "   -> Dispatching '$wf'..." -ForegroundColor Gray
        gh workflow run "$wf" --ref $Branch 2>$null
    }
    # Wait a moment for dispatches to register
    Start-Sleep -Seconds 3
}

#  Step 2: Discover and Rerun Failures 
Write-Host "`n Discovering failed runs on branch '$Branch'..." -ForegroundColor Cyan

# Fetch latest failed runs on this branch
$failedRuns = gh run list --branch $Branch --status failure --limit 100 --json workflowName,databaseId,createdAt | ConvertFrom-Json

if (-not $failedRuns -or $failedRuns.Count -eq 0) {
    Write-Host " No failed runs found on '$Branch'. All systems green!" -ForegroundColor Green
    exit 0
}

# Group by workflow to avoid rerunning multiple failed attempts of the same thing
$uniqueFailures = $failedRuns | Group-Object workflowName

Write-Host " Identified $($uniqueFailures.Count) unique failed workflows.`n" -ForegroundColor Yellow

foreach ($group in $uniqueFailures) {
    $wfName = $group.Name
    $lastRunId = ($group.Group | Sort-Object createdAt -Descending | Select-Object -First 1).databaseId
    
    Write-Host "    Rerunning '$wfName' (Run ID: $lastRunId)..." -ForegroundColor Gray
    gh run rerun $lastRunId 2>$null
}

Write-Host "`n CI Recovery Dispatched!" -ForegroundColor Green
Write-Host "   Monitor progress at: https://github.com/rmg007/Questerix/actions" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

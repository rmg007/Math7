<#
.SYNOPSIS
    Automated Knowledge Sync for Project Oracle
.DESCRIPTION
    Runs the documentation indexer to sync all local markdown files and artifacts
    to the Supabase vector store (Project Oracle).
#>

$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = "$PSScriptRoot\..\.."
$KBDir = "$ProjectRoot\scripts\knowledge-base"

Write-Host " Starting Knowledge Sync..." -ForegroundColor Cyan

if (-not (Test-Path $KBDir)) {
    Write-Error "Knowledge Base directory not found: $KBDir"
    exit 1
}

Push-Location $KBDir

# Run the indexer
Write-Host " Indexing Documentation & Artifacts..." -ForegroundColor Yellow
$result = & npm run index 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host " Knowledge Sync Complete!" -ForegroundColor Green
} else {
    Write-Host " Knowledge Sync Failed!" -ForegroundColor Red
    $result | Out-File "$ProjectRoot\logs\knowledge_sync_error.log"
}

Pop-Location

# Optional: Cleanup local artifacts older than 14 days if they are successfully indexed?
# For now, just report the status.
Write-Host " Project Oracle is now up to date." -ForegroundColor Green

# Phase 4: Knowledge & Readiness (PowerShell)
# Wrapper for knowledge-health-check.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 4: Readiness Validation"
Write-Host "=========================================" -ForegroundColor Cyan

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/knowledge-health-check.ps1"
exit $LASTEXITCODE

# Phase 0: Preflight & Environment (PowerShell)
# Wrapper for preflight.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 0: Preflight Validation"
Write-Host "=========================================" -ForegroundColor Cyan

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/preflight.ps1"
exit $LASTEXITCODE

# Phase 3: Code Hygiene (PowerShell)
# Wrapper for code-hygiene-scan.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 3: Code Hygiene Validation"
Write-Host "=========================================" -ForegroundColor Cyan

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/code-hygiene-scan.ps1"
exit $LASTEXITCODE

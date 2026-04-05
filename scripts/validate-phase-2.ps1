# Phase 2: Smoke & Security (PowerShell)
# Wrapper for smoke-gate.ps1 and run-security-tests.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 2: Smoke & Security Validation"
Write-Host "=========================================" -ForegroundColor Cyan

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/smoke-gate.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/run-security-tests.ps1"
exit $LASTEXITCODE

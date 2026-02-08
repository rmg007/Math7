<#
.SYNOPSIS
    Master script to generate all platform-specific theme files from design tokens.

.DESCRIPTION
    Runs all generator scripts to produce Flutter, Tailwind, and CSS outputs.

.EXAMPLE
    pwsh design-system/generators/generate-all.ps1
#>

param(
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      QUESTERIX UNIFIED DESIGN SYSTEM - TOKEN GENERATOR       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$GeneratorsDir = Join-Path $ProjectRoot "design-system/generators"

# Track timing
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# Run Flutter generator
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🎯 [1/2] Generating Flutter theme files..." -ForegroundColor White
& (Join-Path $GeneratorsDir "generate-flutter.ps1") -ProjectRoot $ProjectRoot

Write-Host ""

# Run Tailwind generator
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🎯 [2/2] Generating Tailwind/CSS files..." -ForegroundColor White
& (Join-Path $GeneratorsDir "generate-tailwind.ps1") -ProjectRoot $ProjectRoot

$stopwatch.Stop()

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🎉 All design tokens generated successfully!" -ForegroundColor Green
Write-Host "   Time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 Generated outputs:" -ForegroundColor White
Write-Host "   Flutter: student-app/lib/src/core/theme/generated/" -ForegroundColor Gray
Write-Host "   Tailwind: design-system/generated/" -ForegroundColor Gray
Write-Host ""

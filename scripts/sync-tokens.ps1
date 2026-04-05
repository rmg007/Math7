# Sync Design Tokens across Questerix repositories.
# Supports QuesterixFull layout (monorepo) or Questerix-only checkout with sibling repos.

$RepoRoot = Resolve-Path "$PSScriptRoot/.."
$MonorepoRoot = Resolve-Path "$PSScriptRoot/../.."

$Source = $null
$Targets = @()

if (Test-Path "$MonorepoRoot/Questerix/design-system/generated/css-variables.css") {
    $Source = "$MonorepoRoot/Questerix/design-system/generated/css-variables.css"
    $Targets = @(
        "$MonorepoRoot/questerix-landing-pages/src/styles/tokens.css",
        "$MonorepoRoot/questerix-help-docs/.vitepress/theme/vars.css"
    )
}
elseif (Test-Path "$RepoRoot/design-system/generated/css-variables.css") {
    $Source = "$RepoRoot/design-system/generated/css-variables.css"
    $Targets = @(
        "$RepoRoot/../questerix-landing-pages/src/styles/tokens.css",
        "$RepoRoot/../questerix-help-docs/.vitepress/theme/vars.css"
    )
}

if (-not $Source) {
    Write-Error "Source design tokens not found (expected under design-system/generated/css-variables.css)."
    exit 1
}

foreach ($Target in $Targets) {
    $TargetDir = Split-Path $Target -Parent
    if (Test-Path $TargetDir) {
        Write-Host "Syncing to $Target..." -ForegroundColor Cyan
        Copy-Item -Path $Source -Destination $Target -Force
    }
    else {
        Write-Warning "Target directory $TargetDir does not exist, skipping."
    }
}

Write-Host "Design tokens synced successfully!" -ForegroundColor Green

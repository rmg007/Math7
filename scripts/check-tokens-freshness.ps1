# Check if Design Tokens are synced across Questerix repositories.
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

$Errors = 0
$Checked = 0

foreach ($Target in $Targets) {
    if (Test-Path $Target) {
        $Checked++
        $SourceHash = (Get-FileHash $Source).Hash
        $TargetHash = (Get-FileHash $Target).Hash

        if ($SourceHash -ne $TargetHash) {
            Write-Error "Design tokens out of sync at $Target. Run scripts/sync-tokens.ps1 to fix."
            $Errors++
        }
        else {
            Write-Host "OK: $Target is in sync." -ForegroundColor Green
        }
    }
    else {
        Write-Warning "Target file $Target does not exist, skipping check."
    }
}

if ($Checked -eq 0) {
    Write-Host "No consumer token files in workspace; skipping cross-repo hash check (source present at $Source)." -ForegroundColor Cyan
}

if ($Errors -gt 0) {
    exit 1
}

exit 0

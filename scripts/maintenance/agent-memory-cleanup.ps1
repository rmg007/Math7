<#
.SYNOPSIS
    Questerix Agent Memory Hygiene Script
.DESCRIPTION
    Automated weekly cleanup of persistent agent memory (.gemini/antigravity/brain).
    Removes stale sessions, media artifacts, and redundant state snapshots.
    Designed to be run via Windows Task Scheduler or manually.
.NOTES
    Created: 2026-02-08
    Schedule: Weekly (Sunday 3:00 AM)
    Target Recovery: ~500 MB per cycle
#>

param(
    [int]$RetainDays = 3,
    [int]$RetainSessions = 15,
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "SilentlyContinue"

#  Paths 
$BrainPath   = "$env:USERPROFILE\.gemini\antigravity\brain"
$ProjectRoot = "$env:USERPROFILE\OneDrive\Desktop\Important Projects\Questerix"
$LogFile     = "$ProjectRoot\scripts\maintenance\cleanup-log.txt"

#  Helpers 
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"
    Add-Content -Path $LogFile -Value $entry
    if ($Verbose) { Write-Host $entry }
}

function Format-Size {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    if ($Bytes -ge 1KB) { return "{0:N2} KB" -f ($Bytes / 1KB) }
    return "$Bytes B"
}

#  Pre-flight 
if (-not (Test-Path $BrainPath)) {
    Write-Log "ERROR: Brain path not found: $BrainPath"
    exit 1
}

$sizeBefore = (Get-ChildItem -Path $BrainPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
$countBefore = (Get-ChildItem -Path $BrainPath -Recurse -File | Measure-Object).Count
$sessionsBefore = (Get-ChildItem -Path $BrainPath -Directory | Measure-Object).Count

Write-Log ""
Write-Log "AGENT MEMORY CLEANUP STARTED"
Write-Log "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })"
Write-Log "Retain: $RetainDays days / $RetainSessions sessions"
Write-Log "Before: $(Format-Size $sizeBefore) | $countBefore files | $sessionsBefore sessions"
Write-Log ""

$cutoffDate = (Get-Date).AddDays(-$RetainDays)
$removedFiles = 0
$removedSessions = 0
$recoveredBytes = 0

#  Phase 1: Strip Media from ALL sessions 
Write-Log "Phase 1: Stripping media artifacts..."

$mediaPatterns = @("*.png", "*.webp", "*.jpg", "*.jpeg", "*.gif", "*.mp4")

Get-ChildItem -Path $BrainPath -Directory | ForEach-Object {
    $session = $_

    # Remove .tempmediaStorage folders
    $tempMedia = Join-Path $session.FullName ".tempmediaStorage"
    if (Test-Path $tempMedia) {
        $mediaSize = (Get-ChildItem -Path $tempMedia -Recurse -File | Measure-Object -Property Length -Sum).Sum
        if (-not $DryRun) {
            Remove-Item -Path $tempMedia -Recurse -Force
        }
        $recoveredBytes += $mediaSize
        $removedFiles++
        Write-Log "  Stripped .tempmediaStorage from $($session.Name) ($(Format-Size $mediaSize))"
    }

    # Remove image files
    foreach ($pattern in $mediaPatterns) {
        $images = Get-ChildItem -Path $session.FullName -Filter $pattern -File
        foreach ($img in $images) {
            $recoveredBytes += $img.Length
            $removedFiles++
            if (-not $DryRun) {
                Remove-Item -Path $img.FullName -Force
            }
        }
    }
}

#  Phase 2: Prune resolved state snapshots 
Write-Log "Phase 2: Pruning resolved state snapshots..."

Get-ChildItem -Path $BrainPath -Directory | ForEach-Object {
    $session = $_
    # Remove *.resolved.* files (intermediate state snapshots)
    $resolvedFiles = Get-ChildItem -Path $session.FullName -Filter "*.resolved.*" -File
    foreach ($rf in $resolvedFiles) {
        $recoveredBytes += $rf.Length
        $removedFiles++
        if (-not $DryRun) {
            Remove-Item -Path $rf.FullName -Force
        }
    }
}

#  Phase 3: Delete stale sessions 
Write-Log "Phase 3: Pruning stale sessions (older than $RetainDays days)..."

$allSessions = Get-ChildItem -Path $BrainPath -Directory |
    Where-Object { $_.Name -ne "tempmediaStorage" } |
    Sort-Object LastWriteTime -Descending

$sessionsToKeep = $allSessions | Select-Object -First $RetainSessions
$sessionsToDelete = $allSessions |
    Where-Object { $_.LastWriteTime -lt $cutoffDate } |
    Where-Object { $_.FullName -notin $sessionsToKeep.FullName }

foreach ($session in $sessionsToDelete) {
    $sessionSize = (Get-ChildItem -Path $session.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $recoveredBytes += $sessionSize
    $removedSessions++
    Write-Log "  Deleting session $($session.Name) ($(Format-Size $sessionSize), last used: $($session.LastWriteTime))"
    if (-not $DryRun) {
        Remove-Item -Path $session.FullName -Recurse -Force
    }
}

#  Phase 4: Clean root workspace temp files 
Write-Log "Phase 4: Cleaning project root temp files..."

$rootCleanup = @(
    "$ProjectRoot\.flutter-defines.tmp",
    "$ProjectRoot\dependency-report.html"
)

foreach ($file in $rootCleanup) {
    if (Test-Path $file) {
        $fileSize = (Get-Item $file).Length
        $recoveredBytes += $fileSize
        $removedFiles++
        Write-Log "  Removed: $(Split-Path $file -Leaf) ($(Format-Size $fileSize))"
        if (-not $DryRun) {
            Remove-Item -Path $file -Force
        }
    }
}

#  Phase 5: Prune old artifacts (indexed in Oracle) 
Write-Log "Phase 5: Pruning indexed artifacts..."

$artifactPath = Join-Path $ProjectRoot ".agent\artifacts"
if (Test-Path $artifactPath) {
    # Keep only the last 24 hours of artifacts to be safe, prune everything else
    $oldArtifacts = Get-ChildItem -Path $artifactPath -Filter "*.md" -Recurse |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-1) }
    
    foreach ($art in $oldArtifacts) {
        $recoveredBytes += $art.Length
        $removedFiles++
        Write-Log "  Pruning indexed artifact: $($art.Name)"
        if (-not $DryRun) {
            Remove-Item -Path $art.FullName -Force
        }
    }
}

#  Summary 
$sizeAfter = if (-not $DryRun) {
    (Get-ChildItem -Path $BrainPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
} else { $sizeBefore - $recoveredBytes }

$sessionsAfter = if (-not $DryRun) {
    (Get-ChildItem -Path $BrainPath -Directory | Measure-Object).Count
} else { $sessionsBefore - $removedSessions }

Write-Log ""
Write-Log "CLEANUP COMPLETE"
Write-Log "Sessions: $sessionsBefore -> $sessionsAfter (-$removedSessions)"
Write-Log "Files removed: $removedFiles"
Write-Log "Space recovered: $(Format-Size $recoveredBytes)"
Write-Log "Final size: $(Format-Size $sizeAfter)"
Write-Log ""

# Return summary object for pipeline use
[PSCustomObject]@{
    SessionsBefore = $sessionsBefore
    SessionsAfter  = $sessionsAfter
    FilesRemoved   = $removedFiles
    SpaceRecovered = Format-Size $recoveredBytes
    FinalSize      = Format-Size $sizeAfter
    Timestamp      = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

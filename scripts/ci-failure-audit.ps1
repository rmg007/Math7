<#
.SYNOPSIS
    Forensic CI Failure Audit  Bulk sweep of all failed GitHub Actions runs.
    Implements the "ChatGPT Playbook" Steps 1-4 locally.

.DESCRIPTION
    1. Pulls the last N failed runs from GitHub Actions via `gh` CLI.
    2. Downloads the failed-step logs for each run.
    3. Extracts error signatures and generates SHA-256 hashes.
    4. Groups failures by signature hash into "buckets."
    5. Outputs a summary report showing unique root causes.

.PARAMETER Limit
    Maximum number of failed runs to fetch. Default: 200.

.PARAMETER OutputDir
    Directory to store logs and signatures. Default: _gh_failures

.EXAMPLE
    .\ci-failure-audit.ps1 -Limit 50
#>

param(
    [int]$Limit = 200,
    [string]$OutputDir = "_gh_failures"
)

$ErrorActionPreference = "Continue"

#  Step 0: Ensure gh CLI is available 
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is not installed. Install from https://cli.github.com/"
    exit 1
}

#  Step 1: Create output directories 
$logsDir = Join-Path $OutputDir "logs"
$sigsDir = Join-Path $OutputDir "signatures"
$groupsDir = Join-Path $OutputDir "groups"

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
New-Item -ItemType Directory -Path $sigsDir -Force | Out-Null
New-Item -ItemType Directory -Path $groupsDir -Force | Out-Null

Write-Host "`n CI Failure Forensic Audit" -ForegroundColor Cyan
Write-Host "   Fetching up to $Limit failed runs...`n" -ForegroundColor Gray

#  Step 2: Get the master list of failed runs 
$masterList = gh run list --status failure --limit $Limit --json databaseId,workflowName,displayTitle,headBranch,headSha,createdAt,url | ConvertFrom-Json

if (-not $masterList -or $masterList.Count -eq 0) {
    Write-Host " No failed runs found! Repository is healthy." -ForegroundColor Green
    exit 0
}

Write-Host " Found $($masterList.Count) failed runs across all workflows.`n" -ForegroundColor Yellow

# Save master list
$masterList | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $OutputDir "master_list.json")

#  Step 3: Download failed logs and extract signatures 
$progress = 0
foreach ($run in $masterList) {
    $progress++
    $runId = $run.databaseId
    $logFile = Join-Path $logsDir "$runId.log"
    $sigFile = Join-Path $sigsDir "$runId.sig"

    Write-Progress -Activity "Downloading failure logs" -Status "Run $runId ($progress/$($masterList.Count))" -PercentComplete (($progress / $masterList.Count) * 100)

    # Download failed logs
    if (-not (Test-Path $logFile)) {
        try {
            gh run view $runId --log-failed 2>&1 | Out-File -FilePath $logFile -Encoding utf8
        } catch {
            "Could not fetch logs for run $runId" | Out-File -FilePath $logFile -Encoding utf8
        }
    }

    # Extract error signature lines
    if (Test-Path $logFile) {
        $errorLines = Get-Content $logFile |
            Where-Object { $_ -match "Error:|ERROR|FATAL|failed|exit code|Traceback|AssertionError|Unhandled|panic:|Cannot find|Module not found|TypeError|ReferenceError|SyntaxError" } |
            ForEach-Object {
                # Strip timestamps and ANSI codes
                $_ -replace '\d{4}-\d{2}-\d{2}T[\d:.]+Z', '' -replace '\x1b\[[0-9;]*m', '' |
                ForEach-Object { $_.Trim() }
            } |
            Select-Object -Last 50

        if ($errorLines -and $errorLines.Count -gt 0) {
            $errorLines | Out-File -FilePath $sigFile -Encoding utf8
        } else {
            # Fallback: use workflow name + last 20 lines
            "$($run.workflowName)::fallback" | Out-File -FilePath $sigFile -Encoding utf8
            Get-Content $logFile | Select-Object -Last 20 | Add-Content -Path $sigFile -Encoding utf8
        }
    }
}

Write-Progress -Activity "Downloading failure logs" -Completed

#  Step 4: Group by signature hash into buckets 
Write-Host "`n  Grouping failures into buckets by signature hash...`n" -ForegroundColor Cyan

$buckets = @{}

foreach ($sigFile in Get-ChildItem $sigsDir -Filter "*.sig") {
    $runId = $sigFile.BaseName
    $content = Get-Content $sigFile.FullName -Raw
    $hash = [System.BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash(
            [System.Text.Encoding]::UTF8.GetBytes($content)
        )
    ).Replace("-", "").ToLower().Substring(0, 8)

    if (-not $buckets.ContainsKey($hash)) {
        $buckets[$hash] = @{
            Hash = $hash
            RunIds = @()
            SampleSignature = $content.Substring(0, [Math]::Min(500, $content.Length))
            Workflows = @()
        }
    }
    $buckets[$hash].RunIds += $runId

    # Find the workflow name for this run
    $runData = $masterList | Where-Object { "$($_.databaseId)" -eq $runId }
    if ($runData) {
        $wfName = $runData.workflowName
        if ($buckets[$hash].Workflows -notcontains $wfName) {
            $buckets[$hash].Workflows += $wfName
        }
    }
}

#  Step 5: Generate the summary report 
$reportPath = Join-Path $OutputDir "AUDIT_REPORT.md"

$report = @"
#  CI Failure Forensic Audit Report

**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Total Failed Runs Analyzed**: $($masterList.Count)
**Unique Failure Buckets**: $($buckets.Count)

---

"@

$sortedBuckets = $buckets.GetEnumerator() | Sort-Object { $_.Value.RunIds.Count } -Descending

foreach ($entry in $sortedBuckets) {
    $bucket = $entry.Value
    $runCount = $bucket.RunIds.Count
    $severity = if ($runCount -ge 10) { " CRITICAL" } elseif ($runCount -ge 5) { " HIGH" } elseif ($runCount -ge 2) { " MEDIUM" } else { " LOW" }

    $report += @"

## $severity Bucket ``$($bucket.Hash)``  $runCount run(s)

**Workflows**: $($bucket.Workflows -join ', ')
**Affected Runs**: $($bucket.RunIds | Select-Object -First 5 | ForEach-Object { "[$_](https://github.com/$($env:GH_REPO ?? 'rmg007/Questerix')/actions/runs/$_)" } | Join-String -Separator ', ')$(if ($runCount -gt 5) { " ... and $($runCount - 5) more" })

<details>
<summary>Error Signature (click to expand)</summary>

``````
$($bucket.SampleSignature)
``````

</details>

---

"@
}

$report | Set-Content $reportPath -Encoding utf8

#  Console Summary 
Write-Host "" -ForegroundColor White
Write-Host " FORENSIC AUDIT COMPLETE" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host ""
Write-Host "  Total Failed Runs:     $($masterList.Count)" -ForegroundColor White
Write-Host "  Unique Root Causes:    $($buckets.Count)" -ForegroundColor White
Write-Host ""

foreach ($entry in $sortedBuckets) {
    $bucket = $entry.Value
    $runCount = $bucket.RunIds.Count
    $icon = if ($runCount -ge 10) { "" } elseif ($runCount -ge 5) { "" } elseif ($runCount -ge 2) { "" } else { "" }
    Write-Host "  $icon [$($bucket.Hash)] $runCount run(s)  $($bucket.Workflows -join ', ')" -ForegroundColor $(if ($runCount -ge 5) { "Red" } elseif ($runCount -ge 2) { "Yellow" } else { "Gray" })
}

Write-Host ""
Write-Host "   Full report: $reportPath" -ForegroundColor Cyan
Write-Host "   Logs dir:    $logsDir" -ForegroundColor Cyan
Write-Host "   Signatures:  $sigsDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "" -ForegroundColor White

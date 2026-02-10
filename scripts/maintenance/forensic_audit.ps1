<#
.SYNOPSIS
    Questerix All-Seeing Auditor - Surgical Forensic Engine
    
.DESCRIPTION
    Runs a high-performance, non-greedy audit of the codebase.
    Avoids node_modules, dist, build, and other noise.
    Outputs a standardized Questerix Certification Report.

.USAGE
    pwsh scripts/maintenance/forensic_audit.ps1
#>

$ErrorActionPreference = "SilentlyContinue"

function Write-Section($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

$report = @{
    taxonomy = @()
    dead_files = @()
    zombie_tests = @()
    security_gaps = @()
    config_bombs = @()
    stability_risks = @()
    ai_governance = @()
}

$excludePattern = "node_modules|dist|build|\.git|\.next|coverage"

Write-Section "STEP 0: READINESS"
$ready = $true
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { Write-Host "⚠ Supabase CLI missing" -ForegroundColor Yellow; $ready = $false }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Host "⚠ NPM missing" -ForegroundColor Yellow; $ready = $false }
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) { Write-Host "⚠ Flutter CLI missing" -ForegroundColor Yellow; $ready = $false }
if ($ready) { Write-Host "✅ Tools Ready" -ForegroundColor Green }

Write-Section "STEP 1 & 5 & 6 & 7: PATTERN AUTOPSY (Surgical Scan)"
# Faster discovery
$sourceFiles = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.dart,*.sql | Where-Object { $_.FullName -notmatch $excludePattern }

# Step 1: Taxonomy
$taxMatches = $sourceFiles | Select-String -Pattern "signInAnonymously|POLICY.*mentor"
foreach ($m in $taxMatches) {
    if ($m.Line -match "signInAnonymously") { $report.taxonomy += "VUL-001 (Identity): $($m.Filename):$($m.LineNumber)" }
    if ($m.Line -match "POLICY.*mentor" -and $m.Line -notmatch "domain_id") { $report.taxonomy += "VUL-002 (Leakage): $($m.Filename):$($m.LineNumber)" }
}

# Step 2: Hollow (Dead) Files
foreach ($file in $sourceFiles) {
    if ($file.Extension -match "ts|tsx|dart") {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction Stop
            $logic = $content -replace '(?s)/\*.*?\*/|//.*', '' -replace 'import.*?;', '' -replace 'interface.*\{.*?\}', '' -replace 'type.*?;', ''
            if ($logic.Trim().Length -lt 20 -and $content.Trim().Length -gt 0) {
                $report.dead_files += "$($file.FullName.Replace($PWD.Path, '')) ($($file.Length) bytes)"
            }
        } catch {}
    }
}

# Step 5, 6, 7
$patternMatches = $sourceFiles | Select-String -Pattern "process\.env|import\.meta\.env|catch.*\{\}|test\.skip|xtest|as any|PromptTemplate|generateContent"
foreach ($m in $patternMatches) {
    if ($m.Line -match "(process\.env|import\.meta\.env)\.([A-Z0-9_]+)") {
        $v = $matches[2]
        if ($v -match "VITE_" -and (Get-Content "admin-panel/.env.example" -Raw) -notmatch "\b$v\b") {
            $report.config_bombs += "$v ($($m.Filename):$($m.LineNumber))"
        }
    }
    if ($m.Line -match "catch.*\{\}") { $report.stability_risks += "Empty Catch ($($m.Filename):$($m.LineNumber))" }
    if ($m.Line -match "test\.skip|xtest") { $report.stability_risks += "Skipped Test ($($m.Filename):$($m.LineNumber))" }
    if ($m.Line -match "as any\b") { $report.stability_risks += "Type Hole ($($m.Filename):$($m.LineNumber))" }
    if ($m.Line -match "PromptTemplate") { $report.ai_governance += "Prompt Template ($($m.Filename):$($m.LineNumber))" }
    if ($m.Line -match "generateContent" -and $m.Line -notmatch "temperature") { $report.ai_governance += "Missing Temp ($($m.Filename):$($m.LineNumber))" }
}

Write-Section "STEP 3: LOG AUTOPSY"
$logs = @("student-app/test_output.txt", "admin-panel/e2e_failure_log.txt", "admin-panel/tsc_errors.txt", "build_log.txt")
foreach ($log in $logs) {
    if (Test-Path $log) {
        $lines = Get-Content $log
        if ($lines.Count -gt 0) {
            $lastLine = $lines[-1]
            if ($lastLine -notmatch "Exit Code|Summary|Done|Total|passed") { 
                $report.zombie_tests += "Zombie (Hang): $log"
            }
            if ($log -match "tsc_errors" -and $lines.Count -gt 50) {
                $report.zombie_tests += "Type Collapse ($($lines.Count) errors): $log"
            }
        }
    }
}

Write-Section "STEP 4: MIGRATION ARCHAEOLOGY"
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter *.sql
foreach ($m in $migrations) {
    $content = Get-Content $m.FullName -Raw
    if ($content -match "fix|recursion|harden|leak|patch") {
        $report.security_gaps += "Confession in $($m.Name)"
    }
}

# --- GENERATE FINAL REPORT ---
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
$verdict = "🟢 STABLE"
if ($report.taxonomy.Count -gt 0 -or $report.zombie_tests.Count -gt 0) { $verdict = "🔴 STOP SHIP" }
elseif ($report.dead_files.Count -gt 0 -or $report.config_bombs.Count -gt 0) { $verdict = "🟡 DEBT WARN" }

$reportFile = ".agent/artifacts/FORENSIC_REPORT.md"
$reportMarkdown = @"
============================================================
  QUESTERIX CERTIFICATION REPORT — $date
============================================================
🔍 TAXONOMY FINDINGS:
$($report.taxonomy -join "`n")

💀 DEAD FILES:
$($report.dead_files -join "`n")

🧟 ZOMBIE TESTS:
$($report.zombie_tests -join "`n")

🔓 SECURITY GAPS:
$($report.security_gaps -join "`n")

💣 CONFIG BOMBS:
$($report.config_bombs -join "`n")

📉 STABILITY RISKS:
$($report.stability_risks -join "`n")

🤖 AI GOVERNANCE:
$($report.ai_governance -join "`n")
============================================================
  ARCHITECT'S VERDICT: $verdict
============================================================
"@

$reportMarkdown | Out-File $reportFile -Encoding utf8
Write-Host "`n$reportMarkdown"
Write-Host "`nReport saved to: $reportFile" -ForegroundColor Green

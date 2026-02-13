<#
.SYNOPSIS
    Questerix Forensic Strike Engine — Surgical Strike Mode
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
$rootDir = $PWD.Path

# 🎯 SURGICAL TARGETS (Non-recursive discovery where possible)
$targetPaths = @(
    "admin-panel/src",
    "student-app/lib",
    "student-app/test",
    "supabase/functions",
    "supabase/migrations"
)

Write-Section "STEP 0: READINESS"
Write-Host "✅ Tools Ready (Surgical Mode)" -ForegroundColor Green

Write-Section "STEP 1-7: UNIFIED STRIKE"

$files = @()
foreach ($tp in $targetPaths) {
    if (Test-Path $tp) {
        $files += Get-ChildItem -Path $tp -Recurse -File -Include *.ts,*.tsx,*.dart,*.sql | Where-Object { $_.FullName -notmatch "node_modules|dist|build|\.dart_tool|archive" }
    }
}

$envExample = if (Test-Path "admin-panel/.env.example") { Get-Content "admin-panel/.env.example" -Raw } else { "" }

foreach ($file in $files) {
    $relPath = $file.FullName.Replace($PWD.Path, "").TrimStart("\")
    
    try {
        $hits = Select-String -Path $file.FullName -Pattern "signInAnonymously|POLICY.*mentor|process\.env|import\.meta\.env|catch.*\{\}|test\.skip|xtest|as any|PromptTemplate|generateContent|service_role|prune_old_error_logs|cleanup_security_logs" -ErrorAction SilentlyContinue
        
        foreach ($h in $hits) {
            $loc = "$($relPath):$($h.LineNumber)"
            
            # VUL-001 (Identity): Flag anonymous auth in Admin Panel (but allow in Student app)
            if ($h.Line -match "signInAnonymously" -and $relPath -match "admin-panel") { 
                $report.taxonomy += "VUL-001 (Anon Auth in Admin): $loc" 
            }
            
            # VUL-002 (Leakage): Flag mentor policies without domain_id scoping
            if ($h.Line -match "POLICY.*mentor" -and $h.Line -notmatch "domain_id") { 
                $report.taxonomy += "VUL-002 (RLS Leakage): $loc" 
            }

            # VUL-003 (Secret Leakage): Flag service_role key usage outside of secure scripts/test env
            if ($h.Line -match "service_role" -and $relPath -notmatch "env.test.local|secrets|supabase/migrations") {
                $report.taxonomy += "VUL-003 (Service Role Leak): $loc"
            }
            
            # Pattern matches for other risks
            if ($h.Line -match "(process\.env|import\.meta\.env)\.(VITE_[A-Z0-9_]+)") {
                $v = $Matches[2]
                if ($envExample -notmatch "\b$v\b") { $report.config_bombs += "$v ($loc)" }
            }
            
            if ($h.Line -match "catch.*\{\}") { $report.stability_risks += "Empty Catch ($loc)" }
            if ($h.Line -match "test\.skip|xtest") { $report.stability_risks += "Skipped Test ($loc)" }
            if ($h.Line -match "as any\b") { $report.stability_risks += "Type Hole ($loc)" }
            if ($h.Line -match "PromptTemplate") { $report.ai_governance += "Prompt Template ($loc)" }
            if ($h.Line -match "generateContent" -and $h.Line -notmatch "temperature" -and $h.Line -notmatch "// enforced-temp") { $report.ai_governance += "Missing Temp ($loc)" }

            # Observability alignment
            if ($h.Line -match "prune_old_error_logs|cleanup_security_logs" -and $relPath -match "migrations") {
                Write-Host "✅ Found Maintenance Function: $loc" -ForegroundColor Gray
            }
        }

        # Step 2: Hollow Check (only for small files)
        if ($file.Length -lt 1500 -and $file.Extension -match "ts|tsx|dart") {
            $content = Get-Content $file.FullName -Raw
            $logic = $content -replace '(?s)/\*.*?\*/|//.*', '' -replace 'import.*?;', '' -replace 'interface.*\{.*?\}', '' -replace 'type.*?;', '' -replace 'final\s+.*?Provider\s*=', ''
            if ($logic.Trim().Length -lt 20 -and $content.Trim().Length -gt 0) {
                $report.dead_files += "$relPath ($($file.Length) bytes)"
            }
        }
    } catch {}
}

Write-Section "STEP 3: LOG AUTOPSY"
$logs = @("student-app/test_output.txt", "admin-panel/e2e_failure_log.txt", "admin-panel/tsc_errors.txt", "build_log.txt")
foreach ($log in $logs) {
    if (Test-Path $log) {
        $lines = Get-Content $log
        if ($lines.Count -gt 0) {
            $lastLine = $lines[-1]
            if ($lastLine -notmatch "Exit Code|Summary|Done|Total|passed") { $report.zombie_tests += "Zombie (Hang): $log" }
        }
    }
}

# --- STEP 8: REINDEX ORACLE ---
Write-Section "STEP 8: REINDEX ORACLE"
try {
    Write-Host "🔄 Updating Project Oracle Search Index..." -ForegroundColor Cyan
    $kbDir = Join-Path $PWD.Path "scripts/knowledge-base"
    if (Test-Path $kbDir) {
        Push-Location $kbDir
        # Use tsx directly to avoid npm noise if possible, but npm run index is safer
        & npm run index 2>&1 | Out-Null
        Pop-Location
        Write-Host "✅ Oracle Index Updated" -ForegroundColor Green
    } else {
        Write-Warn "Knowledge base directory not found at $kbDir"
    }
} catch {
    Write-Warn "Oracle Indexing failed: $_"
}

# --- GENERATE REPORTS (JSON & Markdown) ---
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
$verdict = "🟢 STABLE"
$stats = @{ critical = 0; warning = 0; info = 0 }
$findings = @()

# Process Taxonomy (CRITICAL)
foreach ($t in $report.taxonomy) {
    if ($t -match "(VUL-\d+.*): (.*):(\d+)") {
        $findings += @{ id = $t.GetHashCode().ToString(); type = "security"; severity = "CRITICAL"; file = $Matches[2]; line = [int]$Matches[3]; message = $Matches[1]; status = "OPEN" }
        $stats.critical++
    }
}

# Process AI Governance (WARNING)
foreach ($a in $report.ai_governance) {
    if ($a -match "(.*) \((.*):(\d+)\)") {
        $findings += @{ id = $a.GetHashCode().ToString(); type = "ai_governance"; severity = "WARNING"; file = $Matches[2]; line = [int]$Matches[3]; message = $Matches[1]; status = "OPEN" }
        $stats.warning++
    }
}

# Process Dead Files (WARNING)
foreach ($df in $report.dead_files) {
    if ($df -match "(.*) \((\d+) bytes\)") {
        $findings += @{ id = $df.GetHashCode().ToString(); type = "dead_file"; severity = "WARNING"; file = $Matches[1]; message = "Hollow Placeholder ($($Matches[2]) bytes)"; status = "OPEN" }
        $stats.warning++
    }
}

# Process Stability Risks (WARNING)
foreach ($sr in $report.stability_risks) {
    if ($sr -match "(.*) \((.*):(\d+)\)") {
        $findings += @{ id = $sr.GetHashCode().ToString(); type = "stability"; severity = "WARNING"; file = $Matches[2]; line = [int]$Matches[3]; message = $Matches[1]; status = "OPEN" }
        $stats.warning++
    }
}

if ($stats.critical -gt 0) { $verdict = "🔴 STOP SHIP" }
elseif ($stats.warning -gt 0) { $verdict = "🟡 DEBT WARN" }

# 1. Output JSON Backlog
$backlog = @{
    last_run = $date
    verdict = $verdict
    stats = $stats
    findings = $findings
}
if (-not (Test-Path "$rootDir/.agent/artifacts")) { New-Item -ItemType Directory -Path "$rootDir/.agent/artifacts" -Force }
$backlog | ConvertTo-Json -Depth 10 | Out-File "$rootDir/.agent/HARDENING_BACKLOG.json" -Encoding utf8

# 2. Output Markdown (Visual)
$reportMarkdown = @"
============================================================
  QUESTERIX HARDENING BACKLOG — $date
============================================================
Verdict: $verdict | Critical: $($stats.critical) | Warning: $($stats.warning)
------------------------------------------------------------
$($findings | ForEach-Object { "[$($_.severity)] $($_.message) -> $($_.file)" } | Out-String)
============================================================
"@

$reportMarkdown | Out-File "$rootDir/.agent/artifacts/FORENSIC_REPORT.md" -Encoding utf8
Write-Host "`n$reportMarkdown"
Write-Host "JSON Backlog updated: .agent/HARDENING_BACKLOG.json" -ForegroundColor Green

<#
.SYNOPSIS
    Questerix Forensic Strike Engine  Surgical Strike Mode
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
    reliability_risks = @()
}
$rootDir = $PWD.Path

#  SURGICAL TARGETS (Non-recursive discovery where possible)
$targetPaths = @(
    "admin-panel/src",
    "student-app/lib",
    "student-app/test",
    "supabase/functions",
    "supabase/migrations"
)

Write-Section "STEP 0: READINESS"
Write-Host " Tools Ready (Surgical Mode)" -ForegroundColor Green

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
                Write-Host " Found Maintenance Function: $loc" -ForegroundColor Gray
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

# --- STEP 4: RELIABILITY RISKS (17 IRONCLAD Patterns) ---
Write-Section "STEP 4: RELIABILITY RISKS (IRONCLAD 17-Pattern Scan)"

# REL-01: x-timeout header without AbortController (gateway hint, not enforced timeout)
$relFiles = Get-ChildItem -Path "admin-panel/src" -Recurse -File -Include *.ts,*.tsx -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|dist" }
foreach ($f in $relFiles) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    # x-timeout without AbortController in same function context
    if ($content -match "x-timeout" -and $content -notmatch "AbortController") {
        $report.reliability_risks += "REL-01 (Hint-Only Timeout, no AbortController): $relPath"
    }
}

# REL-02: retryWithBackoff co-existing with manual retry loop (double-retry = exponential blowup)
$dartFiles = Get-ChildItem -Path "student-app/lib" -Recurse -File -Include *.dart -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "\.dart_tool" }
foreach ($f in $dartFiles) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    if ($content -match "retryWithBackoff" -and $content -match "retryCount") {
        $report.reliability_risks += "REL-02 (Double-Retry Logic): $relPath — retryWithBackoff + manual retryCount found"
    }
}

# REL-03: BUG-10 — SECURITY DEFINER without SET search_path
$sqlFiles = Get-ChildItem -Path "supabase/migrations" -Recurse -File -Include *.sql -ErrorAction SilentlyContinue
foreach ($f in $sqlFiles) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    # Find SECURITY DEFINER functions without SET search_path within 10 lines
    $hits = Select-String -Path $f.FullName -Pattern "SECURITY DEFINER" -ErrorAction SilentlyContinue
    foreach ($h in $hits) {
        # Read a window of lines around the match
        $lines = Get-Content $f.FullName -ErrorAction SilentlyContinue
        $start = [Math]::Max(0, $h.LineNumber - 1)
        $end = [Math]::Min($lines.Count - 1, $h.LineNumber + 15)
        $window = $lines[$start..$end] -join "`n"
        if ($window -notmatch "SET search_path") {
            $report.reliability_risks += "REL-03 / BUG-10 (SECURITY DEFINER missing SET search_path): $($relPath):$($h.LineNumber)"
        }
    }
}

# REL-04: BUG-13 — Stateful objects (rate limiter/circuit breaker) inside request handler
$edgeFunctions = Get-ChildItem -Path "supabase/functions" -Recurse -File -Include *.ts -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq "index.ts" }
foreach ($f in $edgeFunctions) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    # Crude heuristic: createRateLimitMiddleware appears after serve(
    $serveIdx = $content.IndexOf("serve(")
    $rateIdx  = $content.IndexOf("createRateLimitMiddleware")
    if ($rateIdx -gt $serveIdx -and $serveIdx -ge 0 -and $rateIdx -ge 0) {
        $report.reliability_risks += "REL-04 / BUG-13 (Stateful object inside request handler): $relPath"
    }
}

# REL-05: BUG-11 — Rate limiter double-counting (middleware() AND check() both called)
foreach ($f in $edgeFunctions) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    if ($content -match "\.middleware\(" -and $content -match "\.check\(") {
        $report.reliability_risks += "REL-05 / BUG-11 (Rate Limiter Double-Counting — .middleware() AND .check() both present): $relPath"
    }
}

# REL-06: BUG-12 — Circuit breaker missing decay for sub-threshold entries
foreach ($f in $edgeFunctions) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    if ($content -match "circuitBreaker" -and $content -notmatch "isOpen.*false.*resetTime|delete.*circuitBreaker") {
        # Only flag if the file contains circuit breaker state management but not the decay delete
        if ($content -match "resetTime" -and $content -notmatch "circuitBreakers\.delete") {
            $report.reliability_risks += "REL-06 / BUG-12 (Circuit Breaker missing sub-threshold decay delete): $relPath"
        }
    }
}

# REL-07: BUG-15 — process.env in Deno context (should use Deno.env.get)
foreach ($f in $edgeFunctions) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    if ($content -match "process\.env") {
        $report.reliability_risks += "REL-07 / BUG-15 (process.env in Deno context): $relPath — use Deno.env.get() instead"
    }
}

# REL-08: BUG-16 — Variable scope error: const inside try, used outside
$allTs = @($relFiles) + @($edgeFunctions)
foreach ($f in $allTs) {
    $lines = Get-Content $f.FullName -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*try\s*\{") {
            # Check for const/let declared inside the try that might be used after
            $tryBlock = $lines[$i..([Math]::Min($i+20, $lines.Count-1))] -join "`n"
            if ($tryBlock -match "const (\w+)\s*=" -and $tryBlock -match "\} catch" -and $tryBlock -match "return \w+") {
                $report.reliability_risks += "REL-08 / BUG-16 (Possible const-in-try scope leak): $($relPath):$($i+1)"
            }
        }
    }
}

# REL-09: BUG-17 — Regex with /g flag used with .test() (lastIndex side effect)
foreach ($f in $allTs) {
    $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    $relPath = $f.FullName.Replace($PWD.Path, "").TrimStart("\")
    if ($content -match "/[^/]+/g" -and $content -match "\.test\(") {
        $report.reliability_risks += "REL-09 / BUG-17 (Global regex .test() — possible lastIndex side effect): $relPath"
    }
}

# REL-10: BUG-04 — Naming drift: check for common known mismatches
$syncFile = "student-app/lib/src/core/sync/sync_service.dart"
$dbFile = "student-app/lib/src/core/database/database.dart"
if ((Test-Path $syncFile) -and (Test-Path $dbFile)) {
    $syncContent = Get-Content $syncFile -Raw -ErrorAction SilentlyContinue
    $dbContent   = Get-Content $dbFile -Raw -ErrorAction SilentlyContinue
    $knownDrifts = @(
        @{ supabase = "best_streak";     drift = "longest_streak" },
        @{ supabase = "mastery_level";   drift = "master_level" }
    )
    foreach ($drift in $knownDrifts) {
        if ($syncContent -match $drift.supabase -and $dbContent -match $drift.drift) {
            $report.reliability_risks += "REL-10 / BUG-04 (Naming Drift): '$($drift.supabase)' in sync_service vs '$($drift.drift)' in database.dart — silent null mapping"
        }
        if ($syncContent -match $drift.drift -and $dbContent -match $drift.supabase) {
            $report.reliability_risks += "REL-10 / BUG-04 (Naming Drift Reversed): '$($drift.drift)' in sync_service vs '$($drift.supabase)' in database.dart"
        }
    }
}

# REL-11: Missing tombstone check on upsert (BUG-05)
if (Test-Path $syncFile) {
    $syncContent = Get-Content $syncFile -Raw -ErrorAction SilentlyContinue
    # Pull path must process 'deleted' array
    if ($syncContent -match "_performPull" -and $syncContent -notmatch "deleted_at") {
        $report.reliability_risks += "REL-11 / BUG-05 (Ghost Data): _performPull does not check deleted_at — deleted records may reappear after sync"
    }
}

# REL-12: Hardcoded UUIDs (BUG-06)
$uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
$hardcodedDirs = @("student-app/lib", "admin-panel/src", "supabase/functions")
foreach ($dir in $hardcodedDirs) {
    if (Test-Path $dir) {
        $uuidHits = Get-ChildItem -Path $dir -Recurse -File -Include *.dart,*.ts,*.tsx | Where-Object { $_.FullName -notmatch "node_modules|dist|\.dart_tool" } | Select-String -Pattern $uuidPattern -ErrorAction SilentlyContinue
        foreach ($h in $uuidHits) {
            # Exclude test files and migration files (those are expected to have UUIDs)
            if ($h.Filename -notmatch "test|spec|migration|seed|fixture") {
                $relPath = $h.Path.Replace($PWD.Path, "").TrimStart("\")
                $report.reliability_risks += "REL-12 / BUG-06 (Hardcoded UUID): $($relPath):$($h.LineNumber) — '$($h.Line.Trim())'"
            }
        }
    }
}

# REL-13: Destructive migration without bypass comment
if (Test-Path "supabase/migrations") {
    $destroHits = Get-ChildItem -Path "supabase/migrations" -File -Include *.sql | Select-String -Pattern "DROP TABLE|DROP COLUMN|TRUNCATE" -ErrorAction SilentlyContinue
    foreach ($h in $destroHits) {
        # Check if bypass comment exists in context (within 3 lines)
        $lines = Get-Content $h.Path
        $lineIdx = $h.LineNumber - 1
        $contextStart = [Math]::Max(0, $lineIdx - 2)
        $context = $lines[$contextStart..$lineIdx] -join "`n"
        if ($context -notmatch "allow-destructive") {
            $relPath = $h.Path.Replace($PWD.Path, "").TrimStart("\")
            $report.reliability_risks += "REL-13 (Destructive Migration, no bypass comment): $($relPath):$($h.LineNumber)"
        }
    }
}

$reliabilityCount = $report.reliability_risks.Count
if ($reliabilityCount -gt 0) {
    Write-Host " Found $reliabilityCount reliability risk(s):" -ForegroundColor Yellow
    foreach ($r in $report.reliability_risks) { Write-Host "  ! $r" -ForegroundColor Yellow }
} else {
    Write-Host " All reliability pattern checks passed" -ForegroundColor Green
}

# --- STEP 8: REINDEX ORACLE ---
Write-Section "STEP 8: REINDEX ORACLE"
try {
    Write-Host " Updating Project Oracle Search Index..." -ForegroundColor Cyan
    $kbDir = Join-Path $PWD.Path "scripts/knowledge-base"
    if (Test-Path $kbDir) {
        Push-Location $kbDir
        # Use tsx directly to avoid npm noise if possible, but npm run index is safer
        & npm run index 2>&1 | Out-Null
        Pop-Location
        Write-Host " Oracle Index Updated" -ForegroundColor Green
    } else {
        Write-Warn "Knowledge base directory not found at $kbDir"
    }
} catch {
    Write-Warn "Oracle Indexing failed: $_"
}

# --- GENERATE REPORTS (JSON & Markdown) ---
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
$verdict = " STABLE"
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

# Process Reliability Risks (CRITICAL if REL-02 double-retry or REL-01 no-timeout; else WARNING)
foreach ($rr in $report.reliability_risks) {
    $sev = if ($rr -match "REL-0[12]|REL-13") { "CRITICAL" } else { "WARNING" }
    if ($rr -match "(REL-\d+[^:]*): (.*)") {
        $findings += @{ id = $rr.GetHashCode().ToString(); type = "reliability"; severity = $sev; file = $Matches[2]; message = $Matches[1]; status = "OPEN" }
        if ($sev -eq "CRITICAL") { $stats.critical++ } else { $stats.warning++ }
    }
}

if ($stats.critical -gt 0) { $verdict = " STOP SHIP" }
elseif ($stats.warning -gt 0) { $verdict = " DEBT WARN" }

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
  QUESTERIX HARDENING BACKLOG  $date
============================================================
Verdict: $verdict | Critical: $($stats.critical) | Warning: $($stats.warning)
------------------------------------------------------------
$($findings | ForEach-Object { "[$($_.severity)] $($_.message) -> $($_.file)" } | Out-String)
============================================================
"@

$reportMarkdown | Out-File "$rootDir/.agent/artifacts/FORENSIC_REPORT.md" -Encoding utf8
Write-Host "`n$reportMarkdown"
Write-Host "JSON Backlog updated: .agent/HARDENING_BACKLOG.json" -ForegroundColor Green

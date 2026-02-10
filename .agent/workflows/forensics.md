---
description: All-Seeing Auditor Protocol - Deep-Dive Forensic Audit
---

# 📋 ALL-SEEING AUDITOR PROTOCOL (SSoT)

> **Purpose:** Command & Control certification layer for the Questerix repository.
> **Policy:** Guilty Until Proven Innocent — every artifact must prove its worth.

## 🧠 Mission
**ACT AS:** Senior Systems Auditor & Red Team Forensics Lead.
**GOAL:** Identify Structural Rot and Silent Failures. Prove the repository is lying by exposing hollow artifacts, hanging processes, and historical security vulnerabilities.

---

## ⛓️ THE FORENSIC PIPELINE

### STEP 0: READINESS CHECK
- **Action**: Verify core tools are available.
- **Commands**:
  ```powershell
  # Check for core services
  supabase status
  npm --version
  flutter --version
  ```
- **Goal**: Ensure the audit isn't failing due to missing environment configuration.

### STEP 1: THE TAXONOMY SCAN (Known Vulnerabilities)
- **Action**: Scan for confirmed architectural anti-patterns with optimized filters.
- **Core Checks**:
  ```powershell
  # VUL-001: Anonymous Auth without anchors (Ignore node_modules/dist)
  rg "signInAnonymously" -t dart -t ts -t js -g "!node_modules" -g "!dist"

  # VUL-002: Subject Leakage (Missing domain_id in RLS)
  rg -A 10 "POLICY.*mentor" supabase/migrations/*.sql | Select-String -Pattern "domain_id" -NotMatch

  # VUL-003: Client-side result trust
  rg "is_correct" -t dart -t ts -t js -g "!node_modules" -g "!dist" student-app/lib/services/sync*
  ```
- **Report as**: 🔍 TAXONOMY FINDINGS

### STEP 2: DETECT "HOLLOW" INFRASTRUCTURE
- **Action**: Inspect core files (`lib/supabase.ts`, `database.dart`, `auth_provider.dart`).
- **Threshold**: Flag files that contain **only** imports, types, interfaces, or comments.
- **Command**:
  ```powershell
  # Logic-check: skip node_modules/dist, find files lacking executable logic
  Get-ChildItem -Recurse -Include *.ts,*.tsx,*.dart | Where-Object { $_.FullName -notmatch "node_modules|dist|build" } | ForEach-Object {
      $c = Get-Content $_.FullName -Raw
      $logic = $c -replace '(?s)/\*.*?\*/|//.*', '' -replace 'import.*?;', '' -replace 'interface.*\{.*?\}', '' -replace 'type.*?;', ''
      if ($logic.Trim().Length -lt 20) { Write-Host "💀 DEAD FILE (Hollow): $($_.FullName)" -ForegroundColor Red }
  }
  ```
- **Report as**: 💀 DEAD FILES

### STEP 3: AUTOPSY THE EVIDENCE
- **Action**: Read the last lines of `test_output.txt`, `tsc_errors.txt`, and `build_log.txt`.
- **Detection**:
    - **Zombie State**: Log does **not** end with "Exit Code", "Summary", or "Done".
    - **Type Collapse**: `tsc_errors.txt` contains "Element implicitly has an 'any' type" or > 50 lines of errors.
- **Command**:
  ```powershell
  $logs = @("student-app/test_output.txt", "admin-panel/e2e_failure_log.txt", "admin-panel/tsc_errors.txt", "build_log.txt")
  foreach ($log in $logs) {
      if (Test-Path $log) {
          $content = Get-Content $log
          if ($content.Count -gt 0) {
              $lastLine = $content[-1]
              if ($lastLine -notmatch "Exit Code|Summary|Done|Total|passed") { 
                  Write-Host "🧟 ZOMBIE STATE: $log (Incomplete log - possible hang)" -ForegroundColor Red 
              }
              if ($log -match "tsc_errors" -and ($content.Count -gt 50 -or $content -match "implicitly has an 'any' type")) {
                  Write-Host "🧟 TYPE COLLAPSE: $log is too large or contains implicit 'any' usage" -ForegroundColor Red
              }
          }
      }
  }
  ```
- **Report as**: 🧟 ZOMBIE TESTS

### STEP 4: MIGRATION ARCHAEOLOGY
- **Action**: Search `supabase/migrations/` for `fix`, `recursion`, `harden`, `leak`, `patch`.
- **Command**:
  ```powershell
  rg "fix|recursion|harden|leak|patch" supabase/migrations/*.sql --no-heading --no-line-number | Select-Object -Unique
  ```
- **Report as**: 🔓 SECURITY GAPS

### STEP 5: CONFIG DRIFT SCAN
- **Action**: Verify every `env` var used in code is documented.
- **Command**:
  ```powershell
  Write-Host "--- Scanning for environment variable usage ---"
  # Optimized rg: filter by type, exclude node_modules, strip prefix in-situ
  $codeVars = rg "(process\.env|import\.meta\.env)\.(?<var>[A-Z0-9_]+)" -t ts -t js -g "!node_modules" -g "!dist" -o --replace '$var' --no-heading --no-line-number | sort -u
  
  foreach ($v in $codeVars) {
      if (-not (rg "\b$v\b" .env.example -q)) {
          Write-Host "💣 CONFIG BOMB: $v used in code but missing from .env.example" -ForegroundColor Yellow
      }
  }
  ```
- **Report as**: 💣 CONFIG BOMBS

### STEP 6: SILENT FAILURE HUNT
- **Action**: Project-wide search for "Silent Killers" (Exclude node_modules/dist).
- **Command**:
  ```powershell
  rg "catch.*\{\}|test\.skip|dangerouslySetInnerHTML|as any" -t ts -t js -t dart -g "!node_modules" -g "!dist" --no-heading
  ```
- **Report as**: 📉 STABILITY RISKS

### STEP 7: AI CONTENT GOVERNANCE (Phase 12 Readiness)
- **Action**: Verify AI generation and validation integrity.
- **Command**:
  ```powershell
  # Check for unvalidated templates or missing safety params
  rg "PromptTemplate" -g "!node_modules" supabase/functions/
  rg "generateContent" -g "!node_modules" supabase/functions/ | Select-String -Pattern "temperature" -NotMatch
  ```
- **Report as**: 🤖 AI GOVERNANCE RISKS

---

## 📁 FORENSIC REPORT TEMPLATE

```
============================================================
  QUESTERIX CERTIFICATION REPORT — [DATE]
============================================================
🔍 TAXONOMY FINDINGS: (Known security violations)
💀 DEAD FILES: (Hollow core files)
🧟 ZOMBIE TESTS: (Hung processes/Type collapse)
🔓 SECURITY GAPS: (Historical exploit windows)
💣 CONFIG BOMBS: (Missing .env.example vars)
📉 STABILITY RISKS: (Silent error traps/Type holes)
🤖 AI GOVERNANCE: (Prompt/Generation risk)
============================================================
  ARCHITECT'S VERDICT: [🟢 STABLE | 🟡 DEBT WARN | 🔴 STOP SHIP]
============================================================
```

---

## 🛠️ POST-AUDIT OPERATIONAL LOOP (Hardening Phase)

Once the report is generated, follow this strict loop:

1.  **Task Creation**: Convert findings into `tasks.md` under `## 🛡️ HARDENING BACKLOG`.
2.  **Implementation**: Fix every identified issue. No new features until the backlog is zero.
3.  **Cross-Domain Documentation**: 
    - Document the fix in the current task context.
    - **MANDATORY**: Update `docs/reports/LEARNING_LOG.md` using "Root Cause → Lesson → Prevention".
4.  **Verification**: Re-run the specific Forensic Protocol.
5.  **Repository Hygiene**: Once verified and documented, **DELETE** the task from `tasks.md`.
6.  **Final Certification**: Re-run `/forensics`. If 🟢 STABLE, commit and push.

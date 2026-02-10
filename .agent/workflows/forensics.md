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
- **Action**: Scan for confirmed architectural anti-patterns.
- **Core Checks**:
  ```powershell
  # VUL-001: Anonymous Auth without anchors
  grep -r "signInAnonymously" student-app/lib/
  # VUL-002: Subject Leakage (Missing domain_id in RLS)
  grep -A 10 "POLICY.*mentor" supabase/migrations/*.sql | Select-String -Pattern "domain_id" -NotMatch
  # VUL-003: client-side result trust
  grep -r "is_correct" student-app/lib/services/sync*
  ```
- **Report as**: 🔍 TAXONOMY FINDINGS

### STEP 2: DETECT "HOLLOW" INFRASTRUCTURE
- **Action**: Inspect core files (`lib/supabase.ts`, `database.dart`, `auth_provider.dart`).
- **Threshold**: Flag files that contain **only** imports, types, interfaces, or comments.
- **Reasoning**: A file with no logic is a placeholder disguised as a feature.
- **Command**:
  ```powershell
  # Logic-check: find files that lack function/class bodies or executable logic
  Get-ChildItem -Recurse -Include *.ts,*.tsx,*.dart | ForEach-Object {
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
          $lastLine = $content[-1]
          if ($lastLine -notmatch "Exit Code|Summary|Done|Total|passed") { 
              Write-Host "🧟 ZOMBIE STATE: $log (Incomplete log - possible hang)" -ForegroundColor Red 
          }
          if ($log -match "tsc_errors" -and ($content.Count -gt 50 -or $content -match "implicitly has an 'any' type")) {
              Write-Host "🧟 TYPE COLLAPSE: $log is too large or contains implicit 'any' usage" -ForegroundColor Red
          }
      }
  }
  ```
- **Report as**: 🧟 ZOMBIE TESTS

### STEP 4: MIGRATION ARCHAEOLOGY
- **Action**: Search `supabase/migrations/` for `fix`, `recursion`, `harden`, `leak`, `patch`.
- **Logic**: A patch is a confession. If a migration "hardens RLS", the system was previously vulnerable. If it "fixes recursion", the DB was crashing.
- **Command**:
  ```powershell
  Select-String -Path "supabase/migrations/*.sql" -Pattern "fix|recursion|harden|leak|patch" | Select-Object FileName, LineNumber, Line -Unique
  ```
- **Report as**: 🔓 SECURITY GAPS

### STEP 5: CONFIG DRIFT SCAN
- **Action**: Compare `.env.example` (and other samples) against actual code usage (`process.env` or `import.meta.env`).
- **Detection**: Environment variables used in code but missing from the example/sample documentation.
- **Command**:
  ```powershell
  # Find vars in code
  $codeVars = grep -roP "(?:process\.env\.|import\.meta\.env\.)[A-Z0-9_]+" . | Select-Object -Unique
  # Check against .env.example
  foreach ($v in $codeVars) {
      if (-not (Select-String -Path ".env.example" -Pattern ($v -replace ".*env\.", ""))) {
          Write-Host "💣 CONFIG BOMB: $v used in code but missing from .env.example" -ForegroundColor Yellow
      }
  }
  ```
- **Report as**: 💣 CONFIG BOMBS

### STEP 6: SILENT FAILURE HUNT
- **Action**: Project-wide search for "Silent Killers."
- **Patterns**: `catch (e) {}`, `test.skip`, `dangerouslySetInnerHTML`, and `as any`.
- **Logic**: Empty catch blocks swallow errors; skipped tests hide regressions; `as any` bypasses the safety of the type system.
- **Command**:
  ```powershell
  # Search for the "Four Horsemen" of stability risk
  grep -rnE "catch.*\{\}|test\.skip|dangerouslySetInnerHTML|as any" --include="*.ts" --include="*.tsx" --include="*.dart" .
  ```
- **Report as**: 📉 STABILITY RISKS

### STEP 7: AI CONTENT GOVERNANCE (Phase 12 Readiness)
- **Action**: Verify AI generation and validation integrity.
- **Checks**:
  ```powershell
  # Check for unvalidated prompt templates
  grep -r "PromptTemplate" supabase/functions/
  # Check for missing temperature/token limits in AI calls
  grep -r "generateContent" supabase/functions/ | Select-String -Pattern "temperature" -NotMatch
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

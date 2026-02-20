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

## 🔧 COMPANION WORKFLOWS

This forensics workflow works in conjunction with two more specialized tools:

| Workflow             | When to Use                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/ironclad`          | Deep root cause analysis for a **specific bug or file** — runs the 17-pattern production bug scanner, RARV cycle, and full forensic pipeline against targeted code |
| `/reliability-audit` | Full-repo **proactive reliability audit** — ships concrete fixes for timeouts, retry logic, rate limiting, auth resilience, and CI safety gates                    |

**Run order for a major pre-release audit**: `/forensics` → `/reliability-audit` → `/ironclad` (on any CRITICAL or STOP SHIP findings from the first two)

---

## 🚀 THE SUPREME MANDATE: EFFICIENCY FIRST

> **🚫 BANNED PATHS (NEVER SCAN)**:
> `node_modules`, `dist`, `build`, `.git`, `.next`, `coverage`, `.dart_tool`, `ios/Pods`.
>
> **CRITICAL RULE**: Searching the entire repository without explicit exclusions is a **TERMINAL OFFENSE**. Always use surgical filters (`-t`, `-g`) or the centralized audit script.

### ⛓️ THE FORENSIC PIPELINE (Unified Strike)

Instead of running multiple disconnected scripts, use the centralized Forensic Engine. This script performs a **single-pass autopsy** of the codebase, respecting all exclusion rules and focusing only on source artifacts.

#### 1. EXECUTION

- **Action**: Run the centralized forensic engine.
  // turbo
- **Command**:
  ```powershell
  python ops_runner.py tasks.json # executes: pwsh scripts/maintenance/forensic_audit.ps1
  ```
- **Scope** (as of Feb 2026 — 17-pattern IRONCLAD scan integrated):
  - **Taxonomy Scans**: Confirmed security anti-patterns (VUL-001 through VUL-003)
  - **Hollow Infrastructure**: Logic-stripped weight checks
  - **Evidence Autopsy**: Zombie test (hang) detection
  - **Archaeology**: Migration "confessions"
  - **Config Drift**: Environment vs. `.env.example`
  - **Pattern Hunt**: Silent killers (empty catch, as any)
  - **Reliability Risks (17-Pattern)**: REL-01 through REL-13
    - REL-01: `x-timeout` hint without `AbortController` (no real enforcement)
    - REL-02: Double-retry (`retryWithBackoff` + manual `retryCount`)
    - REL-03/BUG-10: `SECURITY DEFINER` missing `SET search_path`
    - REL-04/BUG-13: Stateful object (rate limiter) inside request handler
    - REL-05/BUG-11: Rate limiter double-counting (`.middleware()` AND `.check()`)
    - REL-06/BUG-12: Circuit breaker missing sub-threshold decay
    - REL-07/BUG-15: `process.env` in Deno context
    - REL-08/BUG-16: `const` declared in `try`, accessed outside
    - REL-09/BUG-17: Global regex `.test()` without `lastIndex` reset
    - REL-10/BUG-04: Known column naming drift (Supabase ↔ Drift ORM)
    - REL-11/BUG-05: Ghost data — `_performPull` not checking `deleted_at`
    - REL-12/BUG-06: Hardcoded UUIDs in source files
    - REL-13: Destructive migration without `-- allow-destructive` bypass

#### 2. CLOUD DELEGATION (Optional)

If the audit is run by an external "Cloud Auditor" agent:

- Record the **Date**, **Agent ID**, and **Architect's Verdict**.
- Merge findings into the local `tasks.md` Hardening Backlog.

---

## 📁 FORENSIC REPORT TEMPLATE (SSoT)

The script automatically generates `.agent/artifacts/FORENSIC_REPORT.md`. Review this artifact for:

```
============================================================
  QUESTERIX CERTIFICATION REPORT — [DATE]
============================================================
🔍 TAXONOMY FINDINGS: (Known security violations — VUL-001+)
💀 DEAD FILES: (Hollow core files)
🧟 ZOMBIE TESTS: (Hung processes/Type collapse)
🔓 SECURITY GAPS: (Historical exploit windows)
💣 CONFIG BOMBS: (Unused/Missing environment variables)
📉 STABILITY RISKS: (Silent error traps/Type holes)
🤖 AI GOVERNANCE: (Prompt/Generation risk)
⚠️  RELIABILITY RISKS: (REL-01 through REL-13 — 17-pattern IRONCLAD scan)
============================================================
  ARCHITECT'S VERDICT: [🟢 STABLE | 🟡 DEBT WARN | 🔴 STOP SHIP]
============================================================
```

**Reliability findings that trigger STOP SHIP automatically:**

- REL-01: `x-timeout`-only timeouts (no `AbortController`) — unbounded network hangs
- REL-02: Double-retry logic — exponential attempt count, production hammering
- REL-13: Destructive migration without bypass — data loss risk

---

## 🛠️ POST-AUDIT OPERATIONAL LOOP (Hardening Phase)

Once the report is generated, follow this strict loop:

1. **Task Creation**: Convert findings into `tasks.md` under `## 🛡️ HARDENING BACKLOG`.
2. **Implementation**: Fix every identified issue. **NO NEW FEATURES** until the backlog is zero.
3. **For CRITICAL or STOP SHIP findings**: Run `/ironclad` on the specific file to get full root-cause analysis.
4. **Cross-Domain Documentation**:
   - Document the fix in the current task context.
   - **MANDATORY**: Update `docs/reports/LEARNING_LOG.md` using "Root Cause → Lesson → Prevention".
5. **Surgical Verification**: Re-run the specific Forensic step using optimized filters (never scan all folders).
6. **Repository Hygiene**: Once verified and documented, **DELETE** the task from `tasks.md`.
7. **Final Certification**: Re-run `/forensics`. If 🟢 STABLE, commit and push.

---

## 🛑 EFFICIENCY ENFORCEMENT

Any command that scans for code MUST:

1. **Exclude Heavy Folders**: `-g '!node_modules' -g '!dist' -g '!.next'`.
2. **Filter by Type**: Use `-t ts -t js -t dart`.
3. **Limit Output**: Use `--max-depth` if possible.

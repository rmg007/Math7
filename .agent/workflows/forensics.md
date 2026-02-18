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

## 🚀 THE SUPREME MANDATE: EFFICIENCY FIRST

> **🚫 BANNED PATHS (NEVER SCAN)**:
> `node_modules`, `dist`, `build`, `.git`, `.next`, `coverage`, `.dart_tool`, `ios/Pods`.
>
> **CRITICAL RULE**: Searching the entire repository without explicit exclusions is a **TERMINAL OFFENSE**. Always use surgical filters (`-t`, `-g`) or the centralized audit script.

### ⛓️ THE FORENSIC PIPELINE (Unified Strike)

Instead of running multiple disconnected scripts, use the centralized Forensic Engine. This script performs a **single-pass autopsy** of the codebase, respecting all exclusion rules and focusing only on source artifacts.

#### 1. EXECUTION

- **Action**: Run the centralized forensic engine.
- **Command**:
  ```powershell
  python ops_runner.py tasks.json # executes: pwsh scripts/maintenance/forensic_audit.ps1
  ```
- **Scope**:
  - **Taxonomy Scans**: Confirmed security anti-patterns.
  - **Hollow Infrastructure**: Logic-stripped weight checks.
  - **Evidence Autopsy**: Zombie test (hang) detection.
  - **Archaeology**: Migration "confessions."
  - **Config Drift**: Environment vs. `.env.example`.
  - **Pattern Hunt**: Silent killers (empty catch, as any).

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
🔍 TAXONOMY FINDINGS: (Known security violations)
💀 DEAD FILES: (Hollow core files)
🧟 ZOMBIE TESTS: (Hung processes/Type collapse)
🔓 SECURITY GAPS: (Historical exploit windows)
💣 CONFIG BOMBS: (Unused/Missing environment variables)
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
2.  **Implementation**: Fix every identified issue. **NO NEW FEATURES** until the backlog is zero.
3.  **Cross-Domain Documentation**:
    - Document the fix in the current task context.
    - **MANDATORY**: Update `docs/reports/LEARNING_LOG.md` using "Root Cause → Lesson → Prevention".
4.  **Surgical Verification**: Re-run the specific Forensic step using optimized filters (never scan all folders).
5.  **Repository Hygiene**: Once verified and documented, **DELETE** the task from `tasks.md`.
6.  **Final Certification**: Re-run `/forensics`. If 🟢 STABLE, commit and push.

---

## 🛑 EFFICIENCY ENFORCEMENT

Any command that scans for code MUST:

1.  **Exclude Heavy Folders**: `-g '!node_modules' -g '!dist' -g '!.next'`.
2.  **Filter by Type**: Use `-t ts -t js -t dart`.
3.  **Limit Output**: Use `--max-depth` if possible.

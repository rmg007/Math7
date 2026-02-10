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

## 🔬 THE FOUR FORENSIC PROTOCOLS

### 1. DETECT "HOLLOW" INFRASTRUCTURE
- **Action**: Check file sizes of core infrastructure.
- **Threshold**: Flag files < 100 bytes or only containing boilerplate.
- **Targets**: `supabase.ts`, `database.dart`, `AuthProvider.tsx`.
- **Report as**: 💀 DEAD FILES

### 2. AUTOPSY THE EVIDENCE
- **Action**: Read the last run logs (`test_output.txt`, `tsc_errors.txt`).
- **Detection**:
    - **Zombie State**: Log ends with "Loading..." (process hung).
    - **Type Collapse**: `tsc_errors.txt` > 2KB (schema drift).
- **Report as**: 🧟 ZOMBIE TESTS

### 3. MIGRATION ARCHAEOLOGY
- **Action**: Search `supabase/migrations/` for `fix`, `recursion`, `harden`, `leak`, `patch`.
- **Logic**: A patch is a confession. If it "hardens RLS", the system was unprotected.
- **Report as**: 🔓 SECURITY GAPS

### 4. CODE PATTERN HUNT
- **Action**: Search for `catch (e) {}`, `test.skip`, `dangerouslySetInnerHTML`, and `: any`.
- **Target**: Silent failures and admitted logic debt.
- **Report as**: 📉 STABILITY RISKS

---

## 📁 FORENSIC REPORT TEMPLATE

```
============================================================
  QUESTERIX CERTIFICATION REPORT — [DATE]
============================================================
💀 DEAD FILES: (Hollow core files)
🧟 ZOMBIE TESTS: (Hung processes/Type collapse)
🔓 SECURITY GAPS: (Historical exploit windows)
📉 STABILITY RISKS: (Silent error traps/Type holes)
============================================================
  ARCHITECT'S VERDICT: [🟢 STABLE | 🟡 DEBT WARN | 🔴 STOP SHIP]
============================================================
```

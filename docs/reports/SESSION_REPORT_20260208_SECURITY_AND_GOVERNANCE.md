# Session Report: Security Incident & Governance Upgrade

**Date**: February 8, 2026  
**Focus**: Security Remediation, Root Directory Hygiene, AI Context Optimization

---

## 🚨 1. Security Incident: Leaked API Key

### Incident

- **Event**: A Google Cloud API Key (`[REDACTED - key was rotated 2026-02-08]`) was found in a backup file (`.secrets.backup.20260207-211705`) which was flagged by Google's secret scanning.
- **Scope**: The key had permissions for Generative Language API and Vertex AI.

### Remediation

1.  **Immediate Deletion**: The compromised backup file was permanently deleted.
2.  **Key Rotation**: The user generated a new key (`Questerix-Curriculum-Gemini-2026-02-08`).
3.  **Update**: The new key was updated in `.secrets` and pushed to Supabase Edge Functions via `npx supabase secrets set`.
4.  **Prevention**: Updated `.gitignore` to strictly exclude `*.backup` and `*.backup.*` files to prevent future accidental commits.
5.  **Audit**: A full scan of the root directory was conducted to ensure no other backup files remained.

---

## 🧹 2. Root Directory Governance

### Problem

The root directory was cluttered with:

- 5+ temporary text files (`tsc_output.txt`, `projects.txt`).
- 4+ markdown reports (`PRODUCTION_READINESS_REPORT.md`, etc.) that belonged in `docs/`.
- This clutter made it hard for agents to find the "source of truth".

### Action

1.  **Cleanup**: Deleted all temporary text files.
2.  **Reorganization**: Moved reports to `docs/reports/` and strategy docs to `docs/strategy/`.
3.  **Lockdown**: Updated `AI_CODING_INSTRUCTIONS.md` with a **"Root Directory Lock"** rule.
    - AI Agents are now **strictly prohibited** from creating new files in root without explicit permission.
    - All documentation must go to `docs/`.
    - All logs must go to `.agent/` or `artifacts/`.

---

## 🧠 3. AI Context Optimization

### Problem

User reported that VS Code agents were "struggling" to understand the codebase.

- **Root Cause**: `.cursorrules` was nearly empty, providing no context. Agents had to "guess" the tech stack and rules.
- **Symptom**: Hallucinations and slow start times.

### Solution

1.  **Supercharged `.cursorrules`**: Injected a high-density summary of the project:
    - **Tech Stack**: Flutter (Student), React/Vite (Admin), Supabase (Backend).
    - **Key Commands**: `make run-admin`, `npx playwright test`.
    - **Hard Rules**: No landing pages, no prod deployment.
2.  **Quickstart Guide**: Created `docs/strategy/QUICKSTART_AGENTS.md` as a zero-latency entry point.
3.  **Golden Command**: Updated `README.md` to point agents to the Quickstart immediately.

---

## 🐛 4. The "Firebase" False Positive

### Incident

User reported a critical crash: `Firebase: Error (auth/network-request-failed)`.

- **Investigation**:
  - Searched codebase for `firebase` dependency: **None**.
  - Searched source code for `firebase`: **None**.
  - Searched for `sentence-player` (found in logs): **None**.
- **Conclusion**: The error was caused by a **Browser Extension** ("Sentence Player" or similar) trying to inject itself into the page and failing.
- **Lesson**: Always verify if a crash is internal (codebase) or external (browser environment) before debugging heavily.

---

## ✅ Learnings & Recommendations

1.  **Secret Backups are Dangerous**: Never create `.secrets.backup` files in the root. If you must backup, move them to a secure location outside the repo immediately.
2.  **Root Hygiene is Critical**: A clean root directory = smarter AI agents. Clutter confuses context.
3.  **Browser Extensions break Apps**: When seeing network errors for libraries you don't use (like Firebase in a Supabase app), suspect the browser first.
4.  **Context is King**: Using `.cursorrules` effectively allows agents to skip the "discovery" phase and start coding immediately.

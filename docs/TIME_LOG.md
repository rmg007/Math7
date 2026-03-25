# Questerix — Developer Time Log

> **Purpose**: Accurate payroll / sweat equity records for tax filing and business accounting.
> **Owner**: Developer (sole contributor)
> **Rate**: See Rate History below.
> **Scope**: All 4 Questerix sub-projects (Admin Panel, Student App, Landing Pages, Help Docs) + shared infrastructure.

---

## ⚠️ Agent Instructions

At the **end of every session**, the AI agent MUST:

1. Add a new row to the current month's session table below.
2. Recalculate the monthly **Total Hours** and **Gross Pay** in the Monthly Summary.
3. Clean up any temp/scratch files created during the session (see Temp File Cleanup rule in `AGENTS.md`).
4. Use the **confirmed rate** for the current period from the Rate History table.

**Format for each session row:**
`| YYYY-MM-DD | HH:MM–HH:MM | X.X | App(s) | Work type | Description |`

Work types: `dev` | `devops` | `arch` | `qa` | `docs` | `ops`

---

## Rate History

| Period              | Rate    | Basis                                         |
| :------------------ | :------ | :-------------------------------------------- |
| Dec 2025 – Jan 2026 | $95/hr  | Retroactive estimate — early/planning phase   |
| Feb 2026            | $95/hr  | Retroactive estimate — active build phase     |
| Mar 2026 – Present  | $100/hr | Confirmed going forward (blended senior rate) |

---

## Monthly Summary

| Month             | Hours   | Rate    | Gross Pay   | Notes                                                                                        |
| :---------------- | :------ | :------ | :---------- | :------------------------------------------------------------------------------------------- |
| December 2025     | 0       | $95/hr  | $0          | No commits found; pre-project era (Math7 predecessor in separate repo)                       |
| January 2026      | 20      | $95/hr  | $1,900      | Retroactive estimate based on git history (first commit Jan 27; burst of 40+ commits Jan 28) |
| February 2026     | 120     | $95/hr  | $11,400     | Retroactive estimate based on LEARNING_LOG density (20+ major sessions across Feb 2–28)      |
| March 2026 (1–23) | 70      | $100/hr | $7,000      | Retroactive estimate based on LEARNING_LOG entries (Mar 1, 11, 12, 14, 20×2, 22, 23)         |
| **YTD TOTAL**     | **210** | —       | **$20,300** |                                                                                              |

> **⚠️ Retroactive Note**: December 2025 – March 22, 2026 figures are **estimates** reconstructed from git commit history and `docs/LEARNING_LOG.md` session density. They are reasonable approximations, not precise timesheets. From **March 23, 2026 onwards**, all entries are accurate real-time records.

---

## December 2025

_No Questerix work found. Project was in pre-planning or Math7 predecessor era._

| Date | Time | Hours | App(s) | Type | Description          |
| :--- | :--- | :---- | :----- | :--- | :------------------- |
| —    | —    | 0     | —      | —    | No recorded sessions |

**Month Total: 0 hrs | $0**

---

## January 2026

_Retroactive estimate. Project created Jan 27; major initial build Jan 28._

| Date       | Time | Hours | App(s)                   | Type | Description                                                                                                       |
| :--------- | :--- | :---- | :----------------------- | :--- | :---------------------------------------------------------------------------------------------------------------- |
| 2026-01-27 | —    | 4.0   | Admin Panel              | arch | Initial repo creation, Supabase setup, project scaffold                                                           |
| 2026-01-28 | —    | 16.0  | Admin Panel, Student App | dev  | Auth, registration, navigation, curriculum pages, rich text editor, invite codes, user management, design updates |

**Month Total: 20 hrs | $1,900**

---

## February 2026

_Retroactive estimate based on LEARNING_LOG session density._

| Date       | Time | Hours | App(s)               | Type   | Description                                                                                                                  |
| :--------- | :--- | :---- | :------------------- | :----- | :--------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-02 | —    | 4.0   | Student App          | qa     | Widget test stabilization (11/11 passing)                                                                                    |
| 2026-02-03 | —    | 6.0   | Admin Panel          | devops | Production hardening, live deployment, glassmorphism sidebar                                                                 |
| 2026-02-03 | —    | 5.0   | Student App, Landing | dev    | Math7→Questerix rebranding, package rename, 22+ files                                                                        |
| 2026-02-03 | —    | 3.0   | All                  | docs   | Documentation migration, Context Engineering model                                                                           |
| 2026-02-03 | —    | 4.0   | Admin Panel          | arch   | Enterprise remediation: SecurityLogger, hollow snapshots fix                                                                 |
| 2026-02-04 | —    | 8.0   | Admin Panel, Backend | dev    | Ironclad Phase 10: RLS, RPCs, mastery triggers, HMAC signing                                                                 |
| 2026-02-04 | —    | 4.0   | All                  | devops | Slack bridge experiment (rejected), repo hardening 9.5–9.8                                                                   |
| 2026-02-04 | —    | 5.0   | Admin Panel          | dev    | Unified design system, Flutter re-skin, Lucide icons                                                                         |
| 2026-02-04 | —    | 6.0   | Admin Panel, Backend | dev    | AI governance, Phase 13 registry, Gemini Flash edge functions                                                                |
| 2026-02-04 | —    | 4.0   | Admin Panel          | dev    | Zero-cost error tracking (replaced Sentry), error_logs table                                                                 |
| 2026-02-05 | —    | 3.0   | Admin Panel          | ops    | DeepSource quality fixes, ESLint hardening, ops_runner.py                                                                    |
| 2026-02-06 | —    | 4.0   | Admin Panel          | qa     | ArchUnitTS integration, architecture.test.ts, CI gate                                                                        |
| 2026-02-26 | —    | 16.0  | All                  | dev    | Cortex v3 MCP, Security/RLS fixes, E2E regression (91 failures), Cortex overhaul (12 phases), PowerShell env standardization |
| 2026-02-27 | —    | 12.0  | Admin Panel          | qa     | Recovery (Slots A–G): RLS recursion, Curriculum lifecycle, DX overhaul, dead code elimination, auth caching (90% speedup)    |
| 2026-02-28 | —    | 8.0   | Admin Panel          | qa     | K-1 Security gate (OWASP ZAP + Snyk), A11y audit rewrite, Chaos Hunter, Loki double-check (4 bugs)                           |

**Month Total: 92 hrs → rounded to 120 hrs (accounting for undocumented planning/research time) | $11,400**

---

## March 2026

_Retroactive Mar 1–22. Real-time from Mar 23._

| Date       | Time        | Hours | App(s)                   | Type   | Description                                                                                                                                               |
| :--------- | :---------- | :---- | :----------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-01 | —           | 8.0   | Admin Panel              | qa     | AI Assistant E2E, post-deployment smoke, database integration tests, platform infra testing                                                               |
| 2026-03-01 | —           | 4.0   | Admin Panel              | devops | import.meta.env crash fix, ESLint rule, pre-push hook optimization                                                                                        |
| 2026-03-11 | —           | 5.0   | Admin Panel              | qa     | Smoke test resilience, deterministic mocking, global auth mocks                                                                                           |
| 2026-03-12 | —           | 6.0   | Admin Panel, Backend     | dev    | Performance optimization (parallel fetching, useMemo), RLS tombstone hardening                                                                            |
| 2026-03-14 | —           | 4.0   | Admin Panel, Student App | qa     | Domain verification UI, onboarding controller tests                                                                                                       |
| 2026-03-20 | —           | 8.0   | Student App, Admin Panel | dev    | GoRouter integration, Riverpod error observer, TSC zero, Vitest green (607/607), Flutter zero issues                                                      |
| 2026-03-22 | —           | 3.0   | All                      | devops | Production deployment (Admin + Student apps to Cloudflare)                                                                                                |
| 2026-03-23 | 21:00–22:00 | 1.0   | All                      | docs   | Time log setup, rules update, compensation planning session                                                                                               |
| 2026-03-24 | 07:23–08:00 | 0.6   | All                      | docs   | Governance enforcement: close-checklist added to top of all 4 AGENTS.md + GEMINI.md files; TIME_LOG and LEARNING_LOG rules propagated across all projects |
| 2026-03-25 | —           | 3.0   | Admin Panel              | dev    | AI Studio modernization: dynamic dropdowns, prompt preview, use-studio-prompts hook, studio-history-page, routing, sidebar, test updates. tsc zero errors |

**Month Total (through Mar 25): 74.6 hrs | $7,460**

---

## April 2026

_Real-time entries only from this point forward._

| Date | Time | Hours | App(s) | Type | Description |
| :--- | :--- | :---- | :----- | :--- | :---------- |

**Month Total: 0 hrs | $0**

---

## YTD Summary (as of 2026-03-23)

| Metric            | Value                                       |
| :---------------- | :------------------------------------------ |
| Total Hours       | 213 hrs                                     |
| Total Gross Pay   | $20,600                                     |
| Average Rate      | $96.71/hr                                   |
| Active Months     | 3 (Jan–Mar)                                 |
| Primary Work Type | dev (55%), qa (25%), devops/docs/arch (20%) |

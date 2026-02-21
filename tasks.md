# Questerix — Tasks

## 🔍 Phase 6: Post-Cursor Integration & Remaining Work

### Cursor Review Summary

**Feature 1: SubjectsPage Redesign** — ✅ Accepted (design stable)
Minor deviations from spec noted in review. User accepted current state.

**Feature 2: Student App Auth Refactor** — ✅ Complete
AuthController with AsyncValue, login trap fix, themed error/loading splash, regression tests.

---

## ✅ Phase 7: Cloudflare Workers AI & Email — DONE

### Workers AI — Question Generation

- [x] **Model Routing**: DeepSeek R1 (`@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`) for math, Llama 3.1 8B (`@cf/meta/llama-3.1-8b-instruct`) for all other subjects
- [x] **generate-questions** handler with auth, rate limiting, tenant token tracking
- [x] **validate-content** handler — always uses DeepSeek R1 for chain-of-thought reasoning
- [x] Shared auth (Supabase JWT via REST API), rate limiter, HTTP helpers

### Email Workers — Alert Notifications

- [x] **send-alert** handler using `cloudflare:email` + `mimetext`
- [x] Rich HTML email templates for critical alerts
- [x] Webhook secret authentication
- [x] Graceful degradation (logs if email not configured)

### Infrastructure

- [x] `workers/` project: wrangler.toml (AI + email bindings), package.json, tsconfig.json
- [x] Health check endpoint (`GET /health`)
- [x] TypeScript compiles with zero errors

### Before Deploying

- [x] run best workflow to help us confirm that the app is okay and production ready.
- [ ] Enable Email Routing on domain in Cloudflare Dashboard ⚠️ _Manual step — requires Cloudflare Dashboard click_
- [x] Set secrets: ✅ all 4 set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALERT_WEBHOOK_SECRET`, `ADMIN_ALERT_EMAIL`)
- [x] Deploy: `cd workers && npx wrangler deploy` → https://questerix-workers.mhalim80.workers.dev
- [x] Update admin panel env with Workers URL
- [ ] Test AI endpoint with sample curriculum text ⚠️ _Manual smoke test_
- [ ] Test email alert delivery ⚠️ _Requires Email Routing enabled first_

---

## ✅ Phase 8: Security Hardening Audit Triage — DONE

### Findings from HARDENING_BACKLOG.json — Fully Triaged

| Finding                                                      | Status                              | Resolution                                                                                                                                  |
| ------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| REL-03: `SECURITY DEFINER` missing `SET search_path`         | ✅ False positive — already fixed   | `20260219100000` applies `ALTER FUNCTION` to all; `20260220213000` covers remainder; `20260219` DO block catches any stragglers dynamically |
| VUL-003: Service Role Leak in edge functions                 | ✅ False positive                   | All hits are `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — correct server-side usage. No key hardcoded.                                     |
| REL-02: Double-retry in `sync_service.dart`                  | ✅ False positive — already cleaned | grep for `retryWithBackoff`, `retryCount`, `maxRetries` = 0 results                                                                         |
| `schema-sync.test.ts` hollow                                 | ✅ False positive                   | Has 3 real integration tests                                                                                                                |
| `utils.test.ts` hollow                                       | ✅ False positive                   | Has 2 real tests                                                                                                                            |
| Empty catch in `generateQuestions.ts` / `validateContent.ts` | ✅ Intentional                      | `response.json().catch(() => ({}))` = safe fallback on error body parse failure                                                             |

### Real Bug Fixed

- [x] **`main.dart` outer catch drops stack trace** — Fixed: `catch (e)` → `catch (e, stack)` + `debugPrintStack()` (commit: `fix(dart): capture stack in outer main() catch block`)

---

### Code Hygiene (Backlog)

- [x] ~~Fix Dart warning: `main.dart` line 55 — unused catch stack variable~~ Fixed ✅
- [ ] Enable Email Routing on domain in Cloudflare Dashboard (manual)
- [ ] Test AI endpoint with sample curriculum text (manual)
- [ ] Test email alert delivery (manual, after Email Routing enabled)
- [ ] review codebase for any remaining TODOs, FIXMEs, and other comments
- [ ] delete any unused files (there are plenty of them)

---

## Postponed

- [ ] P1: Visual Regression Suite (Playwright screenshot tests)
- [ ] P3: Platform Settings
- [ ] P3: Rollback Procedures
- [ ] Mobile Card Layout for tables
- [ ] Row Selection & Bulk Actions
- [ ] Advanced Table Features

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
- [ ] Enable Email Routing on domain in Cloudflare Dashboard
- [x] Set secrets: ✅ all 4 set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALERT_WEBHOOK_SECRET`, `ADMIN_ALERT_EMAIL`)
- [x] Deploy: `cd workers && npx wrangler deploy` → https://questerix-workers.mhalim80.workers.dev
- [x] Update admin panel env with Workers URL
- [ ] Test AI endpoint with sample curriculum text
- [ ] Test email alert delivery

---

### Code Hygiene (Backlog)

- [ ] Fix Dart warning: `main.dart` line 55 — unused catch stack variable
- [ ] Clean temp files from Cursor
- [ ] review codebase for any remaining TODOs, FIXMEs, and other comments
- [ ] delete any unused files (there are plenty of them)
- [ ] Archive `.builder/` docs
- [ ] Cut CHANGELOG version `[2.1.0]`

- [ ] for everything you worked on in the chat or fixed, make sure there is a test case for it. document it. document what you learned from it
---

## Postponed

- [ ] P1: Visual Regression Suite (Playwright screenshot tests)
- [ ] P3: Platform Settings
- [ ] P3: Rollback Procedures
- [ ] Mobile Card Layout for tables
- [ ] Row Selection & Bulk Actions
- [ ] Advanced Table Features
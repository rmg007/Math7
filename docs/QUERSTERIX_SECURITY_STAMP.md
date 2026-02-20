# Questerix Security Hardening & Production Graduation (Hades Phase)

**Audit Date**: 2026-02-21
**Certification Level**: INTERNAL-PRODUCTION-READY
**Total Findings Resolved**: 17/18 (F-15 Deferred to next sprint)

## Deliverable C: Implemented Changes Matrix

| ID   | Finding                            | Resolution                                                 | Core Invariant                 | File(s)                                       |
| :--- | :--------------------------------- | :--------------------------------------------------------- | :----------------------------- | :-------------------------------------------- |
| F-01 | Broken `jwt_is_tenant_admin` alias | Replaced `p.id` with `id` in SQL                           | Internal logic integrity       | `supabase/migrations/...`                     |
| F-02 | `mastery_level` Naming Drift       | Fixed JSON key in Flutter sync                             | Data sync integrity            | `sync_service.dart`                           |
| F-03 | Hardcoded Webhook Secret           | Using `current_setting('app.settings.domain_sync_secret')` | Secret managed via DB settings | `supabase/migrations/...`                     |
| F-04 | Wildcard CORS                      | Whitelist + `getCorsHeaders` helper                        | Origin validation              | `parse-import-prompt`, `revoke-user-sessions` |
| F-05 | Missing Rate Limiting              | Implemented Persisted Rate Limiter                         | DoS prevention                 | 4 Edge Functions                              |
| F-06 | `approval_workflows` RLS scope     | Added `app_id = current_app_id()`                          | Tenant isolation               | `supabase/migrations/...`                     |
| F-07 | Hardcoded infra fallbacks          | Fail explicitly on missing env                             | Deterministic config           | `manage-app-domains/index.ts`                 |
| F-08 | AI Quota Bypass                    | Enforce quota return on AI operations                      | Cost management                | `generate-questions`, `validate-content`      |
| F-09 | Error Information Disclosure       | `withErrorSanitization` wrapper                            | Information safe-guard         | 6 Edge Functions                              |
| F-10 | Weak CSP Policies                  | Removed `unsafe-eval`                                      | XSS containment                | `admin-panel/public/_headers`                 |
| F-11 | Missing Prompt Sanitization        | `sanitizeCustomInstructions`                               | Prompt injection protection    | `parse-import-prompt`                         |
| F-12 | Unvalidated AI input               | `sanitizeSourceText`                                       | Content integrity              | `validate-content`                            |
| F-13 | Inconsistent Role Check            | Standardized to `role` enum                                | RBAC consistency               | `revoke-user-sessions`                        |
| F-14 | Timing Attack Risk                 | Constant-time comparison                                   | Cryptographic integrity        | `send-alert.ts`, 2 Edge Functions             |
| F-16 | CORS Fallback Leakage              | Empty/Safe fallback in Workers                             | Information safe-guard         | `workers/src/shared/http.ts`                  |
| F-17 | Resource Exhaustion (Files)        | Client-side 10MB limit                                     | Browser stability              | `file-parsers.ts`                             |
| F-18 | PII in Breadcrumbs                 | Recursive object redaction                                 | PII protection                 | `error-tracker.ts`                            |

## Deliverable D: Security Controls Matrix

| Control                 | Layer     | Implemented | Defense-in-Depth Impact                                                        |
| :---------------------- | :-------- | :---------- | :----------------------------------------------------------------------------- |
| **RLS / Multi-Tenancy** | Database  | Yes         | Strong isolation, prevents unauthorized data access between tenants.           |
| **JWT RBAC**            | Session   | Yes         | Ensures only authorized roles (admin/super_admin) can access privileged logic. |
| **CORS Whitelist**      | Transport | Yes         | Prevents unauthorized cross-origin requests to sensitive endpoints.            |
| **Rate Limiting**       | Network   | Yes         | Protects AI budget and prevents brute-force/DoS attacks.                       |
| **Input Sanitization**  | Content   | Yes         | Detects and neutralizes prompt injection and malformed inputs.                 |
| **Error Masking**       | App       | Yes         | Prevents leakage of internal architecture or data via error responses.         |
| **Integrity Hashing**   | Storage   | Yes         | Ensures curriculum content matches AI-generated source integrity.              |

## Deliverable E: FMEA (Critical Paths)

| Path        | Failure Mode             | Control                                 | Severity (After)    |
| :---------- | :----------------------- | :-------------------------------------- | :------------------ |
| **Auth**    | Cross-tenant login       | RLS + JWT `app_id` check                | Low                 |
| **Sync**    | Data corruption (naming) | Type-safe JSON mapping                  | Low                 |
| **AI Gen**  | Quota bypass             | Mandatory RPC token consumption         | Medium (Cost limit) |
| **Domains** | Unauthorized domain edit | Webhook secret with constant-time check | Low                 |

## Deliverable F: Graduation Criteria Checklist

- [x] All Critical/High findings resolved.
- [x] Admin Panel Lint/Build passes.
- [x] Student App Analyze passes.
- [x] RLS policies validated for cross-tenant isolation.
- [x] Rate limiting verified in code structure.
- [x] Webhook secrets externalized and timing-safe.

**Next Steps**: Deploy to staging, verify RLS via test accounts, and monitor AI token usage logs.

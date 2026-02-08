# Operation Integrity: Critical Infrastructure Remediation Plan

**Task ID:** `operation_integrity`  
**Created:** 2026-02-04T18:35:00-08:00  
**Status:** AWAITING APPROVAL  
**Architect:** Chief Architect Red Team Audit  
**Scope:** 21 Critical Defects Across Multi-Tenant Platform

---

## Executive Summary

A comprehensive Red Team audit of the Questerix platform has identified **21 critical defects** that threaten data integrity, security, and multi-tenant isolation. The platform currently exhibits "Governance Facade" and "Security Theater" patterns—specifications that look robust but implementations that fail to enforce them.

**Core Finding:** The platform will **mix user data across schools** and **crash when concurrent operations occur** if launched in current state.

---

## Defect Registry (21 Total)

### 🔴 TIER 0: LAUNCH BLOCKERS — Multi-Tenant Isolation (7 Defects)

These defects will cause **data leakage between tenants** in production.

| ID | Name | Severity | Location | Root Cause | Fix |
|----|------|----------|----------|------------|-----|
| **M1** | Zombie Tenant Trap | BLOCKER | `student-app/lib/src/core/config/app_config_service.dart:74-83` | Hardcoded fallback `app_id` when config fetch fails | Remove fallback. Throw `AppInitializationException` requiring network. |
| **M2** | Phantom Tenant | BLOCKER | `student-app/lib/src/features/auth/repositories/supabase_auth_repository.dart:27-29` | `signInAnonymously()` doesn't pass `app_id` metadata | Accept `appId` param, pass via `data: {'app_id': appId}` |
| **M3** | Global Broadcast | BLOCKER | `admin-panel/src/features/curriculum/hooks/use-publish.ts:43,71` | `curriculum_meta` uses `id='singleton'` for all tenants | Add `app_id` column to `curriculum_meta`. Query by tenant. |
| **M4** | Blind Fire RPC | BLOCKER | `admin-panel/src/features/curriculum/hooks/use-publish.ts:132` | `publish_curriculum` RPC called with no arguments | Pass `{ p_app_id: currentApp.id }` to RPC. Update RPC signature. |
| **M5** | Cross-School Kidnapping | BLOCKER | `supabase/migrations/20260204000002_ironclad_rpcs.sql:72` | `join_group_via_code` doesn't verify student's `app_id` matches group's | Add `app_id` verification: `IF target_group.app_id != student.app_id THEN RAISE` |
| **M6** | Super-Admin Leak | CRITICAL | All Admin RLS policies | `is_admin()` check doesn't scope by tenant | Update policies: `is_admin() AND app_id = profile.app_id` |
| **M7** | Blind Schema | HIGH | `student-app/lib/src/core/database/tables.dart` | Drift tables missing `app_id` column that exists in Postgres | Add `app_id` to Domains, Skills, Questions tables. Regenerate. |

### 🔴 TIER 1: DATA INTEGRITY (5 Defects)

These defects will cause **data loss or corruption** in production.

| ID | Name | Severity | Location | Root Cause | Fix |
|----|------|----------|----------|------------|-----|
| **D1** | Silent Kill | BLOCKER | `student-app/lib/src/core/sync/sync_service.dart:162-165` | Outbox items deleted after 5 failed retries | Replace DELETE with `status = 'failed'`. Add Dead Letter Queue UI. |
| **D2** | Nuclear Recovery | CRITICAL | `supabase/migrations/20260204000002_ironclad_rpcs.sql:46` | `recover_student_identity` deletes new user's progress | Use GREATEST merge (keep highest scores), not DELETE. Archive before delete. |
| **D3** | Ghost Record | HIGH | `student-app/lib/src/core/database/tables.dart:95-113` | `SkillProgress` lacks unique constraint on `(userId, skillId)` | Add `@override List<Set<Column>> get uniqueKeys => [{userId, skillId}];` |
| **D4** | Double-Push Race | HIGH | `student-app/lib/src/core/sync/sync_service.dart:85` | `push()` method not guarded by sync state | Add `if (state.isSyncing) return;` guard or use Mutex. |
| **D5** | Blind Upsert | HIGH | `student-app/lib/src/core/sync/sync_service.dart:139` | No OCC—Last Write Wins without version check | Add `version` or `updated_at` check to reject stale writes. |

### 🟠 TIER 2: API SECURITY (4 Defects)

These defects expose **financial and data security risks**.

| ID | Name | Severity | Location | Root Cause | Fix |
|----|------|----------|----------|------------|-----|
| **S1** | Open Wallet (Generate) | CRITICAL | `supabase/functions/generate-questions/index.ts` | No authentication check—anyone can call | Add `supabase.auth.getUser(token)` at top. Reject if unauthorized. |
| **S2** | Open Wallet (Validate) | CRITICAL | `supabase/functions/validate-content/index.ts` | Same—no auth, uses expensive Gemini Pro | Add identical auth check. |
| **S3** | Governance Gap | HIGH | Both Edge Functions | `consume_tenant_tokens` RPC never called | Call RPC with actual `response.usageMetadata` token count. |
| **S4** | RLS NULL Audit | HIGH | All RLS policies | Unknown behavior when `app_id IS NULL` | Audit all policies. Ensure default is DENY for NULL. |

### 🟡 TIER 3: TYPE SAFETY & CLEANUP (5 Defects)

These defects cause **maintenance debt and subtle bugs**.

| ID | Name | Severity | Location | Root Cause | Fix |
|----|------|----------|----------|------------|-----|
| **T1** | Manual Drift Tables | HIGH | `student-app/lib/src/core/database/tables.dart` | No auto-generation from DB schema | Create `scripts/generate_drift_tables.js` introspection script. |
| **T2** | Circular Integrity | MEDIUM | `student-app/lib/src/features/security/app_signature_service.dart` | Client-side HMAC with key unknown to server | DELETE entire file. Server cannot verify, so it's security theater. |
| **T3** | Shadow Logic | MEDIUM | `student-app/lib/src/features/curriculum/repositories/skill_progress_repository.dart` | `_calculateMastery` duplicates server trigger logic | Remove client calculation. Trust server-returned `mastery_level`. |
| **T4** | Schizophrenic AI | MEDIUM | `content-engine/src/generators/question_generator.py` | Duplicate Python/TypeScript AI generator logic | Deprecate Python. Standardize on TypeScript Edge Function. |
| **T5** | Heuristic Accounting | MEDIUM | `supabase/functions/generate-questions/index.ts:135-138` | Token count estimated by `length/4` instead of actual | Use `response.usageMetadata.totalTokenCount` from Gemini API. |

### 🟢 TIER 4: DEVOPS (1 Defect)

| ID | Name | Severity | Location | Root Cause | Fix |
|----|------|----------|----------|------------|-----|
| **O1** | Works on My Machine | MEDIUM | `orchestrator.ps1` | Script requires `.secrets` file, fails in CI/CD | Check `$env:SUPABASE_URL` first. Fallback to `.secrets` only if env missing. |

---

## Implementation Plan

### Phase 2.1: Multi-Tenant Foundation (M1 → M7 + S4)

**Goal:** Establish absolute tenant isolation before any other work.

**Files to Modify:**
1. `student-app/lib/src/core/config/app_config_service.dart`
2. `student-app/lib/src/features/auth/repositories/supabase_auth_repository.dart`
3. `admin-panel/src/features/curriculum/hooks/use-publish.ts`
4. `supabase/migrations/20260205_operation_integrity_tenant.sql` (NEW)
5. `student-app/lib/src/core/database/tables.dart`
6. All RLS policy files

**Verification:**
- [ ] Config fetch failure shows "Connect to Internet" screen, not fallback
- [ ] Anonymous sign-in includes `app_id` in metadata
- [ ] `curriculum_meta` queries filter by `app_id`
- [ ] `join_group_via_code` rejects cross-tenant joins
- [ ] Admin RLS policies include tenant check
- [ ] Drift tables include `app_id` column

### Phase 2.2: Data Safety Net (D1 → D5)

**Goal:** Prevent data loss from sync failures and race conditions.

**Files to Modify:**
1. `student-app/lib/src/core/sync/sync_service.dart`
2. `student-app/lib/src/core/database/tables.dart` (add unique constraint)
3. `supabase/migrations/20260205_operation_integrity_recovery.sql` (NEW - rewrite recovery RPC)

**Verification:**
- [ ] Failed sync items marked `status='failed'`, not deleted
- [ ] `SkillProgress` has unique constraint on `(userId, skillId)`
- [ ] `push()` is guarded by `state.isSyncing`
- [ ] `recover_student_identity` merges progress, doesn't delete

### Phase 2.3: API Security (S1 → S3)

**Goal:** Lock down Edge Functions from unauthorized access.

**Files to Modify:**
1. `supabase/functions/generate-questions/index.ts`
2. `supabase/functions/validate-content/index.ts`

**Verification:**
- [ ] Both functions verify `Authorization` header
- [ ] Both functions call `consume_tenant_tokens` RPC
- [ ] Token counts use `usageMetadata`, not heuristics
- [ ] Unauthorized requests return 401

### Phase 2.4: Polyglot Type Pipeline (T1)

**Goal:** Automate Dart type generation to prevent schema drift.

**Files to Create:**
1. `scripts/generate_drift_tables.js`
2. `scripts/gen_types_polyglot.ps1`

**Verification:**
- [ ] Running `gen_types_polyglot.ps1` regenerates both TS and Dart types
- [ ] Generated `tables.dart` matches Postgres schema exactly

### Phase 2.5: Cleanup (T2 → T5 + O1)

**Goal:** Remove dead code and fix minor issues.

**Files to Modify/Delete:**
1. DELETE `student-app/lib/src/features/security/app_signature_service.dart`
2. Remove references to signature service throughout codebase
3. `student-app/lib/src/features/curriculum/repositories/skill_progress_repository.dart` - remove `_calculateMastery`
4. Mark `content-engine/src/generators/question_generator.py` as deprecated
5. `orchestrator.ps1` - add environment variable fallback

**Verification:**
- [ ] No compilation errors after signature service deletion
- [ ] Mastery level comes from server, not client calculation
- [ ] Orchestrator works in CI/CD without `.secrets` file

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration breaks existing data | MEDIUM | HIGH | Test on staging first. Backup before migration. |
| Dart regeneration breaks compilation | HIGH | MEDIUM | Manual reconciliation of property names. |
| Edge Function redeploy fails | LOW | HIGH | Test locally with `supabase functions serve` first. |
| RLS policy change locks out users | MEDIUM | HIGH | Verify with test accounts before production. |

---

## Estimated Effort

| Phase | Files | Complexity | Time |
|-------|-------|------------|------|
| 2.1 Multi-Tenant | 8 | HIGH | 45 min |
| 2.2 Data Safety | 4 | MEDIUM | 25 min |
| 2.3 API Security | 2 | MEDIUM | 15 min |
| 2.4 Type Pipeline | 3 | MEDIUM | 20 min |
| 2.5 Cleanup | 5 | LOW | 15 min |
| **TOTAL** | **22** | — | **~2 hours** |

---

## Artifacts Generated

After implementation:
1. `supabase/migrations/20260205_operation_integrity_tenant.sql`
2. `supabase/migrations/20260205_operation_integrity_recovery.sql`
3. `scripts/generate_drift_tables.js`
4. `scripts/gen_types_polyglot.ps1`
5. Updated `LEARNING_LOG.md` with all fixes
6. Updated `TASK_STATE.json` with completion status

---

## Approval Gate

**This plan requires explicit USER approval before Phase 2 execution.**

Upon approval, the agent will:
1. Create `TASK_STATE.json` for this task
2. Execute Phases 2.1 → 2.5 autonomously
3. Run verification after each phase
4. Pause at Phase 6 for deployment decision

---

## Appendix A: Defect Evidence Summary

### M1 - Zombie Tenant (app_config_service.dart:74-83)
```dart
// CURRENT (BAD)
final defaultContext = AppContext(
  appId: '51f42753-b192-4bf8-9a3b-18269ad4096a', // Hardcoded!
  // ...
);
```

### M2 - Phantom Tenant (supabase_auth_repository.dart:27-29)
```dart
// CURRENT (BAD)
await _client.auth.signInAnonymously(); // No app_id passed
```

### D1 - Silent Kill (sync_service.dart:162-165)
```dart
// CURRENT (BAD)
if (item.retryCount > 5) {
  await (_database.delete(_database.outbox)...).go(); // Data loss!
}
```

### S1/S2 - Open Wallet (Edge Functions)
```typescript
// CURRENT (BAD)
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', ...);
  // NO AUTH CHECK - proceeds directly to AI generation
  const { text, ... } = await req.json();
```

### T2 - Circular Integrity (app_signature_service.dart)
```dart
// CURRENT (USELESS)
_secretKey = const Uuid().v4(); // Generated on device
// Server cannot verify because it doesn't have this key
```

---

*End of Operation Integrity Plan*

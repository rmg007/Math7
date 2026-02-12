# Admin Panel Audit Remediation — Round 2

Fix 4 verified issues from the second code audit, reject 1 false positive, downgrade several inflated severities, and document all findings and lessons learned.

---

## Triage Summary (from source code review)

| #   | Finding                                                   | Report Rating | Verified Rating    | Action                                                                       |
| --- | --------------------------------------------------------- | ------------- | ------------------ | ---------------------------------------------------------------------------- |
| 1   | Registration race condition (LoginPage.tsx)               | CRITICAL      | **HIGH**           | Fix                                                                          |
| 2   | Case sensitivity mismatch (invitation codes)              | HIGH          | **FALSE POSITIVE** | Skip — SQL already uses `upper()`                                            |
| 3   | Inconsistent SecurityLogger await (LoginPage.tsx)         | MEDIUM        | **LOW**            | Fix (quick)                                                                  |
| 4   | No rollback after code consumption                        | MEDIUM        | **N/A**            | Current flow consumes after signup                                           |
| 5   | `loadApps` race condition (AppContext.tsx)                | CRITICAL      | **HIGH**           | Fix                                                                          |
| 6   | localStorage error handling (AppContext.tsx)              | HIGH          | **MEDIUM**         | Fix (writes only — reads already guarded)                                    |
| 7   | Silent profile update failure (AppContext.tsx L96)        | HIGH          | **MEDIUM**         | Fix                                                                          |
| 8   | No unmount cleanup (AppContext.tsx)                       | MEDIUM        | **MEDIUM**         | Fix                                                                          |
| 9   | Missing MCQ correct-answer validation (import-schema.ts)  | HIGH          | **HIGH**           | Fix (root cause)                                                             |
| 10  | Unsafe cast in use-bulk-import.ts                         | MEDIUM        | **LOW**            | Skip — validated downstream by CurriculumService                             |
| 11  | Progress timeout cleanup (use-bulk-import.ts)             | MEDIUM        | **LOW**            | Skip — only triggers React warning                                           |
| 12  | Partial batch failure handling (CurriculumService.ts)     | HIGH          | **LOW**            | Skip — already returns `totalInserted` in error                              |
| 13  | Unsafe cast in CurriculumService.ts                       | MEDIUM        | **N/A**            | Skip — per AGENTS.md convention (`as unknown as Type` for Supabase bridging) |
| 14  | No retry for batches (CurriculumService.ts)               | MEDIUM        | **LOW**            | Skip — nice-to-have, not a bug                                               |
| 15  | Schema `.refine()` for correct answers (import-schema.ts) | HIGH          | **HIGH**           | Same as #9                                                                   |
| 16  | `z.any()` for solution (import-schema.ts)                 | MEDIUM        | **LOW**            | Skip — cosmetic                                                              |

**Fixes: 6 | Skips: 10 (1 false positive, 4 N/A, 5 low-risk)**

---

## Implementation Steps

### Step 1: `import-schema.ts` — Add `.refine()` for correct answers

- Add `.refine(opts => opts.some(o => o.is_correct), ...)` to both `MultipleChoiceSchema` and `McqMultiSchema`.
- This is the root fix for findings #9 and #15.
- **~4 lines changed.**

### Step 2: `LoginPage.tsx` — Atomic invitation code flow

- **New SQL migration**: Create `validate_and_use_invitation_code(p_code TEXT)` RPC that validates AND atomically consumes the code in one transaction (SELECT FOR UPDATE + UPDATE in a single function).
- **LoginPage.tsx**: Replace the 3-step flow (`validate` → `signUp` → `use`) with a 2-step flow (`signUp` → `validate_and_use`). Code is consumed only after successful signup, but atomically validated+consumed so no race window.
- Also standardize SecurityLogger calls to fire-and-forget with `.catch()` (finding #3).
- **~20 lines changed in TSX, ~30 lines in SQL.**

### Step 3: `AppContext.tsx` — Concurrency guard + cleanup

- Add `useRef(false)` loading guard to prevent concurrent `loadApps()` calls.
- Add `mounted` flag in `useEffect` to prevent state updates after unmount.
- Wrap `localStorage.setItem` calls (lines 91, 103) in try/catch.
- Wrap profile update in `handleSetCurrentApp` (line 96) in try/catch.
- **~15 lines changed.**

### Step 4: Documentation

- **`docs/LEARNING_LOG.md`**: Append session entry with findings, lessons, and preventative rules.
- **`tasks.md`**: Add new section for Round 2 audit items, mark completed ones.

---

## Lessons to Document

1. **Audit reports need source verification**: 1 of 16 findings was a false positive (case sensitivity claim contradicted by SQL using `upper()`). Several severities were inflated. Always read the actual code before accepting audit findings.
2. **Multi-step client flows are inherently racy**: Any `validate → create → consume` pattern across separate RPCs has a race window. Prefer atomic server-side operations that combine validation + mutation.
3. **React concurrent calls need guards**: `useEffect` + event listeners can invoke the same async function concurrently. A `useRef` flag is the simplest guard.
4. **`localStorage` can throw**: In private browsing or when storage is disabled, `setItem` throws. Always wrap writes in try/catch. Reads are safer but should be guarded too.
5. **Zod `.refine()` is the right place for cross-field validation**: Checking "at least one correct option" belongs in the schema, not in downstream parsers. This ensures every code path benefits.
6. **`as unknown as Type` for Supabase bridging is acceptable**: Per project conventions, this pattern is explicitly allowed when bridging Zod-validated data to Supabase-generated types. Don't "fix" what isn't broken.

---

## Files Modified

| File                                                                | Change                                 |
| ------------------------------------------------------------------- | -------------------------------------- |
| `admin-panel/src/lib/validation/import-schema.ts`                   | Add `.refine()` to MCQ schemas         |
| `supabase/migrations/YYYYMMDD_validate_and_use_invitation_code.sql` | New atomic RPC                         |
| `admin-panel/src/features/auth/pages/LoginPage.tsx`                 | Use atomic RPC, standardize logging    |
| `admin-panel/src/contexts/AppContext.tsx`                           | Loading guard, mounted flag, try/catch |
| `docs/LEARNING_LOG.md`                                              | Session entry                          |
| `tasks.md`                                                          | New audit section                      |

## Verification

- `npx tsc --noEmit` in `admin-panel/` — zero errors.
- Manual test: registration flow with valid/invalid/reused invitation codes.
- Manual test: app switching and sidebar toggle in private browsing mode.

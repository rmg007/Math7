# 🌬️ Windsurf Collaborative Brief: Hook Testing & Coverage (P1)

## 🎯 Objective

Implement missing unit tests for three critical custom hooks in the `admin-panel` to reach 100% logic coverage in the Monitoring and Mentorship features.

## 🗂️ Target Hooks

1. `features/mentorship/hooks/use-groups.ts`
   - **Logic**: Fetches groups for the `currentApp`.
   - **Test cases**: Loading state, success with data, error handling, disabled if no app.
2. `features/monitoring/hooks/use-known-issues.ts`
   - **Logic**: Fetches all known issues ordered by `created_at`.
   - **Test cases**: Standard fetch, order verification, error handling.
3. `features/monitoring/hooks/use-known-issues-mutations.ts`
   - **Logic**: Create, Update, Delete, Bulk Update, Bulk Delete mutations.
   - **Test cases**: Success responses for each mutation, cache invalidation (`known-issues` key).

## 🛠️ Implementation Specs (Antigravity's Standard)

- **Mocking**: Use the centralized factory:
  ```typescript
  import { createMockSupabase } from "@/__tests__/mocks/supabase-factory";
  const { mockSupabase, supabase } = createMockSupabase();
  ```
- **Wrapper**: Wrap hooks in `QueryClientProvider` using the standard `wrapper` pattern found in `use-questions.test.tsx`.
- **Type Safety**: Avoid `as any`. Use proper types or `as unknown as Type` if necessary for complex Supabase chains.
- **Assertions**:
  - Verify Supabase `.from('table')` and `.select()` calls.
  - Verify correct filter clauses (`.eq('app_id', ...)`).
  - Verify `result.current.data` matches mock data.

## 📍 File Locations

- **Source**: `admin-panel/src/features/[feature]/hooks/[hook].ts`
- **Tests**: `admin-panel/src/features/[feature]/hooks/__tests__/[hook].test.tsx` (Create these folders/files).

## 🚀 Verification

Run the new tests specifically:

```powershell
npx vitest run src/features/monitoring/hooks/__tests__/
npx vitest run src/features/mentorship/hooks/__tests__/
```

---

**Reviewer**: Antigravity
**Status**: Ready for Implementation

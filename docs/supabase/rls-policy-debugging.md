# Supabase: RLS Policy Debugging Guide

> **Date**: 2026-02-09  
> **Status**: Active reference document  
> **Incident**: 400 Bad Request on all authenticated API calls

---

## The Golden Rule

**SECURITY DEFINER functions must reference columns that actually exist.**

If a `SECURITY DEFINER` function used in an RLS policy references a non-existent column, every authenticated query against that table will return `400 Bad Request` from PostgREST. The error message is opaque — it does NOT say "column not found."

---

## Incident: `is_tenant_admin()` Column Mismatch

### Timeline

1. **Baseline** (`00000000000001_baseline.sql`): RLS policies used `jwt_is_admin()` which reads from the JWT token — no table access needed.
2. **Operation Integrity** (`20260205_operation_integrity.sql`): Replaced `jwt_is_admin()` policies with `is_tenant_admin()` + `current_app_id()`. These are `SECURITY DEFINER` functions that query the `profiles` table.
3. **Schema evolved**: The `profiles` table's `is_admin` boolean column was replaced by a `role` enum column (`user_role`).
4. **Function not updated**: `is_tenant_admin()` still referenced `profiles.is_admin = true` — a column that no longer exists.
5. **Result**: Every authenticated query to `domains`, `skills`, or `questions` triggered the broken function, causing a PostgreSQL runtime error surfaced as HTTP 400.

### Root Cause

```sql
-- BROKEN: references non-existent column
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true          -- ❌ Column does not exist
        AND app_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Fix Applied

```sql
-- FIXED: uses the actual 'role' column
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')  -- ✅ Correct column
        AND app_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## Debugging Methodology

### How to diagnose a 400 from PostgREST

1. **Test with the anon key directly** (bypasses RLS):
   ```powershell
   $headers = @{ "apikey" = "<ANON_KEY>"; "Authorization" = "Bearer <ANON_KEY>" }
   Invoke-RestMethod -Uri "https://<PROJECT>.supabase.co/rest/v1/<table>?select=*&limit=1" -Headers $headers
   ```
   - If this **succeeds**: the issue is in RLS policies (authenticated role).
   - If this **fails**: the issue is in the query itself (bad column, syntax, etc.).

2. **Check `SECURITY DEFINER` functions** against the current schema:
   ```sql
   -- List all SECURITY DEFINER functions
   SELECT proname, prosrc FROM pg_proc 
   WHERE prosecdef = true AND pronamespace = 'public'::regnamespace;
   ```

3. **Cross-reference with `database.types.ts`**: The generated types file is the ground truth for what columns exist. If a function references a column not in the types, it's broken.

### Common 400 causes in Supabase

| Cause | Symptom | Fix |
|-------|---------|-----|
| RLS function references missing column | All authenticated queries fail | Update function to use correct column |
| Self-referencing RLS without `SECURITY DEFINER` | Infinite recursion on policy eval | Use `SECURITY DEFINER` helper functions |
| Conflicting permissive policies with errors | Any policy error blocks all | Drop broken policies |
| Schema cache stale after DDL changes | Queries fail on new/renamed columns | Reload schema cache in Dashboard |

---

## Prevention Rules

1. **Always verify column names** against `database.types.ts` before writing RLS functions.
2. **When renaming columns**, grep all migrations for the old column name — especially `SECURITY DEFINER` functions.
3. **Test RLS changes** with both anon and authenticated tokens before deploying.
4. **Keep `SECURITY DEFINER` functions minimal** — they bypass RLS and should do the least possible work.

---

## Related Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260205_operation_integrity.sql` | Created `is_tenant_admin()` and `current_app_id()` |
| `supabase/migrations/20260210001106_fix_admin_rls_policies.sql` | Fix migration (applied via Dashboard) |
| `admin-panel/src/lib/database.types.ts` | Schema ground truth |
| `docs/lessons-learned/supabase-order-by-syntax.md` | Related `.order()` syntax fix |

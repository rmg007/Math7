# RLS `is_tenant_admin()` Column Mismatch Fix

**Date**: 2026-02-09  
**Severity**: Critical (total admin panel outage)  
**Time to resolve**: ~3 hours (debugging), 1 minute (fix)

## Problem

The deployed admin panel returned `400 Bad Request` on every page load. All Supabase API calls to `domains`, `skills`, and `questions` tables failed for authenticated users.

## Investigation Path (What Didn't Work)

1. **Environment variables** — Checked Cloudflare Pages secrets and Vite build output. Variables were correctly embedded. ❌ Not the cause.
2. **`.order()` syntax** — Made `.order()` calls explicit with `{ ascending: true }` and `foreignTable` options. Good hygiene but ❌ not the cause.
3. **RLS policy conflicts** — Created migration to drop conflicting hardening policies. Partially relevant but ❌ not the root cause.

## Root Cause

The `is_tenant_admin()` SECURITY DEFINER function referenced `profiles.is_admin` — a column that **does not exist**. The `profiles` table uses a `role` enum column instead.

```sql
-- BROKEN (column doesn't exist)
AND is_admin = true

-- FIXED (correct column)
AND role IN ('admin', 'super_admin')
```

This function was called by the `domains_tenant_admin`, `skills_tenant_admin`, and `questions_tenant_admin` RLS policies. Every authenticated query triggered the broken function, causing PostgreSQL to error, which PostgREST surfaced as HTTP 400.

## How It Was Found

The breakthrough was a **direct API test with the anon key** (which bypasses RLS):

```powershell
Invoke-RestMethod -Uri ".../rest/v1/domains?select=*&order=sort_order.asc&limit=1" -Headers @{ "apikey" = "<ANON_KEY>" }
```

This succeeded, proving the query syntax was fine and the issue was strictly in the **authenticated RLS evaluation path**.

From there, tracing the RLS policy chain:

1. `domains_tenant_admin` → calls `is_tenant_admin()`
2. `is_tenant_admin()` → queries `profiles WHERE is_admin = true`
3. `profiles` table → has `role` column, not `is_admin`

Cross-referencing with `database.types.ts` confirmed the column mismatch.

## Fix Applied

SQL executed via **Supabase Dashboard SQL Editor** (CLI migration sync was broken):

```sql
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND app_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Also dropped conflicting policies from the hardening migration that redundantly queried `profiles` with its own RLS.

## Key Lessons

1. **Test with anon key first** — If it works without RLS, the bug is in your policies/functions.
2. **SECURITY DEFINER functions are invisible failure points** — They don't show up in normal code reviews and their errors are opaque.
3. **Schema changes must grep migration functions** — When a column is renamed/removed, search ALL `SECURITY DEFINER` functions for references.
4. **`database.types.ts` is the schema ground truth** — Always cross-reference function SQL against the generated types.
5. **Supabase CLI limitations are real** — When `db push` fails due to migration sync, the Dashboard SQL Editor is the reliable fallback.

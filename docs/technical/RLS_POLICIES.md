---
title: "RLS Policies and Security"
app_scope: security
doc_type: reference
complexity: high
priority: high
status: active
summary: "Row-Level Security policies, admin role checks, and database security patterns for Supabase."
tags:
  - rls
  - supabase
  - authentication
  - rbac
related_files:
  - "infrastructure/supabase-schema.md"
last_validated_by: antigravity-agent-v1
last_validated_at: 2026-02-03
version: "1.0"
---

# RLS Policies and Security

> **Critical:** Security is enforced in the DATABASE, not the UI.

## Core Principle

All access control is implemented via Supabase Row-Level Security (RLS) policies. The UI may hide elements, but the database is the final gatekeeper.

## Admin Role Check

The `is_admin()` function is the single source of truth for admin access:

```sql
-- Uses profiles.role, NOT a separate user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Policy Patterns

### Admin-Only Tables (domains, skills, questions)

```sql
-- Admins can do everything
CREATE POLICY domains_admin_all ON domains
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Students can only read published content
CREATE POLICY domains_student_read ON domains
  FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);
```

### User-Owned Tables (attempts, progress)

```sql
-- Users own their data
CREATE POLICY attempts_owner_all ON attempts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all for reporting
CREATE POLICY attempts_admin_read ON attempts
  FOR SELECT
  USING (is_admin());
```

### Profiles Table

```sql
-- Users can read/update their own profile
CREATE POLICY profiles_self ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY profiles_admin_read ON profiles
  FOR SELECT
  USING (is_admin());
```

## RLS Verification

Run verification before any database changes:

```bash
make db_verify_rls
```

This executes `supabase/scripts/verify_rls.sql` which checks:
- RLS is enabled on all required tables
- `is_admin()` function exists
- Anonymous users cannot write to protected tables

## Security Checklist

Before deploying database changes:

- [ ] RLS is enabled on all new tables
- [ ] `is_admin()` used for admin checks (not custom logic)
- [ ] No direct role column modifications allowed via API
- [ ] Soft delete (`deleted_at`) used instead of hard delete
- [ ] `verify_rls.sql` updated for new tables
- [ ] `make db_verify_rls` passes

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---------|------------------|
| Checking role in UI only | Enforce via RLS policy |
| Creating `user_roles` table | Use `profiles.role` |
| Allowing role self-assignment | Admin-only role changes |
| Hard deleting records | Use `deleted_at` soft delete |
| Trusting client-side user ID | Use `auth.uid()` in policies |

# Questerix Database Refactoring Plan

**Created:** 2026-02-03  
**Status:** 📋 PLANNING  
**Priority:** HIGH - Foundation for all future development

---

## Executive Summary

This plan addresses database architectural debt and establishes a clean, performant foundation following PostgreSQL best practices.

---

## Current State Analysis

### Tables (17 total)
| Table | Rows | RLS | Purpose | Issues |
|-------|------|-----|---------|--------|
| `profiles` | 6 | ✅ | User accounts | Core table, heavily referenced |
| `groups` | 8 | ✅ | Mentor groups | RLS recursion issues |
| `group_members` | 0 | ✅ | Group membership | Cross-table RLS deps |
| `assignments` | 0 | ✅ | Learning assignments | |
| `domains` | 31 | ✅ | Curriculum domains | |
| `skills` | 65 | ✅ | Learning skills | |
| `questions` | 285 | ✅ | Quiz questions | |
| `attempts` | 0 | ✅ | Question attempts | |
| `sessions` | 0 | ✅ | Learning sessions | |
| `skill_progress` | 0 | ✅ | Mastery tracking | |
| `apps` | 0 | ✅ | Multi-tenant apps | |
| `subjects` | 0 | ✅ | Subject areas | |
| `invitation_codes` | 3 | ✅ | Signup codes | |
| `super_admin_ids` | 2 | ❌ | **WORKAROUND TABLE** | Delete this |
| `outbox` | 0 | ✅ | Event outbox | |
| `sync_meta` | 0 | ❌ | Sync metadata | |
| `curriculum_meta` | 0 | ✅ | Version tracking | |

### Current Problems

1. **RLS Architecture**
   - `super_admin_ids` bypass table is a hack
   - Multiple redundant helper functions (`is_super_admin`, `check_super_admin`, `owns_group`, `is_group_owner`)
   - Cross-table RLS policies cause infinite recursion

2. **Normalization Issues**
   - User role stored in `profiles.role` but also needs bypass table
   - No separation between authentication and authorization concerns

3. **Missing Indexes**
   - `groups.owner_id` - needs index for ownership lookups
   - `group_members.user_id` - needs index for membership checks
   - `profiles.role` - needs index for role-based filtering

4. **Schema Debt**
   - 34 migration files, many are patches/fixes
   - No clear migration consolidation

---

## Proposed Architecture

### Phase 1: JWT-Based Authorization (Clean RLS)

**Goal:** Eliminate all RLS recursion by embedding roles in JWT tokens.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Login     │ ──▶ │  Auth Hook adds  │ ──▶ │  JWT contains   │
│             │     │  role to claims  │     │  user_role      │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
                           ┌──────────────────────────────────────┐
                           │  RLS Policy checks:                   │
                           │  auth.jwt() ->> 'user_role' = 'admin' │
                           │  (No database query = No recursion!)  │
                           └──────────────────────────────────────┘
```

**Implementation:**

```sql
-- 1. Auth Hook Function (adds role to JWT)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = (event->>'user_id')::uuid;
  
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'student')));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

**Enable in Dashboard:** Authentication → Hooks → Customize Access Token → Select `custom_access_token_hook`

---

### Phase 2: Cleanup Workarounds

**Delete these objects:**

```sql
-- Tables to delete
DROP TABLE IF EXISTS super_admin_ids CASCADE;

-- Functions to delete
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS check_super_admin();
DROP FUNCTION IF EXISTS owns_group(uuid);
DROP FUNCTION IF EXISTS is_group_owner(uuid);
```

---

### Phase 3: Simplified RLS Policies

**Pattern:** All policies use only:
- `auth.uid()` - Current user ID
- `auth.jwt() ->> 'user_role'` - Role from JWT (no DB query!)

```sql
-- ══════════════════════════════════════════════════════════════
-- GROUPS TABLE
-- ══════════════════════════════════════════════════════════════

-- Drop all existing
DROP POLICY IF EXISTS "Owner access" ON groups;
DROP POLICY IF EXISTS "Admin access" ON groups;
DROP POLICY IF EXISTS "Owners manage groups" ON groups;
DROP POLICY IF EXISTS "Members view groups" ON groups;
DROP POLICY IF EXISTS "Super admins access all groups" ON groups;

-- Clean policies
CREATE POLICY "groups_select_admin"
  ON groups FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'));

CREATE POLICY "groups_all_owner"
  ON groups FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_select_member"
  ON groups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = id AND gm.user_id = auth.uid()
  ));

-- ══════════════════════════════════════════════════════════════
-- GROUP_MEMBERS TABLE
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Self membership" ON group_members;
DROP POLICY IF EXISTS "Owner manages members" ON group_members;

-- Self can see own membership
CREATE POLICY "group_members_select_self"
  ON group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin/Super admin full access
CREATE POLICY "group_members_all_admin"
  ON group_members FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin'));

-- Group owner can manage members (uses SECURITY DEFINER to avoid recursion)
CREATE POLICY "group_members_all_owner"
  ON group_members FOR ALL TO authenticated
  USING (is_group_owner_safe(group_id))
  WITH CHECK (is_group_owner_safe(group_id));

-- Helper function that doesn't trigger RLS
CREATE OR REPLACE FUNCTION is_group_owner_safe(gid uuid)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = gid AND owner_id = auth.uid());
$$;
```

---

### Phase 4: Missing Indexes

```sql
-- ══════════════════════════════════════════════════════════════
-- CRITICAL INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════════════════════════════

-- Profiles: Role-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

-- Groups: Owner lookups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id 
  ON groups(owner_id);

-- Group Members: Fast membership checks
CREATE INDEX IF NOT EXISTS idx_group_members_user_id 
  ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id 
  ON group_members(group_id);

-- Composite index for membership lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_group_members_group_user 
  ON group_members(group_id, user_id);

-- Questions: Sort order queries
CREATE INDEX IF NOT EXISTS idx_questions_skill_sort 
  ON questions(skill_id, sort_order);

-- Attempts: User history queries
CREATE INDEX IF NOT EXISTS idx_attempts_user_created 
  ON attempts(user_id, created_at DESC);

-- Sessions: Active session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_ended 
  ON sessions(user_id, ended_at) 
  WHERE ended_at IS NULL;

-- Skill Progress: Mastery dashboards
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_skill 
  ON skill_progress(user_id, skill_id);
```

---

### Phase 5: Migration Consolidation

**Current:** 34 migration files with many patches  
**Proposed:** Squash into clean baseline + new migrations

```
BEFORE:                              AFTER:
├── 20260127000001_...               ├── 00000000000001_baseline.sql
├── 20260127000002_...               │   (consolidated clean state)
├── 20260127000003_...               │
├── ...                              ├── 20260203000001_mentor_hub.sql
├── 20260203000007_create_mentor_    │   (clean mentor implementation)
├── 20260203000008_fix_groups_...    │
├── 20260203000009_...               └── (future migrations)
├── 20260203000010_...
├── 20260203000011_...
└── 20260203000012_...
```

**Process:**
1. Backup current database
2. Generate consolidated schema dump
3. Create single baseline migration
4. Archive old migrations
5. Reset migration history

---

## Implementation Checklist

### Step 1: Enable JWT Auth Hook (Dashboard Action Required)
- [ ] Deploy `custom_access_token_hook` function
- [ ] Enable hook in Supabase Dashboard → Authentication → Hooks
- [ ] **User Action:** Log out and log back in to get new JWT with role

### Step 2: Deploy Clean RLS Policies
- [ ] Drop all RLS workaround tables and functions
- [ ] Create simplified policies using JWT claims
- [ ] Test all user roles (student, mentor, admin, super_admin)

### Step 3: Add Performance Indexes
- [ ] Create all missing indexes
- [ ] Run ANALYZE on tables
- [ ] Verify query plans with EXPLAIN

### Step 4: Consolidate Migrations (Optional - Future)
- [ ] Create baseline migration
- [ ] Archive old migration files
- [ ] Reset Supabase migration history

---

## Testing Plan

| Test Case | Expected Result |
|-----------|-----------------|
| Super admin views all groups | ✅ All groups visible |
| Admin views all groups | ✅ All groups visible |
| Mentor views own groups | ✅ Only owned groups visible |
| Student views member groups | ✅ Only joined groups visible |
| Cross-user data isolation | ✅ No unauthorized access |
| Query performance | ✅ < 50ms for common queries |

---

## Rollback Plan

If issues occur:
1. Restore `super_admin_ids` table from backup
2. Disable Auth Hook in dashboard
3. Restore previous RLS policies

---

## Timeline

| Phase | Duration | Dependency |
|-------|----------|------------|
| Phase 1: JWT Auth Hook | 30 min | Dashboard access |
| Phase 2: Cleanup | 15 min | Phase 1 complete + user re-login |
| Phase 3: Clean RLS | 30 min | Phase 2 complete |
| Phase 4: Indexes | 15 min | None |
| Phase 5: Migration Consolidation | 1 hour | All phases complete |

**Total:** ~2.5 hours

---

## Decision Required

Before proceeding, please confirm:

1. **Do you have Supabase Dashboard access?** (Needed to enable Auth Hook)
2. **Is downtime acceptable?** (Users need to re-login after auth hook is enabled)
3. **Should we consolidate migrations now or later?** (Can defer to after core features complete)

---

## Appendix: Complete Migration Script

Once approved, I will generate a single comprehensive migration that implements all changes in the correct order.

# JWT Claims vs Database Queries for RLS Policies

**Date**: 2026-02-14
**Severity**: High (security and reliability impact)
**Time to resolve**: 2 hours (design), 30 minutes (implementation)
**Impact**: Improved security and eliminated JWT configuration dependency

## Problem

Super admin cross-tenant access required reliable role verification in Row Level Security (RLS) policies. Initial approach relied on JWT claims (`auth.jwt() ->> 'user_role'`), but this proved unreliable due to:

1. **JWT Configuration Complexity**: Requires proper Supabase Auth hook setup
2. **Deployment Dependency**: Claims must be correctly embedded in JWT tokens
3. **Debugging Difficulty**: Hard to verify claim presence without specialized tools
4. **Maintenance Burden**: Additional configuration layer to maintain

## Investigation Path

1. **JWT Claims Approach**: Initially implemented custom access token hook in Supabase Auth settings

   ```sql
   -- Custom hook to add user_role to JWT
   CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
   RETURNS jsonb AS $$
   -- Query database and add role to claims
   $$;
   ```

   ❌ Complex setup, potential for misconfiguration

2. **Database Query Approach**: Direct database queries in RLS helper functions
   ```sql
   -- Query profiles table directly
   SELECT role FROM public.profiles WHERE id = auth.uid()
   ```
   ✅ Simple, reliable, no external dependencies

## Root Cause Analysis

JWT claims approach failed because:

- Supabase Auth hooks require dashboard configuration
- JWT generation happens outside application control
- Debugging JWT contents requires specialized tools
- Additional failure point in authentication chain

Database query approach succeeded because:

- Direct database access within RLS context
- No external configuration required
- Easy to debug and verify
- Consistent with existing RLS patterns

## Solution Implemented

Replaced JWT claim-based helper functions with database-backed queries:

```sql
-- BEFORE (JWT claims - unreliable)
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'user_role') = 'super_admin';
$$;

-- AFTER (Database query - reliable)
CREATE OR REPLACE FUNCTION public.jwt_is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    ),
    false
  );
$$;
```

## Benefits Achieved

1. **Reliability**: No dependency on JWT configuration correctness
2. **Security**: Direct database verification of user roles
3. **Maintainability**: Single source of truth for role definitions
4. **Debugging**: Easy to verify with simple database queries
5. **Performance**: Minimal overhead (profiles table is small and indexed)

## Migration Strategy

Created `20260214210000_super_admin_jwt_claims.sql` with:

- Updated helper functions for admin, super_admin, and mentor roles
- Backward compatibility maintained
- Zero-downtime deployment possible

## Testing Verification

```sql
-- Test queries to verify function behavior
SELECT jwt_is_super_admin(); -- Should return true for super admin user
SELECT jwt_is_admin();       -- Should return true for admin/super admin users
SELECT jwt_is_mentor();      -- Should return true for mentor users
```

## Lessons Learned

1. **Prefer Database Queries Over JWT Claims**: For security-critical RLS policies, direct database verification is more reliable than JWT claims
2. **Minimize Authentication Chain Complexity**: Each additional link in the auth chain increases failure potential
3. **Test RLS Policies Directly**: Use database queries to verify policy behavior, not just application-level testing
4. **Document Security Decisions**: RLS policy implementations should be well-documented for future maintenance

## Prevention Measures

- **Code Review Checklist**: Flag any new JWT claim usage in RLS policies
- **Testing Requirements**: All RLS helper functions must have database-level tests
- **Documentation Standard**: Security decisions must be documented in lessons-learned
- **Migration Template**: Include RLS policy verification in all database migrations

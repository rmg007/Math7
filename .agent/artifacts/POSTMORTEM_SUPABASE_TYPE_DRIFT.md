# Postmortem: Supabase Type Drift & TypeScript Build Failures

**Date**: February 4, 2026  
**Duration**: ~45 minutes  
**Severity**: Build-blocking  
**Status**: RESOLVED ✅

---

## Executive Summary

A cascading series of TypeScript errors blocked the admin panel build. The root cause was a **schema drift** between the Supabase MCP-generated types and the actual database schema, compounded by local interface definitions that diverged from both.

---

## Timeline of Events

1. **Initial Symptom**: `npm run build` failed with multiple TypeScript errors
2. **First Attempt**: Regenerated Supabase types using MCP `generate_typescript_types` tool
3. **Discovery 1**: MCP-generated types contained wrong column names for `questions` table
4. **Discovery 2**: Local component interfaces had their own divergent field names
5. **Discovery 3**: Multiple tables had similar schema/code mismatches
6. **Resolution**: Manual correction of types and all affected code references

---

## Issues Identified

### Issue 1: MCP Type Generation Returned Stale/Incorrect Schema

**Symptoms**:
- `questions` table types showed `question_text`, `correct_answer`, `difficulty`
- Actual database had `content`, `solution`, `points`

**Root Cause**: The MCP `generate_typescript_types` tool returned types that didn't match the actual remote Supabase schema. This could be due to:
- Cached schema snapshot
- Migration that wasn't fully propagated
- MCP internal caching

**Evidence**:
```typescript
// MCP Generated (WRONG)
questions: {
  Row: {
    correct_answer: string
    question_text: string
    difficulty: number
  }
}

// Actual Database (CORRECT)
questions: {
  Row: {
    solution: Json | null
    content: string
    points: number
  }
}
```

### Issue 2: Local Interface Definitions Diverged from Database

**Symptoms**:
- `GroupDetailPage.tsx` used `due_date`, `target_id`, `joined_at`, `mastery_level`
- Database had `deadline`, `skill_id`, `created_at`, `mastery_score`

**Root Cause**: Developers created local TypeScript interfaces without referencing the generated database types. When the schema evolved, the local interfaces weren't updated.

**Example**:
```typescript
// Local Interface (WRONG)
interface Assignment {
  due_date: string | null;   // Should be: deadline
  target_id: string;          // Should be: skill_id
}

// Database Column Names (CORRECT)
assignments table:
  - deadline: timestamptz
  - skill_id: uuid
```

### Issue 3: Missing Required Database Fields

**Symptoms**:
- `AssignmentCreatePage.tsx` insert mutation was missing required `assigned_by` field
- Insert would fail silently or throw runtime errors

**Root Cause**: When creating insert mutations, developer referenced an outdated schema that didn't include the `assigned_by` NOT NULL constraint.

### Issue 4: Non-Existent RPC Function Reference

**Symptoms**:
- `use-publish.ts` called `supabase.rpc('publish_curriculum')` 
- TypeScript error: function doesn't exist in generated types

**Root Cause**: The `publish_curriculum` RPC was either:
- Never created in the database
- Planned but not implemented
- Removed during schema cleanup

---

## Fixes Applied

| File | Issue | Fix |
|------|-------|-----|
| `database.types.ts` | Wrong column names for `questions` table | Manual correction: `question_text`→`content`, `correct_answer`→`solution`, `difficulty`→`points` |
| `GroupDetailPage.tsx` | Interface mismatch | Updated interfaces and all references |
| `AssignmentCreatePage.tsx` | Wrong column names + missing field | Changed `target_id`→`skill_id`, `due_date`→`deadline`, added `assigned_by` |
| `question-form.tsx` | Reading from wrong db fields | Fixed to use `content`, `solution`, `points` |
| `use-publish.ts` | Non-existent RPC | Cast as `any` (workaround) + TODO comment |

---

## Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                    Schema Drift Chain                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Database Schema              Local Types                   │
│   (Source of Truth)           (Generated)                   │
│         │                          │                         │
│         │  ❌ Out of sync          │                         │
│         ▼                          ▼                         │
│   ┌─────────────┐           ┌─────────────┐                 │
│   │  Supabase   │───────────│  database   │                 │
│   │  (Remote)   │  MCP Gen  │  .types.ts  │                 │
│   └─────────────┘           └─────────────┘                 │
│                                    │                         │
│                                    │ ❌ Not imported         │
│                                    ▼                         │
│                             ┌─────────────┐                 │
│                             │   Local     │                 │
│                             │ Interfaces  │                 │
│                             │  (Manual)   │                 │
│                             └─────────────┘                 │
│                                    │                         │
│                                    ▼                         │
│                             TypeScript Errors                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Lessons Learned

### 1. Always Verify MCP-Generated Types Against Actual Schema

**Before trusting generated types**, run a verification query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'your_table'
ORDER BY ordinal_position;
```

### 2. Never Create Manual Interfaces for Database Tables

**Bad Pattern** (creates drift):
```typescript
interface Assignment {
  due_date: string | null;  // Manual definition
}
```

**Good Pattern** (single source of truth):
```typescript
import { Database } from '@/lib/database.types';
type Assignment = Database['public']['Tables']['assignments']['Row'];
```

### 3. Use Type Helpers for Common Patterns

Add these to your codebase:
```typescript
// In database.types.ts or a separate types.ts
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Usage
type Assignment = Tables<'assignments'>;
```

### 4. Run Type Verification Before Migrations

Before applying migrations:
1. Regenerate types
2. Run `tsc --noEmit`
3. Fix any type errors

### 5. The "Simplified Flat Helpers" Pattern

When Supabase types include `__InternalSupabase` (for PostgrestVersion), use this pattern:
```typescript
type DefaultSchema = Database['public'];

// Simple helper that avoids the __InternalSupabase issue
export type Tables<T extends keyof DefaultSchema['Tables']> = 
  DefaultSchema['Tables'][T]['Row'];
```

---

## Prevention Checklist

- [ ] **Pre-commit hook**: Add `tsc --noEmit` to pre-commit
- [ ] **CI/CD gate**: Block deployments on TypeScript errors
- [ ] **Type import convention**: Establish team convention to always import from `database.types.ts`
- [ ] **Weekly type sync**: Schedule automated type regeneration
- [ ] **Interface audit**: Review for manual interfaces that should use generated types

---

## Related Knowledge Items

- `admin_panel_development` - Contains "Supabase Type Remediation" artifact
- `questerix_database_architecture` - Database schema standards
- `testing_strategies_flutter_playwright` - Silent failure checks for Supabase inserts

---

## Action Items

| Priority | Task | Status |
|----------|------|--------|
| HIGH | Create `publish_curriculum` RPC or remove dead code | TODO |
| MEDIUM | Add pre-commit type checking | TODO |
| MEDIUM | Audit all local interfaces for database types | TODO |
| LOW | Add MCP type generation verification step to deployment | TODO |

---

## Conclusion

This incident highlighted the danger of **schema drift** in TypeScript projects with external data sources. The key takeaway is to maintain a **single source of truth** for database types and never manually recreate interfaces that should derive from generated types.

The fix was successful, but the underlying patterns that caused this should be addressed through tooling and conventions.

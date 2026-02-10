# Supabase Order By Syntax

**Date**: 2026-02-09

## Problem

A `400 Bad Request` error was occurring on API calls to Supabase that included an `.order()` clause. The error was intermittent and not immediately obvious, as it seemed to be related to the presence of the `order` parameter in the URL, but not the environment variables.

## Root Cause

The issue was traced to the syntax of the `.order()` method in the Supabase JavaScript client. While the `sort_order` column existed on the tables, the client was not correctly interpreting the default ascending option. In cases of sorting on foreign tables, a special syntax is required.

## Solution

The fix was to make the ordering explicit in all cases:

1.  **Explicit Ascending**: For simple ordering, the `ascending: true` option was explicitly set.

    ```typescript
    // Before
    .order('sort_order')

    // After
    .order('sort_order', { ascending: true })
    ```

2.  **Foreign Table Sorting**: For sorting on foreign tables, the `foreignTable` option was used.

    ```typescript
    // Before
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // After
    if (sortBy.includes(".")) {
      const [foreignTable, foreignColumn] = sortBy.split(".");
      query = query.order(foreignColumn, {
        foreignTable,
        ascending: sortOrder === "asc",
      });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }
    ```

This ensures that the Supabase client constructs the correct query URL in all cases.

## Note: This Was Not the Root Cause

While these `.order()` fixes are good hygiene, the actual `400 Bad Request` error was caused by a **broken `SECURITY DEFINER` function** (`is_tenant_admin()`) referencing a non-existent column (`is_admin`) in the `profiles` table. See `docs/lessons-learned/rls-tenant-admin-fix.md` for the full root cause analysis.

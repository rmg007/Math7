# UUID Validation Pattern - Quick Reference

**Last Updated**: 2026-02-09  
**Status**: ✅ Production Standard

---

## When to Use

Apply UUID validation in these scenarios:

1. **Before Supabase Queries**: Any `.eq()`, `.in()`, or filter using a UUID
2. **React Query Hooks**: In both `queryFn` and `enabled` flag
3. **Mutation Hooks**: Before insert/update/delete operations
4. **Context Values**: When setting app_id, user_id, group_id from external sources
5. **localStorage**: When reading UUIDs from persistent storage

---

## Standard Pattern

### 1. Add Validation Helper (once per file)

```typescript
// UUID validation helper
function isValidUUID(uuid: string | undefined | null): uuid is string {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### 2. Apply in Query Hooks

```typescript
export function useMyQuery(id: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['my-data', id, currentApp?.app_id],
    queryFn: async () => {
      // Step 1: Check existence
      if (!currentApp?.app_id) {
        throw new Error('No app selected');
      }

      // Step 2: Validate UUID format
      if (!isValidUUID(currentApp.app_id)) {
        console.error('Invalid app_id format:', currentApp.app_id);
        throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
      }

      // Step 3: Execute query
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('app_id', currentApp.app_id); // Now safe

      if (error) throw error;
      return data;
    },
    // Step 4: Prevent execution with invalid UUID
    enabled: Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id),
  });
}
```

### 3. Apply in Mutation Hooks

```typescript
export function useCreateItem() {
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (item: ItemInput) => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      if (!isValidUUID(currentApp.app_id)) {
        throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
      }

      const { data, error } = await supabase
        .from('items')
        .insert({ ...item, app_id: currentApp.app_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

---

## Common Mistakes

### ❌ DON'T: Only check existence
```typescript
if (!currentApp?.app_id) throw new Error('No app selected');
// Missing format validation!
```

### ❌ DON'T: Skip validation in enabled flag
```typescript
enabled: Boolean(currentApp?.app_id)
// Query will execute with invalid UUID!
```

### ❌ DON'T: Use non-null assertion
```typescript
.eq('app_id', currentApp.app_id!)
// Bypasses TypeScript safety!
```

### ✅ DO: Validate both existence and format
```typescript
if (!currentApp?.app_id) throw new Error('No app selected');
if (!isValidUUID(currentApp.app_id)) {
  throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
}
```

### ✅ DO: Add debug logging
```typescript
if (!isValidUUID(currentApp.app_id)) {
  console.error('Invalid app_id:', currentApp.app_id);
  throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
}
```

### ✅ DO: Use in enabled flag
```typescript
enabled: Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id)
```

---

## Testing Checklist

When implementing UUID validation:

- [ ] Test with valid UUID (happy path)
- [ ] Test with no app selected (undefined/null)
- [ ] Test with malformed UUID string
- [ ] Test with corrupted localStorage
- [ ] Verify error messages are clear
- [ ] Check browser console for debug logs

---

## Related Documentation

- **Full Analysis**: `docs/reports/SUPABASE_400_ERROR_RESOLUTION.md`
- **Type Safety Guide**: `docs/technical/type_safety_and_supabase_patterns.md`
- **Admin Panel Architecture**: `docs/architecture/admin_panel_architecture_ssot.md`

---

## Questions?

If you encounter UUID validation issues:
1. Check the browser console for debug logs
2. Verify the UUID format matches RFC 4122
3. Ensure localStorage hasn't been corrupted
4. Review the full resolution doc for troubleshooting steps

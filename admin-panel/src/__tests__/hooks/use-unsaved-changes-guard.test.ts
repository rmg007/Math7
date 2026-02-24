import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUnsavedChangesGuard } from '@/admin-panel/src/hooks/use-unsaved-changes-guard';

describe('useUnsavedChangesGuard', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard());
    expect(result.current).toBeDefined();
  });

});

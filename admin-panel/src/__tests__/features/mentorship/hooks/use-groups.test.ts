import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGroups } from '@/admin-panel/src/features/mentorship/hooks/use-groups';

describe('useGroups', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useGroups());
    expect(result.current).toBeDefined();
  });

});

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGroups } from '@/features/mentorship/hooks/use-groups';

describe('useGroups', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useGroups());
    expect(result.current).toBeDefined();
  });
});

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUrlState } from '@/admin-panel/src/hooks/use-url-state';

describe('useUrlState', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useUrlState());
    expect(result.current).toBeDefined();
  });

});

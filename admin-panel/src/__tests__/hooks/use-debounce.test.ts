import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '@/admin-panel/src/hooks/use-debounce';

describe('useDebounce', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useDebounce());
    expect(result.current).toBeDefined();
  });

});

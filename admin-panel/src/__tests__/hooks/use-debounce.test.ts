import { useDebounce } from '@/hooks/use-debounce';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should return debounced value for numbers', () => {
    const { result } = renderHook(() => useDebounce(42, 500));
    expect(result.current).toBeDefined();
  });
});

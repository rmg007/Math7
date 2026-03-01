/**
 * use-debounce.test.tsx
 *
 * Tests: Timer behaviour and cleanup for useDebounce
 *
 * Test IDs: AP-HOOK-001 .. AP-HOOK-006
 */
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../use-debounce';

describe('useDebounce — AP-HOOK-001', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AP-HOOK-001: returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('AP-HOOK-002: does not update before the delay expires', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'updated' });
    vi.advanceTimersByTime(299);
    expect(result.current).toBe('initial');
  });

  it('AP-HOOK-003: updates after the delay expires', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'updated' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('AP-HOOK-004: resets the timer on rapid successive changes (debounce behaviour)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'b' });
    vi.advanceTimersByTime(200); // 'b' timer not yet fired

    rerender({ value: 'c' }); // resets timer
    vi.advanceTimersByTime(200); // 'c' timer not yet fired (only 200 of 300ms)
    expect(result.current).toBe('a'); // nothing fired yet

    act(() => {
      vi.advanceTimersByTime(100); // 'c' now fires at 300ms
    });
    expect(result.current).toBe('c'); // 'b' was never settled
  });

  it('AP-HOOK-005: cleans up the timeout on unmount — no update after unmount', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'updated' });
    unmount();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Value remains at the last-rendered snapshot; no setState-on-unmounted-component error
    expect(result.current).toBe('initial');
  });

  it('AP-HOOK-006: works with non-string generic types (number)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    });
    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });
});

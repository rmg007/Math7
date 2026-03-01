/**
 * use-url-state.test.tsx
 *
 * Tests: URL-sync filter state — the key edge cases are the pruning rules:
 *   - default value → param removed from URL
 *   - empty string  → param removed from URL
 *   - non-default   → param added/updated in URL
 *
 * Test IDs: AP-HOOK-010 .. AP-HOOK-015
 */
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useUrlState } from '../use-url-state';

function makeWrapper(initialSearch = '') {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initialSearch ? `/?${initialSearch}` : '/']}>
      {children}
    </MemoryRouter>
  );
}

describe('useUrlState — AP-HOOK-010', () => {
  it('AP-HOOK-010: returns the default value when the param is absent from the URL', () => {
    const { result } = renderHook(() => useUrlState('q', 'all'), { wrapper: makeWrapper() });
    expect(result.current[0]).toBe('all');
  });

  it('AP-HOOK-011: returns the URL param value when present', () => {
    const { result } = renderHook(() => useUrlState('q', ''), { wrapper: makeWrapper('q=hello') });
    expect(result.current[0]).toBe('hello');
  });

  it('AP-HOOK-012: setting a non-default value stores it in the URL', () => {
    const { result } = renderHook(() => useUrlState('status', 'all'), { wrapper: makeWrapper() });
    act(() => {
      result.current[1]('live');
    });
    expect(result.current[0]).toBe('live');
  });

  it('AP-HOOK-013: setting the default value prunes the param from the URL', () => {
    const { result } = renderHook(() => useUrlState('q', 'all'), { wrapper: makeWrapper('q=foo') });
    act(() => {
      result.current[1]('all'); // value equals defaultValue → should be removed
    });
    // Falls back to default because the param is no longer in the URL
    expect(result.current[0]).toBe('all');
  });

  it('AP-HOOK-014: setting empty string prunes the param from the URL', () => {
    const { result } = renderHook(() => useUrlState('q', 'all'), { wrapper: makeWrapper('q=foo') });
    act(() => {
      result.current[1](''); // empty string → should also be removed
    });
    expect(result.current[0]).toBe('all'); // falls back to default
  });

  it('AP-HOOK-015: multiple keys coexist in the URL without interfering', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/?status=live&page=2']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(
      () => ({
        status: useUrlState('status', 'all'),
        page: useUrlState('page', '1'),
      }),
      { wrapper }
    );
    expect(result.current.status[0]).toBe('live');
    expect(result.current.page[0]).toBe('2');
  });
});

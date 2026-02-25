import { useUrlState } from '@/hooks/use-url-state';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, null, children);

describe('useUrlState', () => {
  it('should return the default value when no URL param is set', () => {
    const { result } = renderHook(() => useUrlState('q', ''), { wrapper });
    const [value] = result.current;
    expect(value).toBe('');
  });

  it('should return a setter function', () => {
    const { result } = renderHook(() => useUrlState('page', '1'), { wrapper });
    const [, setValue] = result.current;
    expect(typeof setValue).toBe('function');
  });
});

import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Mock react-router-dom's useBlocker
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useBlocker: vi.fn().mockReturnValue({
      state: 'unblocked',
      proceed: vi.fn(),
      reset: vi.fn(),
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, null, children);

describe('useUnsavedChangesGuard', () => {
  it('should initialize without error when not dirty', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(false), { wrapper });
    expect(result.current).toBeUndefined(); // hook returns void
  });

  it('should initialize without error when dirty', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true), { wrapper });
    expect(result.current).toBeUndefined();
  });
});

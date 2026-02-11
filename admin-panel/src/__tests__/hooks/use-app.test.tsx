import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApp } from '@/hooks/use-app';
import { AppContext } from '@/contexts/AppContextDefinition';

// Mock the context
vi.mock('@/contexts/AppContextDefinition', () => ({
  AppContext: {
    _currentValue: undefined,
  },
}));

describe('useApp', () => {
  const mockContextValue = {
    user: { id: '1', name: 'Test User' },
    theme: 'light',
    setUser: vi.fn(),
    setTheme: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return context value when used within AppProvider', () => {
    // Mock the context to return a value
    vi.mocked(AppContext)._currentValue = mockContextValue;

    const { result } = renderHook(() => useApp());

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw error when used outside AppProvider', () => {
    // Mock the context to return undefined (outside provider)
    vi.mocked(AppContext)._currentValue = undefined;

    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');
  });

  it('should work with different context values', () => {
    const darkThemeContext = {
      ...mockContextValue,
      theme: 'dark',
      user: { id: '2', name: 'Dark User' },
    };

    vi.mocked(AppContext)._currentValue = darkThemeContext;

    const { result } = renderHook(() => useApp());

    expect(result.current.theme).toBe('dark');
    expect(result.current.user.name).toBe('Dark User');
  });

  it('should handle context with minimal properties', () => {
    const minimalContext = {
      user: null,
      theme: 'system',
    };

    vi.mocked(AppContext)._currentValue = minimalContext;

    const { result } = renderHook(() => useApp());

    expect(result.current).toEqual(minimalContext);
  });

  it('should preserve function references in context', () => {
    vi.mocked(AppContext)._currentValue = mockContextValue;

    const { result } = renderHook(() => useApp());

    expect(typeof result.current.setUser).toBe('function');
    expect(typeof result.current.setTheme).toBe('function');
  });
});

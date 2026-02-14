import { AppContext, type AppContextType } from '@/contexts/AppContextDefinition';
import { useApp } from '@/hooks/use-app';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('useApp', () => {
  const mockContextValue: AppContextType = {
    apps: [],
    currentApp: null,
    isLoading: false,
    setCurrentApp: vi.fn(),
    refreshApps: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    userRole: null,
    isSuperAdmin: false,
  };

  it('should return context value when used within AppProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContext.Provider value={mockContextValue}>{children}</AppContext.Provider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw error when used outside AppProvider', () => {
    // Silence console.error for expected error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');

    consoleErrorSpy.mockRestore();
  });

  it('should work with different context values', () => {
    const customContext: AppContextType = {
      ...mockContextValue,
      isLoading: true,
      isSidebarCollapsed: true,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContext.Provider value={customContext}>{children}</AppContext.Provider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSidebarCollapsed).toBe(true);
  });

  it('should preserve function references in context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppContext.Provider value={mockContextValue}>{children}</AppContext.Provider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(typeof result.current.setCurrentApp).toBe('function');
    expect(typeof result.current.toggleSidebar).toBe('function');
  });
});

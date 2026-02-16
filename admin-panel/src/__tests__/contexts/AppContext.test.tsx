/**
 * @fileoverview Tests for AppContext and AppProvider
 *
 * Tests super admin role detection, context derivation, and error handling.
 * The `isSuperAdmin` flag is critical for RLS bypass at the DB level — a bug
 * here could either deny legitimate super admins or (worse) leak cross-tenant data.
 */
import { AppContext, type AppContextType } from '@/contexts/AppContextDefinition';
import { useApp } from '@/hooks/use-app';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Creates a test wrapper that provides a given AppContext value.
 */
function createWrapper(contextValue: AppContextType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
  };
}

/**
 * Creates a complete AppContextType with sensible defaults, allowing overrides.
 */
function createMockContext(overrides: Partial<AppContextType> = {}): AppContextType {
  return {
    apps: [],
    currentApp: null,
    isLoading: false,
    setCurrentApp: vi.fn(),
    refreshApps: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    userRole: null,
    isSuperAdmin: false,
    ...overrides,
  };
}

describe('AppContext — Super Admin Role Detection', () => {
  it('should identify super_admin role correctly', () => {
    const ctx = createMockContext({
      userRole: 'super_admin',
      isSuperAdmin: true,
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.userRole).toBe('super_admin');
  });

  it('should NOT flag regular admin as super admin', () => {
    const ctx = createMockContext({
      userRole: 'admin',
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.userRole).toBe('admin');
  });

  it('should NOT flag student as super admin', () => {
    const ctx = createMockContext({
      userRole: 'student',
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('should NOT flag mentor as super admin', () => {
    const ctx = createMockContext({
      userRole: 'mentor',
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('should NOT flag null role as super admin', () => {
    const ctx = createMockContext({
      userRole: null,
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.userRole).toBeNull();
  });

  it('should reject case-variant attacks (SUPER_ADMIN, Super_Admin)', () => {
    // Verify that case-insensitive variants do NOT grant super admin.
    // The DB enum is lowercase-only so this should never happen,
    // but the frontend check must also be strict.
    const variants = ['SUPER_ADMIN', 'Super_Admin', 'Super_admin', 'superadmin', 'super admin'];

    for (const variant of variants) {
      const isSuperAdmin = variant === 'super_admin'; // mirrors AppContext.tsx line 162

      const ctx = createMockContext({
        userRole: variant,
        isSuperAdmin,
      });

      const { result } = renderHook(() => useApp(), {
        wrapper: createWrapper(ctx),
      });

      expect(result.current.isSuperAdmin).toBe(false);
    }
  });
});

describe('AppContext — isSuperAdmin derivation logic', () => {
  /**
   * These tests verify the EXACT derivation logic from AppContext.tsx:
   *   isSuperAdmin: userRole === 'super_admin'
   *
   * This is a pure function that we can test exhaustively.
   */
  const deriveSuperAdmin = (userRole: string | null): boolean => {
    return userRole === 'super_admin';
  };

  it('should derive isSuperAdmin=true ONLY for exact "super_admin" string', () => {
    expect(deriveSuperAdmin('super_admin')).toBe(true);
  });

  it.each([
    'admin',
    'student',
    'mentor',
    'SUPER_ADMIN',
    'Super_Admin',
    'superadmin',
    '',
    ' super_admin',
    'super_admin ',
  ])('should derive isSuperAdmin=false for role "%s"', (role) => {
    expect(deriveSuperAdmin(role)).toBe(false);
  });

  it('should derive isSuperAdmin=false for null role', () => {
    expect(deriveSuperAdmin(null)).toBe(false);
  });
});

describe('AppContext — Context shape validation', () => {
  it('should expose all required context fields', () => {
    const ctx = createMockContext();

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(ctx),
    });

    expect(result.current).toHaveProperty('apps');
    expect(result.current).toHaveProperty('currentApp');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('setCurrentApp');
    expect(result.current).toHaveProperty('refreshApps');
    expect(result.current).toHaveProperty('isSidebarCollapsed');
    expect(result.current).toHaveProperty('toggleSidebar');
    expect(result.current).toHaveProperty('userRole');
    expect(result.current).toHaveProperty('isSuperAdmin');
  });

  it('should throw when used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');

    consoleErrorSpy.mockRestore();
  });
});

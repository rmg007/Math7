import { AllTheProviders } from '@/__tests__/utils/test-utils';
import { useApp } from '@/hooks/use-app';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardStats } from '../use-dashboard';

// Mock useApp to return a mock currentApp
vi.mock('@/hooks/use-app', () => ({
  useApp: vi.fn(),
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.mocked(useApp).mockReturnValue({
      currentApp: { app_id: 'test-app-id', name: 'Test App' },
      apps: [],
      isLoading: false,
      setCurrentApp: vi.fn(),
    } );
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper: AllTheProviders });
    expect(result.current).toBeDefined();
    // It should be in loading state initially
    expect(result.current.isLoading).toBe(true);
  });
});


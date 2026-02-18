/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useCreateDomain,
    useDeleteDomain,
    useDomain,
    useDomains,
    usePaginatedDomains,
} from '../use-domains';

// Mock dependencies
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      order: vi.fn(() => chain),
      or: vi.fn(() => chain),
      range: vi.fn(() => chain),
      single: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      in: vi.fn(() => chain),
      // Add then to make it thenable (like a Promise)
      then: vi.fn((onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled)),
    };
    return chain;
  };

  const mockFrom = createMockChain();

  return {
    supabase: {
      from: vi.fn(() => mockFrom),
    },
    supabaseAdmin: {
      from: vi.fn(() => mockFrom),
    },
  };
});

describe('useDomains', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockAppId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDomains = [
    { domain_id: '550e8400-e29b-41d4-a716-446655440001', title: 'Domain 1', slug: 'domain-1', sort_order: 1 },
    { domain_id: '550e8400-e29b-41d4-a716-446655440002', title: 'Domain 2', slug: 'domain-2', sort_order: 2 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useApp).mockReturnValue({
      currentApp: {
        app_id: mockAppId,
        created_at: new Date().toISOString(),
        display_name: 'Test App',
        grade_level: 'K-12',
        grade_number: 1,
        is_active: true,
        subdomain: 'test',
        subject_id: 'subject-1',
        updated_at: new Date().toISOString(),
        ai_token_limit: 0,
        branding: {},
        description: '',
      },
      apps: [],
      isLoading: false,
      setCurrentApp: vi.fn(),
      refreshApps: vi.fn(),
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      userRole: null,
      isSuperAdmin: false,
    });
  });

  describe('useDomains hook', () => {
    it('should fetch domains for current app', async () => {
      const mockChain = supabase.from('domains') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockDomains, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDomains(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('domains');
      expect(result.current.data).toEqual(mockDomains);
    });

    it('should throw error when no app is selected', async () => {
      vi.mocked(useApp).mockReturnValue({
        currentApp: null,
      } as any);

      const { result } = renderHook(() => useDomains(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('usePaginatedDomains', () => {
    it('should fetch paginated domains', async () => {
      const mockChain = supabase.from('domains') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({
          data: mockDomains,
          error: null,
          count: 2,
        }).then(onFulfilled)
      );

      const params = { page: 1, pageSize: 10 };
      const { result } = renderHook(() => usePaginatedDomains(params), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toEqual(mockDomains);
      expect(result.current.data?.totalCount).toBe(2);
      expect(result.current.data?.totalPages).toBe(1);
    });
  });

  describe('useDomain', () => {
    it('should fetch a single domain', async () => {
      const mockChain = supabase.from('domains') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockDomains[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDomain(mockDomains[0].domain_id), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockDomains[0]);
    });
  });

  describe('useCreateDomain', () => {
    it('should create a new domain', async () => {
      const mockChain = supabase.from('domains') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockDomains[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateDomain(), { wrapper });

      const newDomain = {
        title: 'New Domain',
        slug: 'new-domain',
        sort_order: 3,
        status: 'draft' as const,
      };

      await result.current.mutateAsync(newDomain);

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newDomain,
          app_id: mockAppId,
        })
      );
    });
  });

  describe('useDeleteDomain', () => {
    it('should mark a domain as deleted', async () => {
      const mockChain = supabase.from('domains') as any;
      const updateChain = {
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((onFulfilled: any) =>
          Promise.resolve({ data: null, error: null }).then(onFulfilled)
        ),
      };
      mockChain.update.mockReturnValue(updateChain);
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteDomain(), { wrapper });

      await result.current.mutateAsync(mockDomains[0].domain_id);

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(updateChain.eq).toHaveBeenCalledWith('domain_id', mockDomains[0].domain_id);
      expect(updateChain.eq).toHaveBeenCalledWith('app_id', mockAppId);
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateSkill, usePaginatedSkills, useSkills } from '../use-skills';

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
      then: vi.fn((onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled)),
    };
    return chain;
  };

  const mockFrom = createMockChain();

  return {
    supabase: {
      from: vi.fn(() => mockFrom),
    },
  };
});

describe('useSkills', () => {
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
  const mockSkills = [
    { skill_id: '1', title: 'Skill 1', slug: 'skill-1', domain_id: 'domain-1' },
    { skill_id: '2', title: 'Skill 2', slug: 'skill-2', domain_id: 'domain-1' },
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

  describe('useSkills hook', () => {
    it('should fetch skills for current app', async () => {
      const mockChain = supabase.from('skills') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockSkills, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkills(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('skills');
      expect(result.current.data).toEqual(mockSkills);
    });

    it('should filter by domainId', async () => {
      const mockChain = supabase.from('skills') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: [mockSkills[0]], error: null }).then(onFulfilled)
      );

      renderHook(() => useSkills('domain-1'), { wrapper });

      expect(mockChain.eq).toHaveBeenCalledWith('domain_id', 'domain-1');
    });
  });

  describe('usePaginatedSkills', () => {
    it('should fetch paginated skills', async () => {
      const mockChain = supabase.from('skills') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({
          data: mockSkills,
          error: null,
          count: 2,
        }).then(onFulfilled)
      );

      const params = { page: 1, pageSize: 10 };
      const { result } = renderHook(() => usePaginatedSkills(params), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.totalCount).toBe(2);
    });
  });

  describe('useCreateSkill', () => {
    it('should insert a new skill', async () => {
      const mockChain = supabase.from('skills') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockSkills[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateSkill(), { wrapper });

      const newSkill = {
        title: 'New Skill',
        slug: 'new-skill',
        domain_id: 'domain-1',
        sort_order: 1,
        status: 'draft' as const,
      };

      await result.current.mutateAsync(newSkill);

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newSkill,
          app_id: mockAppId,
        })
      );
    });
  });
});

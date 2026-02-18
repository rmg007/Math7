/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateSkill,
  useDuplicateSkill,
  usePaginatedSkills,
  useSkill,
  useSkills,
} from '../use-skills';

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
      maybeSingle: vi.fn(() => chain),
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
    {
      skill_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Skill 1',
      slug: 'skill-1',
      domain_id: 'domain-1',
    },
    {
      skill_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Skill 2',
      slug: 'skill-2',
      domain_id: 'domain-1',
    },
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

  describe('useSkill (single)', () => {
    it('should fetch a single skill by id', async () => {
      const mockChain = supabase.from('skills') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockSkills[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkill('550e8400-e29b-41d4-a716-446655440001'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockSkills[0]);
    });

    it('should handle missing skill gracefully (returns null)', async () => {
      const mockChain = supabase.from('skills') as any;
      // Simulate "no rows found" from .maybeSingle() -> returns null data, null error
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkill('550e8400-e29b-41d4-a716-000000000000'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-000000000000');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
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

  describe('useDuplicateSkill', () => {
    it('should duplicate a skill', async () => {
      const mockChain = supabase.from('skills') as any;
      const originalSkill = {
        ...mockSkills[0],
        title: 'Skill 1',
        slug: 'skill-1',
        domain_id: 'domain-1',
        app_id: mockAppId,
      };

      // Mock fetching original, then inserting duplicate
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: originalSkill, error: null }).then(onFulfilled)
      );

      mockChain.then.mockImplementation((onFulfilled: any) =>
        Promise.resolve({
          data: {
            ...originalSkill,
            title: 'Skill 1 (Copy)',
            slug: 'skill-1_copy_123',
            status: 'draft',
          },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateSkill(), { wrapper });

      await result.current.mutateAsync('550e8400-e29b-41d4-a716-446655440001');

      // Verify fetch happened
      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');

      // Verify insert happened
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId,
          status: 'draft',
          title: 'Skill 1 (Copy)',
          domain_id: 'domain-1',
        })
      );
    });

    it('should allow super admin to duplicate cross-app skill', async () => {
      const mockChain = supabase.from('skills') as any;
      const sourceAppId = '550e8400-e29b-41d4-a716-446655440001';
      const originalSkill = {
        ...mockSkills[0],
        title: 'Cross-App Skill',
        slug: 'cross-skill',
        domain_id: 'domain-1',
        app_id: sourceAppId, // Different from currentApp
      };

      // Mock super admin context
      vi.mocked(useApp).mockReturnValue({
        currentApp: {
          app_id: mockAppId,
          created_at: new Date().toISOString(),
          display_name: 'Current App',
          grade_level: 'K-12',
          grade_number: 1,
          is_active: true,
          subdomain: 'current',
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
        isSuperAdmin: true, // Super Admin
      });

      // Mock fetching original (should NOT filter by app_id)
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: originalSkill, error: null }).then(onFulfilled)
      );

      // Mock inserting duplicate (should use currentApp.app_id)
      mockChain.then.mockImplementation((onFulfilled: any) =>
        Promise.resolve({
          data: {
            ...originalSkill,
            app_id: mockAppId,
            title: 'Cross-App Skill (Copy)',
            status: 'draft',
          },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateSkill(), { wrapper });

      await result.current.mutateAsync('550e8400-e29b-41d4-a716-446655440001');

      // Verify fetch did NOT filter by app_id (super admin cross-app access)
      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockChain.eq).not.toHaveBeenCalledWith('app_id', mockAppId);

      // Verify insert used currentApp.app_id
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId, // Destination is current app
          status: 'draft',
          title: 'Cross-App Skill (Copy)',
          domain_id: 'domain-1',
        })
      );
    });

    it('should enforce app_id for non-super admin', async () => {
      const mockChain = supabase.from('skills') as any;
      const originalSkill = {
        ...mockSkills[0],
        title: 'Same-App Skill',
        slug: 'same-skill',
        domain_id: 'domain-1',
        app_id: mockAppId,
      };

      // Mock fetching original (should filter by app_id for non-super admin)
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: originalSkill, error: null }).then(onFulfilled)
      );

      mockChain.then.mockImplementation((onFulfilled: any) =>
        Promise.resolve({
          data: { ...originalSkill, title: 'Same-App Skill (Copy)', status: 'draft' },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateSkill(), { wrapper });

      await result.current.mutateAsync('550e8400-e29b-41d4-a716-446655440001');

      // Verify fetch filtered by app_id (non-super admin)
      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockChain.eq).toHaveBeenCalledWith('app_id', mockAppId);
    });
  });
});

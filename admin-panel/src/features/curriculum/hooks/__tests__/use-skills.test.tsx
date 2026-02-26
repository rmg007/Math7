import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';
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
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useSkills', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
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
    
    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as unknown as ReturnType<typeof supabase.from>);

    vi.mocked(useApp).mockReturnValue({
      currentApp: {
        app_id: mockAppId,
        display_name: 'Test App',
        ai_token_limit: 0,
        branding: {},
        created_at: new Date().toISOString(),
        description: '',
        grade_level: 'K-12',
        grade_number: 1,
        is_active: true,
        subdomain: 'test',
        subject_id: null,
        updated_at: new Date().toISOString(),
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
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockSkills, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkills(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('skills');
      expect(result.current.data).toEqual(mockSkills);
    });

    it('should filter by domainId', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: [mockSkills[0]], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkills('domain-1'), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('domain_id', 'domain-1');
    });
  });

  describe('useSkill (single)', () => {
    it('should fetch a single skill by id', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockSkills[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSkill('550e8400-e29b-41d4-a716-446655440001'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockSupabase.queryBuilder.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockSkills[0]);
    });
  });

  describe('usePaginatedSkills', () => {
    it('should fetch paginated skills', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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

      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newSkill,
          app_id: mockAppId,
        })
      );
    });
  });

  describe('useDuplicateSkill', () => {
    it('should duplicate a skill', async () => {
      const originalSkill = {
        ...mockSkills[0],
        title: 'Skill 1',
        slug: 'skill-1',
        domain_id: 'domain-1',
        app_id: mockAppId,
      };

      // Mock fetching original
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: originalSkill, error: null }).then(onFulfilled)
      );

      // Mock inserting duplicate
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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

      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId,
          status: 'draft',
          title: 'Skill 1 (Copy)',
        })
      );
    });

    it('should allow super admin to duplicate cross-app skill', async () => {
      const sourceAppId = 'source-app';
      const originalSkill = {
        ...mockSkills[0],
        title: 'Cross-App Skill',
        slug: 'cross-skill',
        domain_id: 'domain-1',
        app_id: sourceAppId,
      };

      vi.mocked(useApp).mockReturnValue({
        currentApp: {
          app_id: mockAppId,
          display_name: 'Current App',
          ai_token_limit: 0,
          branding: {},
          created_at: new Date().toISOString(),
          description: '',
          grade_level: 'K-12',
          grade_number: 1,
          is_active: true,
          subdomain: 'current',
          subject_id: null,
          updated_at: new Date().toISOString(),
        },
        apps: [],
        isLoading: false,
        setCurrentApp: vi.fn(),
        refreshApps: vi.fn(),
        isSidebarCollapsed: false,
        toggleSidebar: vi.fn(),
        userRole: null,
        isSuperAdmin: true,
      });

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: originalSkill, error: null }).then(onFulfilled)
      );

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: { ...originalSkill, app_id: mockAppId, title: 'Cross-App Skill (Copy)', status: 'draft' },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateSkill(), { wrapper });

      await result.current.mutateAsync('550e8400-e29b-41d4-a716-446655440001');

      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('skill_id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockSupabase.queryBuilder.eq).not.toHaveBeenCalledWith('app_id', mockAppId);
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId,
          title: 'Cross-App Skill (Copy)',
        })
      );
    });
  });
});




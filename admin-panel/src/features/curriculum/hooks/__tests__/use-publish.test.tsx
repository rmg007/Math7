import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurriculumMeta, usePublishCurriculum, usePublishPreview } from '../use-publish';

// Mock dependencies
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      single: vi.fn(() => chain),
      maybeSingle: vi.fn(() => chain),
      is_deleted: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data: null, error: null, count: 0 }).then(onFulfilled)
      ),
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn(() => createMockChain()),
      rpc: vi.fn(),
    },
  };
});

describe('usePublish', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useApp).mockReturnValue({
      currentApp: {
        app_id: mockAppId,
        display_name: 'Test App',
      } as any,
      apps: [],
      isLoading: false,
      setCurrentApp: vi.fn(),
      refreshApps: vi.fn(),
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
    } as any);
  });

  describe('useCurriculumMeta', () => {
    it('should fetch meta for current app', async () => {
      const mockData = { version: 1, last_published_at: new Date().toISOString() };

      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) =>
            Promise.resolve({ data: mockData, error: null }).then(onFulfilled)
          ),
        } as any;
      });

      const { result } = renderHook(() => useCurriculumMeta(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('curriculum_meta');
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('usePublishPreview', () => {
    it('should aggregate stats and validation issues', async () => {
      // Mock the sequence of calls in Promise.all
      // 0: meta, 1: draft domains, 2: live domains, 3: draft skills, 4: live skills, 5: draft questions, 6: live questions
      const mockResponses = [
        { data: { version: 1, last_published_at: null }, error: null }, // meta
        { count: 1, data: null, error: null }, // draft domains
        { count: 5, data: null, error: null }, // live domains
        { count: 0, data: null, error: null }, // draft skills
        { count: 10, data: null, error: null }, // live skills
        { count: 2, data: null, error: null }, // draft questions
        { count: 20, data: null, error: null }, // live questions
      ];

      let callIndex = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        const index = callIndex++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) => Promise.resolve(mockResponses[index]).then(onFulfilled)),
        } as any;
      });

      const { result } = renderHook(() => usePublishPreview(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.stats.liveDomains).toBe(5);
      expect(result.current.data?.stats.liveQuestions).toBe(20);
      expect(result.current.data?.canPublish).toBe(true);
      expect(result.current.data?.validationIssues).toHaveLength(1); // Draft items warning
    });
  });

  describe('usePublishCurriculum', () => {
    it('should call publish_curriculum RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { success: true, version: 2 },
        error: null,
      } as any);

      const { result } = renderHook(() => usePublishCurriculum(), { wrapper });

      await result.current.mutateAsync();

      expect(supabase.rpc).toHaveBeenCalledWith('publish_curriculum', {
        p_app_id: mockAppId,
      });
    });
  });
});

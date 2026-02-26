/* eslint-disable @typescript-eslint/no-explicit-any */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useCreateQuestion,
    useDeleteQuestion,
    useDuplicateQuestion,
    usePaginatedQuestions,
    useQuestion,
    useQuestions,
} from '../use-questions';

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
      ilike: vi.fn(() => chain),
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

describe('useQuestions', () => {
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
  const mockQuestions = [
    { question_id: '1', content: 'Question 1', skill_id: 'skill-1' },
    { question_id: '2', content: 'Question 2', skill_id: 'skill-1' },
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

  describe('useQuestions hook', () => {
    it('should fetch questions for current app and skill', async () => {
      const mockChain = supabase.from('questions') ;
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockQuestions, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestions('skill-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('questions');
      expect(mockChain.eq).toHaveBeenCalledWith('skill_id', 'skill-1');
      expect(result.current.data).toEqual(mockQuestions);
    });
  });

  describe('usePaginatedQuestions', () => {
    it('should fetch paginated questions with filters', async () => {
      const mockChain = supabase.from('questions') ;
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: mockQuestions,
          error: null,
          count: 2,
        }).then(onFulfilled)
      );

      const params = { page: 1, pageSize: 10, search: 'test', status: 'draft' as const };
      const { result } = renderHook(() => usePaginatedQuestions(params), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockChain.ilike).toHaveBeenCalledWith('content', '%test%');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'draft');
      expect(result.current.data?.data).toEqual(mockQuestions);
    });
  });

  describe('useQuestion', () => {
    it('should fetch a single question by id without invalid subjects relation', async () => {
      const mockChain = supabase.from('questions') ;
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestion('550e8400-e29b-41d4-a716-446655440001'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify query structure
      expect(mockChain.eq).toHaveBeenCalledWith(
        'question_id',
        '550e8400-e29b-41d4-a716-446655440001'
      );

      // Get the select argument
      const selectCall = mockChain.select.mock.calls.find((call: any[]) =>
        call[0].includes('skills')
      );
      expect(selectCall).toBeDefined();
      const selectQuery = selectCall[0];

      // Assert it does NOT contain 'subjects'
      expect(selectQuery).not.toContain('subjects');
      expect(selectQuery).toContain('domains');

      expect(mockChain.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockQuestions[0]);
    });

    it('should handle missing question gracefully (returns null)', async () => {
      const mockChain = supabase.from('questions') ;
      // Simulate "no rows found"
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestion('550e8400-e29b-41d4-a716-000000000000'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockChain.eq).toHaveBeenCalledWith(
        'question_id',
        '550e8400-e29b-41d4-a716-000000000000'
      );
      expect(mockChain.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateQuestion', () => {
    it('should insert a new question', async () => {
      const mockChain = supabase.from('questions') ;
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateQuestion(), { wrapper });

      const newQuestion = {
        content: 'New Question',
        skill_id: 'skill-1',
        type: 'multiple_choice' as const,
        points: 10,
        status: 'draft' as const,
        solution: '',
      };

      await result.current.mutateAsync(newQuestion );

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newQuestion,
          app_id: mockAppId,
        })
      );
    });
  });

  describe('useDeleteQuestion', () => {
    it('should soft-delete a question', async () => {
      const mockChain = supabase.from('questions') ;
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteQuestion(), { wrapper });

      await result.current.mutateAsync('1');

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('question_id', '1');
    });
  });
  describe('useDuplicateQuestion', () => {
    it('should duplicate a question', async () => {
      const mockChain = supabase.from('questions') ;
      const originalQuestion = {
        ...mockQuestions[0],
        content: 'Question 1',
        skill_id: 'skill-1',
        app_id: mockAppId,
      };

      // Mock fetching original, then inserting duplicate
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: originalQuestion, error: null }).then(onFulfilled)
      );

      mockChain.then.mockImplementation((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: { ...originalQuestion, content: 'Question 1', status: 'draft' },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateQuestion(), { wrapper });

      await result.current.mutateAsync('1');

      // Verify fetch happened
      expect(mockChain.eq).toHaveBeenCalledWith('question_id', '1');

      // Verify insert happened
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId,
          status: 'draft',
          skill_id: 'skill-1',
        })
      );
    });

    it('should allow super admin to duplicate cross-app question', async () => {
      const mockChain = supabase.from('questions') ;
      const sourceAppId = '550e8400-e29b-41d4-a716-446655440001';
      const originalQuestion = {
        ...mockQuestions[0],
        content: 'Cross-App Question',
        skill_id: 'skill-1',
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
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: originalQuestion, error: null }).then(onFulfilled)
      );

      // Mock inserting duplicate (should use currentApp.app_id)
      mockChain.then.mockImplementation((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: { ...originalQuestion, app_id: mockAppId, status: 'draft' },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateQuestion(), { wrapper });

      await result.current.mutateAsync('1');

      // Verify fetch did NOT filter by app_id (super admin cross-app access)
      expect(mockChain.eq).toHaveBeenCalledWith('question_id', '1');
      expect(mockChain.eq).not.toHaveBeenCalledWith('app_id', mockAppId);

      // Verify insert used currentApp.app_id
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          app_id: mockAppId, // Destination is current app
          status: 'draft',
          skill_id: 'skill-1',
        })
      );
    });

    it('should enforce app_id for non-super admin', async () => {
      const mockChain = supabase.from('questions') ;
      const originalQuestion = {
        ...mockQuestions[0],
        content: 'Same-App Question',
        skill_id: 'skill-1',
        app_id: mockAppId,
      };

      // Mock fetching original (should filter by app_id for non-super admin)
      mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: originalQuestion, error: null }).then(onFulfilled)
      );

      mockChain.then.mockImplementation((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({
          data: { ...originalQuestion, status: 'draft' },
          error: null,
        }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDuplicateQuestion(), { wrapper });

      await result.current.mutateAsync('1');

      // Verify fetch filtered by app_id (non-super admin)
      expect(mockChain.eq).toHaveBeenCalledWith('question_id', '1');
      expect(mockChain.eq).toHaveBeenCalledWith('app_id', mockAppId);
    });
  });
});



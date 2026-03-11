import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBulkDeleteQuestions,
  useBulkUpdateQuestionsStatus,
  useCreateQuestion,
  useDeleteQuestion,
  usePaginatedQuestions,
  useQuestion,
  useQuestions,
  useUpdateQuestion,
} from '../use-questions';

// Mock dependencies
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useQuestions', () => {
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

  const MOCK_QUESTION_ID = '550e8400-e29b-41d4-a716-446655440000';
  const mockQuestions = [
    {
      id: MOCK_QUESTION_ID,
      question_id: MOCK_QUESTION_ID,
      content: 'Question 1',
      skill_id: 'skill-1',
      status: 'draft',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      question_id: '550e8400-e29b-41d4-a716-446655440001',
      content: 'Question 2',
      skill_id: 'skill-1',
      status: 'live',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as any);

    vi.mocked(useApp).mockReturnValue({
      currentApp: {
        app_id: 'app-1',
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
        features: {},
      },
      apps: [],
      isLoading: false,
      setCurrentApp: vi.fn(),
      refreshApps: vi.fn(),
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      userRole: null,
      isSuperAdmin: false,
      isSuperAdminOnly: false,
    } as any);
  });

  describe('useQuestions hook', () => {
    it('should fetch questions for current app and skill', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: mockQuestions, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestions('skill-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('questions');
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('skill_id', 'skill-1');
      expect(result.current.data).toEqual(mockQuestions);
    });
  });

  describe('usePaginatedQuestions', () => {
    it('should fetch paginated questions with filters', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({
          data: mockQuestions,
          error: null,
          count: 2,
        }).then(onFulfilled)
      );

      const params = { page: 1, pageSize: 10, search: 'test', status: 'draft' as const };
      const { result } = renderHook(() => usePaginatedQuestions(params), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabase.queryBuilder.ilike).toHaveBeenCalledWith('content', '%test%');
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('status', 'draft');
      expect(result.current.data?.data).toEqual(mockQuestions);
    });
  });

  describe('useQuestion hook', () => {
    it('should fetch a single question by id', async () => {
      const mockQuestion = mockQuestions[0];
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: mockQuestion, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestion(mockQuestion.id), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('question_id', mockQuestion.id);
      expect(result.current.data).toEqual(mockQuestion);
    });

    it('should handle missing question gracefully (returns null)', async () => {
      // Simulate "no rows found"
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestion('550e8400-e29b-41d4-a716-000000000000'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe('useCreateQuestion', () => {
    it('should create a new question', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateQuestion(), { wrapper });

      const newQuestion = {
        content: 'New Question',
        skill_id: 'skill-1',
        status: 'draft' as const,
        app_id: 'app-1',
        solution: 'Solution',
        type: 'multiple_choice' as any,
      };
      await result.current.mutateAsync(newQuestion);

      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(newQuestion);
    });
  });

  describe('useUpdateQuestion', () => {
    it('should update a question', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateQuestion(), { wrapper });

      const updates = { content: 'Updated' };
      await result.current.mutateAsync({ question_id: MOCK_QUESTION_ID, ...updates });

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('question_id', MOCK_QUESTION_ID);
    });
  });

  describe('useDeleteQuestion', () => {
    it('should soft-delete a question', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteQuestion(), { wrapper });

      await result.current.mutateAsync(MOCK_QUESTION_ID);

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
      });
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('question_id', MOCK_QUESTION_ID);
    });
  });

  describe('useBulkUpdateQuestionStatus', () => {
    it('should update status for multiple questions', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useBulkUpdateQuestionsStatus(), { wrapper });

      await result.current.mutateAsync({
        question_ids: [MOCK_QUESTION_ID, '550e8400-e29b-41d4-a716-446655440001'],
        status: 'live',
      });

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ status: 'live' });
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('question_id', [
        MOCK_QUESTION_ID,
        '550e8400-e29b-41d4-a716-446655440001',
      ]);
    });
  });

  describe('useBulkDeleteQuestions', () => {
    it('should soft-delete multiple questions', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useBulkDeleteQuestions(), { wrapper });

      await result.current.mutateAsync([MOCK_QUESTION_ID, '550e8400-e29b-41d4-a716-446655440001']);

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
      });
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('question_id', [
        MOCK_QUESTION_ID,
        '550e8400-e29b-41d4-a716-446655440001',
      ]);
    });
  });
});

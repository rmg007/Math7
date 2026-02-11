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
        full_domain: 'test.example.com',
        grade_level: 'K-12',
        grade_number: 1,
        is_active: true,
        launch_date: null,
        subdomain: 'test',
        subject_id: 'subject-1',
        updated_at: new Date().toISOString(),
      },
      apps: [],
      isLoading: false,
      setCurrentApp: vi.fn(),
      refreshApps: vi.fn(),
      isSidebarCollapsed: false,
      toggleSidebar: vi.fn(),
    });
  });

  describe('useQuestions hook', () => {
    it('should fetch questions for current app and skill', async () => {
      const mockChain = supabase.from('questions') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
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
      const mockChain = supabase.from('questions') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
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
    it('should fetch a single question by id', async () => {
      const mockChain = supabase.from('questions') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useQuestion('1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockChain.eq).toHaveBeenCalledWith('question_id', '1');
      expect(result.current.data).toEqual(mockQuestions[0]);
    });
  });

  describe('useCreateQuestion', () => {
    it('should insert a new question', async () => {
      const mockChain = supabase.from('questions') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockQuestions[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateQuestion(), { wrapper });

      const newQuestion = {
        content: 'New Question',
        skill_id: 'skill-1',
        type: 'multiple_choice' as const,
        points: 10,
        status: 'draft' as const,
      };

      await result.current.mutateAsync(newQuestion as any);

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
      const mockChain = supabase.from('questions') as any;
      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
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
});

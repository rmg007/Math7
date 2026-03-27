import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useStudioPrompts,
  useStudioPrompt,
  useStudioPromptQuestions,
  useCreateStudioPrompt,
  useUpdateStudioPrompt,
} from '../use-studio-prompts';

// Mock dependencies
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => chain),
      single: vi.fn(() => chain),
      maybeSingle: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data: null, error: null, count: 0 }).then(onFulfilled)
      ),
    };
    return chain;
  };

  return {
    supabase: {
      from: vi.fn(() => createMockChain()),
    },
  };
});

describe('useStudioPrompts hooks', () => {
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
    } as any);
  });

  describe('useStudioPrompts', () => {
    it('should fetch paginated prompts for current app', async () => {
      const mockData = [
        { id: '1', domain_name: 'Math', topics: ['Algebra'], created_at: new Date().toISOString() },
      ];

      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) =>
            Promise.resolve({ data: mockData, error: null, count: 1 }).then(onFulfilled)
          ),
        } as any;
      });

      const { result } = renderHook(() => useStudioPrompts(1, 10), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('studio_prompts');
      expect(result.current.data?.data).toEqual(mockData);
      expect(result.current.data?.totalCount).toBe(1);
    });
  });

  describe('useStudioPrompt', () => {
    it('should fetch a single prompt by ID', async () => {
      const mockId = '123e4567-e89b-12d3-a456-426614174000';
      const mockData = { id: mockId, domain_name: 'Math' };

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

      const { result } = renderHook(() => useStudioPrompt(mockId), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('studio_prompts');
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useStudioPromptQuestions', () => {
    it('should fetch questions for a specific prompt', async () => {
      const mockId = '123e4567-e89b-12d3-a456-426614174000';
      const mockQuestions = [{ question_id: 'q1', content: 'Q1', type: 'multiple_choice' }];

      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) =>
            Promise.resolve({ data: mockQuestions, error: null }).then(onFulfilled)
          ),
        } as any;
      });

      const { result } = renderHook(() => useStudioPromptQuestions(mockId), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('questions');
      expect(result.current.data).toEqual(mockQuestions);
    });
  });

  describe('useCreateStudioPrompt', () => {
    it('should insert a new prompt', async () => {
      const newPrompt = { app_id: mockAppId, domain_name: 'Math', topics: ['Algebra'] };
      const mockResponse = { id: 'new-id', ...newPrompt };

      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) =>
            Promise.resolve({ data: mockResponse, error: null }).then(onFulfilled)
          ),
        } as any;
      });

      const { result } = renderHook(() => useCreateStudioPrompt(), { wrapper });

      const created = await result.current.mutateAsync(newPrompt as any);

      expect(supabase.from).toHaveBeenCalledWith('studio_prompts');
      expect(created).toEqual(mockResponse);
    });
  });

  describe('useUpdateStudioPrompt', () => {
    it('should update an existing prompt', async () => {
      const mockId = '123e4567-e89b-12d3-a456-426614174000';
      const updates = { status: 'saved' };
      const mockResponse = { id: mockId, ...updates };

      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: vi.fn((onFulfilled) =>
            Promise.resolve({ data: mockResponse, error: null }).then(onFulfilled)
          ),
        } as any;
      });

      const { result } = renderHook(() => useUpdateStudioPrompt(), { wrapper });

      const updated = await result.current.mutateAsync({ id: mockId, ...updates } as any);

      expect(supabase.from).toHaveBeenCalledWith('studio_prompts');
      expect(updated).toEqual(mockResponse);
    });
  });
});

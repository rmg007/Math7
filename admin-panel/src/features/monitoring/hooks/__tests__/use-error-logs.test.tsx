/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteErrorLog, useErrorLogs } from '../use-error-logs';

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      or: vi.fn(() => chain),
      range: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      update: vi.fn(() => chain),
      in: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data: [], error: null, count: 0 }).then(onFulfilled)
      ),
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

describe('useErrorLogs', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should fetch error logs with pagination and search', async () => {
    const mockChain = supabase.from('error_logs') as any;
    const mockData = [{ id: '123e4567-e89b-12d3-a456-426614174000', error_type: 'TestError' }];

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockData, error: null, count: 1 }).then(onFulfilled)
    );

    const { result } = renderHook(() => useErrorLogs({ page: 1, pageSize: 10, search: 'test' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('error_logs');
    expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockChain.range).toHaveBeenCalledWith(0, 9);
    expect(mockChain.or).toHaveBeenCalledWith(expect.stringContaining('ilike.%test%'));
    expect(result.current.data).toEqual({ data: mockData, count: 1 });
  });

  it('should call delete on error_logs table', async () => {
    const mockChain = supabase.from('error_logs') as any;
    const errorId = '123e4567-e89b-12d3-a456-426614174000';

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useDeleteErrorLog(), { wrapper });

    await result.current.mutateAsync(errorId);

    expect(supabase.from).toHaveBeenCalledWith('error_logs');
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', errorId);
  });
});

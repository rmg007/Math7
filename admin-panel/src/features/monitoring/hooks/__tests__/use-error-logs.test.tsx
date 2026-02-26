import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteErrorLog, useErrorLogs } from '../use-error-logs';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useErrorLogs hooks', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as unknown as ReturnType<typeof supabase.from>);
  });

  describe('useErrorLogs', () => {
    it('should fetch error logs with pagination and search', async () => {
      const mockData = [{ id: '123e4567-e89b-12d3-a456-426614174000', error_type: 'TestError' }];

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockData, error: null, count: 1 }).then(onFulfilled)
      );

      const { result } = renderHook(() => useErrorLogs({ page: 1, pageSize: 10, search: 'test' }), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.queryBuilder.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.queryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(mockSupabase.queryBuilder.or).toHaveBeenCalledWith(expect.stringContaining('ilike.%test%'));
      expect(result.current.data).toEqual({ data: mockData, count: 1 });
    });
  });

  describe('useDeleteErrorLog', () => {
    it('should call delete on error_logs table', async () => {
      const errorId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteErrorLog(), { wrapper });

      await result.current.mutateAsync(errorId);

      expect(supabase.from).toHaveBeenCalledWith('error_logs');
      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('id', errorId);
    });
  });
});

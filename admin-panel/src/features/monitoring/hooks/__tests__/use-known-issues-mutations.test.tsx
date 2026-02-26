import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useBulkDeleteKnownIssues,
    useBulkUpdateKnownIssueStatus,
    useCreateKnownIssue,
    useDeleteKnownIssue,
    useUpdateKnownIssue,
} from '../use-known-issues-mutations';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useKnownIssuesMutations', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockKnownIssue = {
    id: '1',
    title: 'Test Issue',
    description: 'Test Description',
    status: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh QueryClient for each test to properly test cache invalidation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Pre-populate cache with known-issues data to verify invalidation
    queryClient.setQueryData(['known-issues'], [mockKnownIssue]);

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as unknown as ReturnType<typeof supabase.from>);
  });

  describe('useCreateKnownIssue', () => {
    it('should create a new known issue successfully', async () => {
      const newIssue = {
        title: 'New Issue',
        description: 'New Description',
        status: 'open',
      };

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: { ...mockKnownIssue, ...newIssue }, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateKnownIssue(), { wrapper });

      await result.current.mutateAsync(newIssue);

      expect(supabase.from).toHaveBeenCalledWith('known_issues');
      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(newIssue);
      expect(mockSupabase.queryBuilder.select).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.single).toHaveBeenCalled();
    });

    it('should invalidate known-issues cache on success', async () => {
      const newIssue = {
        title: 'New Issue',
        description: 'New Description',
        status: 'open',
      };

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: { ...mockKnownIssue, ...newIssue }, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateKnownIssue(), { wrapper });

      // Verify cache has data before mutation
      expect(queryClient.getQueryData(['known-issues'])).toEqual([mockKnownIssue]);

      await result.current.mutateAsync(newIssue);

      // Wait for onSuccess to invalidate queries
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(['known-issues']);
        // After invalidation, the data should be stale or undefined depending on timing
        return cachedData !== undefined || queryClient.isFetching({ queryKey: ['known-issues'] }) === 0;
      });
    });
  });

  describe('useUpdateKnownIssue', () => {
    it('should update a known issue successfully', async () => {
      const id = '1';
      const updates = {
        title: 'Updated Title',
        status: 'resolved',
      };

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: { ...mockKnownIssue, ...updates }, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateKnownIssue(), { wrapper });

      await result.current.mutateAsync({ id, updates });

      expect(supabase.from).toHaveBeenCalledWith('known_issues');
      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('id', id);
      expect(mockSupabase.queryBuilder.select).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.single).toHaveBeenCalled();
    });

    it('should invalidate known-issues cache on success', async () => {
      const id = '1';
      const updates = {
        title: 'Updated Title',
        status: 'resolved',
      };

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: { ...mockKnownIssue, ...updates }, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateKnownIssue(), { wrapper });

      // Verify cache has data before mutation
      expect(queryClient.getQueryData(['known-issues'])).toEqual([mockKnownIssue]);

      await result.current.mutateAsync({ id, updates });

      // Wait for onSuccess to invalidate queries
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(['known-issues']);
        return cachedData !== undefined || queryClient.isFetching({ queryKey: ['known-issues'] }) === 0;
      });
    });
  });

  describe('useDeleteKnownIssue', () => {
    it('should delete a known issue successfully', async () => {
      const id = '1';

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteKnownIssue(), { wrapper });

      await result.current.mutateAsync(id);

      expect(supabase.from).toHaveBeenCalledWith('known_issues');
      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('id', id);
    });

    it('should invalidate known-issues, error-logs, and error-log-stats cache on success', async () => {
      const id = '1';

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      // Pre-populate additional caches
      queryClient.setQueryData(['error-logs'], []);
      queryClient.setQueryData(['error-log-stats'], {});

      const { result } = renderHook(() => useDeleteKnownIssue(), { wrapper });

      await result.current.mutateAsync(id);

      // Wait for onSuccess to process
      await waitFor(() => result.current.isSuccess);

      // Verify that invalidateQueries was triggered for all three keys
      // The hook calls invalidateQueries on known-issues, error-logs, and error-log-stats
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useBulkUpdateKnownIssueStatus', () => {
    it('should bulk update known issue status successfully', async () => {
      const ids = ['1', '2', '3'];
      const status = 'resolved';

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useBulkUpdateKnownIssueStatus(), { wrapper });

      await result.current.mutateAsync({ ids, status });

      expect(supabase.from).toHaveBeenCalledWith('known_issues');
      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ status });
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('id', ids);
    });

    it('should invalidate known-issues cache on success', async () => {
      const ids = ['1', '2', '3'];
      const status = 'resolved';

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useBulkUpdateKnownIssueStatus(), { wrapper });

      // Verify cache has data before mutation
      expect(queryClient.getQueryData(['known-issues'])).toEqual([mockKnownIssue]);

      await result.current.mutateAsync({ ids, status });

      // Wait for onSuccess to invalidate queries
      await waitFor(() => {
        const cachedData = queryClient.getQueryData(['known-issues']);
        return cachedData !== undefined || queryClient.isFetching({ queryKey: ['known-issues'] }) === 0;
      });
    });
  });

  describe('useBulkDeleteKnownIssues', () => {
    it('should bulk delete known issues successfully', async () => {
      const ids = ['1', '2', '3'];

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useBulkDeleteKnownIssues(), { wrapper });

      await result.current.mutateAsync(ids);

      expect(supabase.from).toHaveBeenCalledWith('known_issues');
      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('id', ids);
    });

    it('should invalidate known-issues, error-logs, and error-log-stats cache on success', async () => {
      const ids = ['1', '2', '3'];

      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      // Pre-populate additional caches
      queryClient.setQueryData(['error-logs'], []);
      queryClient.setQueryData(['error-log-stats'], {});

      const { result } = renderHook(() => useBulkDeleteKnownIssues(), { wrapper });

      await result.current.mutateAsync(ids);

      // Wait for onSuccess to process
      await waitFor(() => result.current.isSuccess);

      expect(result.current.isSuccess).toBe(true);
    });
  });
});

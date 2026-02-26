import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKnownIssues } from '../use-known-issues';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useKnownIssues', () => {
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

  const mockKnownIssues = [
    {
      id: '1',
      title: 'Issue 1',
      description: 'Description 1',
      status: 'open',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: '2',
      title: 'Issue 2',
      description: 'Description 2',
      status: 'resolved',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as unknown as ReturnType<typeof supabase.from>);
  });

  it('should fetch known issues successfully', async () => {
    mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
      Promise.resolve({ data: mockKnownIssues, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useKnownIssues(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('known_issues');
    expect(mockSupabase.queryBuilder.select).toHaveBeenCalledWith('*');
    expect(result.current.data).toEqual(mockKnownIssues);
  });

  it('should order known issues by created_at descending', async () => {
    mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
      Promise.resolve({ data: mockKnownIssues, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useKnownIssues(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('known_issues');
    expect(mockSupabase.queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should handle error when fetching known issues fails', async () => {
    const errorMessage = 'Database error';
    mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
      Promise.resolve({ data: null, error: { message: errorMessage } }).then(onFulfilled)
    );

    const { result } = renderHook(() => useKnownIssues(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('known_issues');
    expect(result.current.error).toBeDefined();
  });

  it('should return empty array when no data is returned', async () => {
    mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useKnownIssues(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should show loading state initially', () => {
    mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled) =>
      Promise.resolve({ data: mockKnownIssues, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useKnownIssues(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPending).toBe(true);
  });
});

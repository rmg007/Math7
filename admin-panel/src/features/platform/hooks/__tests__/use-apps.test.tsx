/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApps, useCreateApp, useUpdateApp } from '../use-apps';

// Helper to create a thenable mock chain
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),

    then: vi.fn((onFulfilled: (value: any) => any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    ),
  };
  return chain;
};

// Mock dependencies
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('useApps', () => {
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

  const mockApps = [
    { app_id: '1', display_name: 'App 1', subdomain: 'app1' },
    { app_id: '2', display_name: 'App 2', subdomain: 'app2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useApps hook', () => {
    it('should fetch apps sorted by display_name', async () => {
      const mockChain = createMockChain();
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useApps(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('apps');
      expect(result.current.data).toEqual(mockApps);
    });
  });

  describe('useCreateApp', () => {
    it('should insert a new app and its landing page', async () => {
      const mockChain = createMockChain();
      // First call for apps, second for landing pages
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      mockChain.then

        .mockImplementationOnce((onFulfilled: any) =>
          Promise.resolve({ data: mockApps[0], error: null }).then(onFulfilled)
        )

        .mockImplementationOnce((onFulfilled: any) =>
          Promise.resolve({ data: null, error: null }).then(onFulfilled)
        );

      const { result } = renderHook(() => useCreateApp(), { wrapper });

      const newApp = {
        display_name: 'New App',
        subdomain: 'new',
        grade_level: 'K-12',
      };

      await result.current.mutateAsync(
        newApp as unknown as Parameters<typeof result.current.mutate>[0]
      );

      expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining(newApp));
      expect(supabase.from).toHaveBeenCalledWith('app_landing_pages');
    });
  });

  describe('useUpdateApp', () => {
    it('should update an existing app', async () => {
      const mockChain = createMockChain();
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      mockChain.then.mockImplementationOnce((onFulfilled: any) =>
        Promise.resolve({ data: mockApps[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateApp(), { wrapper });

      await result.current.mutateAsync({ id: '1', display_name: 'Updated Name' });

      expect(mockChain.update).toHaveBeenCalledWith({ display_name: 'Updated Name' });
      expect(mockChain.eq).toHaveBeenCalledWith('app_id', '1');
    });
  });
});

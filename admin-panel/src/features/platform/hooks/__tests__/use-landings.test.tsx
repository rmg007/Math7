import { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useCreateLandingPage,
    useLandingPage,
    useLandingPages,
    useUpdateLandingPage,
} from '../use-landings';

import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// ── Shared fixtures ───────────────────────────────────────────────────────────
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001';
const APP_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockLandings = [{ landing_page_id: VALID_UUID, app_id: APP_ID, meta_title: 'Landing 1' }];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('useLandings hooks', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const { wrapper } = makeWrapper();

  beforeEach(() => {
    vi.clearAllMocks();

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder as unknown as ReturnType<typeof supabase.from>);
  });

  describe('useLandingPages', () => {

    it('fetches all landing pages', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockLandings, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useLandingPages(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('app_landing_pages');
      expect(result.current.data).toEqual(mockLandings);
    });
  });

  describe('useLandingPage', () => {
    it('fetches a single landing page by app_id', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useLandingPage(APP_ID), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('app_id', APP_ID);
      expect(result.current.data).toEqual(mockLandings[0]);
    });

    it('does not fetch if appId is empty', async () => {
      const { result } = renderHook(() => useLandingPage(''), { wrapper });
      expect(result.current.isLoading).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateLandingPage', () => {
    it('updates a landing page', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateLandingPage(), { wrapper });
      await result.current.mutateAsync({
        id: VALID_UUID,
        meta_title: 'Updated Title',
      } as TablesUpdate<'app_landing_pages'> & { id: string });

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ meta_title: 'Updated Title' });
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('landing_page_id', VALID_UUID);
    });
  });

  describe('useCreateLandingPage', () => {
    it('creates a landing page', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockLandings[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateLandingPage(), { wrapper });
      const newLanding: TablesInsert<'app_landing_pages'> = {
        app_id: APP_ID,
        meta_title: 'New Landing',
      };
      await result.current.mutateAsync(newLanding);

      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(newLanding);
    });
  });
});

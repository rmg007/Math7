import { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBulkCreateSubjects,
  useBulkDeleteSubjects,
  useBulkUpdateSubjectsStatus,
  useCheckSubjectSlug,
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateSubject,
} from '../use-subjects';

import { createMockSupabase } from '@/__tests__/mocks/supabase-factory';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// ── Shared fixtures ───────────────────────────────────────────────────────────
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440002';

const mockSubjects = [
  { subject_id: VALID_UUID, title: 'Math', slug: 'math', status: 'live' },
  { subject_id: VALID_UUID_2, title: 'Science', slug: 'science', status: 'draft' },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('useSubjects hooks', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const { wrapper } = makeWrapper();

  beforeEach(() => {
    vi.clearAllMocks();

    // Fresh mock for every test
    mockSupabase = createMockSupabase();
    vi.mocked(supabase.from).mockReturnValue(mockSupabase.queryBuilder);
  });

  // ── useSubjects ───────────────────────────────────────────────────────────────
  describe('useSubjects', () => {
    it('fetches subjects ordered by display_order', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockSubjects, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useSubjects(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(supabase.from).toHaveBeenCalledWith('subjects');
      expect(mockSupabase.queryBuilder.order).toHaveBeenCalledWith('display_order');
      expect(result.current.data).toEqual(mockSubjects);
    });
  });

  // ── useCreateSubject ──────────────────────────────────────────────────────────
  describe('useCreateSubject', () => {
    it('inserts a new subject', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCreateSubject(), { wrapper });

      const newSubject: TablesInsert<'subjects'> = { title: 'History', slug: 'history' };
      await result.current.mutateAsync(newSubject);

      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(newSubject);
    });
  });

  // ── useUpdateSubject ──────────────────────────────────────────────────────────
  describe('useUpdateSubject', () => {
    it('updates an existing subject', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateSubject(), { wrapper });

      await result.current.mutateAsync({ id: VALID_UUID, title: 'Math Updated' });

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ title: 'Math Updated' });
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('subject_id', VALID_UUID);
    });

    it('throws when subject not found', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useUpdateSubject(), { wrapper });

      const updatePayload: TablesUpdate<'subjects'> & { id: string } = { id: VALID_UUID, title: 'X' };
      await expect(result.current.mutateAsync(updatePayload)).rejects.toThrow(
        `Subject with ID ${VALID_UUID} not found for update.`
      );
    });
  });

  // ── useDeleteSubject ──────────────────────────────────────────────────────────
  describe('useDeleteSubject', () => {
    it('deletes a subject', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useDeleteSubject(), { wrapper });
      await result.current.mutateAsync(VALID_UUID);

      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('subject_id', VALID_UUID);
    });
  });

  // ── useBulkUpdateSubjectsStatus ───────────────────────────────────────────────
  describe('useBulkUpdateSubjectsStatus', () => {
    it('updates status for multiple subjects', async () => {
      const { result } = renderHook(() => useBulkUpdateSubjectsStatus(), { wrapper });
      await result.current.mutateAsync({ ids: [VALID_UUID], status: 'live' });

      expect(mockSupabase.queryBuilder.update).toHaveBeenCalledWith({ status: 'live' });
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('subject_id', [VALID_UUID]);
    });
  });

  // ── useBulkDeleteSubjects ─────────────────────────────────────────────────────
  describe('useBulkDeleteSubjects', () => {
    it('deletes multiple subjects', async () => {
      const { result } = renderHook(() => useBulkDeleteSubjects(), { wrapper });
      await result.current.mutateAsync([VALID_UUID, VALID_UUID_2]);

      expect(mockSupabase.queryBuilder.delete).toHaveBeenCalled();
      expect(mockSupabase.queryBuilder.in).toHaveBeenCalledWith('subject_id', [VALID_UUID, VALID_UUID_2]);
    });
  });

  // ── useBulkCreateSubjects ────────────────────────────────────────────────────
  describe('useBulkCreateSubjects', () => {
    it('inserts multiple subjects', async () => {
      const { result } = renderHook(() => useBulkCreateSubjects(), { wrapper });
      const payload: TablesInsert<'subjects'>[] = [
        { title: 'S1', slug: 's1' },
        { title: 'S2', slug: 's2' },
      ];
      await result.current.mutateAsync(payload);

      expect(mockSupabase.queryBuilder.insert).toHaveBeenCalledWith(payload);
    });
  });

  // ── useCheckSubjectSlug ───────────────────────────────────────────────────────
  describe('useCheckSubjectSlug', () => {
    it('returns true for available slug', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ count: 0, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
      const isAvailable = await result.current.checkSlug('new-slug');

      expect(isAvailable).toBe(true);
      expect(mockSupabase.queryBuilder.eq).toHaveBeenCalledWith('slug', 'new-slug');
    });

    it('returns false for taken slug', async () => {
      mockSupabase.queryBuilder.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ count: 1, error: null }).then(onFulfilled)
      );

      const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
      const isAvailable = await result.current.checkSlug('taken-slug');

      expect(isAvailable).toBe(false);
    });

    it('excludes current subject from check', async () => {
      const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
      await result.current.checkSlug('existing-slug', VALID_UUID);

      expect(mockSupabase.queryBuilder.neq).toHaveBeenCalledWith('subject_id', VALID_UUID);
    });

    it('returns true for empty slug without calling API', async () => {
      const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
      const isAvailable = await result.current.checkSlug('');

      expect(isAvailable).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});

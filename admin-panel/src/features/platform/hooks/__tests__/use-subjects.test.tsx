/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Helper to create a thenable mock chain
const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    neq: vi.fn(() => chain),

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── useSubjects ───────────────────────────────────────────────────────────────
describe('useSubjects', () => {
  const { wrapper } = makeWrapper();

  it('fetches subjects ordered by display_order', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockSubjects, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useSubjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('subjects');
    expect(mockChain.order).toHaveBeenCalledWith('display_order');
    expect(result.current.data).toEqual(mockSubjects);
  });
});

// ── useCreateSubject ──────────────────────────────────────────────────────────
describe('useCreateSubject', () => {
  const { wrapper } = makeWrapper();

  it('inserts a new subject', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCreateSubject(), { wrapper });

    const newSubject = { title: 'History', slug: 'history' };
    await result.current.mutateAsync(newSubject as any);

    expect(mockChain.insert).toHaveBeenCalledWith(newSubject);
  });
});

// ── useUpdateSubject ──────────────────────────────────────────────────────────
describe('useUpdateSubject', () => {
  const { wrapper } = makeWrapper();

  it('updates an existing subject', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateSubject(), { wrapper });

    await result.current.mutateAsync({ id: VALID_UUID, title: 'Math Updated' });

    expect(mockChain.update).toHaveBeenCalledWith({ title: 'Math Updated' });
    expect(mockChain.eq).toHaveBeenCalledWith('subject_id', VALID_UUID);
  });

  it('throws when subject not found', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateSubject(), { wrapper });

    await expect(
      result.current.mutateAsync({ id: VALID_UUID, title: 'X' })
    ).rejects.toThrow(`Subject with ID ${VALID_UUID} not found for update.`);
  });
});

// ── useDeleteSubject ──────────────────────────────────────────────────────────
describe('useDeleteSubject', () => {
  const { wrapper } = makeWrapper();

  it('deletes a subject', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useDeleteSubject(), { wrapper });
    await result.current.mutateAsync(VALID_UUID);

    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('subject_id', VALID_UUID);
  });
});

// ── useBulkUpdateSubjectsStatus ───────────────────────────────────────────────
describe('useBulkUpdateSubjectsStatus', () => {
  const { wrapper } = makeWrapper();

  it('updates status for multiple subjects', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useBulkUpdateSubjectsStatus(), { wrapper });
    await result.current.mutateAsync({ ids: [VALID_UUID], status: 'live' });

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'live' });
    expect(mockChain.in).toHaveBeenCalledWith('subject_id', [VALID_UUID]);
  });
});

// ── useBulkDeleteSubjects ─────────────────────────────────────────────────────
describe('useBulkDeleteSubjects', () => {
  const { wrapper } = makeWrapper();

  it('deletes multiple subjects', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useBulkDeleteSubjects(), { wrapper });
    await result.current.mutateAsync([VALID_UUID, VALID_UUID_2]);

    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.in).toHaveBeenCalledWith('subject_id', [VALID_UUID, VALID_UUID_2]);
  });
});

// ── useBulkCreateSubjects ────────────────────────────────────────────────────
describe('useBulkCreateSubjects', () => {
  const { wrapper } = makeWrapper();

  it('inserts multiple subjects', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useBulkCreateSubjects(), { wrapper });
    const payload = [{ title: 'S1', slug: 's1' }, { title: 'S2', slug: 's2' }];
    await result.current.mutateAsync(payload as any);

    expect(mockChain.insert).toHaveBeenCalledWith(payload);
  });
});

// ── useCheckSubjectSlug ───────────────────────────────────────────────────────
describe('useCheckSubjectSlug', () => {
  it('returns true for available slug', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ count: 0, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCheckSubjectSlug());
    const isAvailable = await result.current.checkSlug('new-slug');

    expect(isAvailable).toBe(true);
    expect(mockChain.eq).toHaveBeenCalledWith('slug', 'new-slug');
  });

  it('returns false for taken slug', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    mockChain.then.mockImplementationOnce((onFulfilled: any) =>
      Promise.resolve({ count: 1, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCheckSubjectSlug());
    const isAvailable = await result.current.checkSlug('taken-slug');

    expect(isAvailable).toBe(false);
  });

  it('excludes current subject from check', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);

    const { result } = renderHook(() => useCheckSubjectSlug());
    await result.current.checkSlug('existing-slug', VALID_UUID);

    expect(mockChain.neq).toHaveBeenCalledWith('subject_id', VALID_UUID);
  });

  it('returns true for empty slug without calling API', async () => {
    const { result } = renderHook(() => useCheckSubjectSlug());
    const isAvailable = await result.current.checkSlug('');

    expect(isAvailable).toBe(true);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

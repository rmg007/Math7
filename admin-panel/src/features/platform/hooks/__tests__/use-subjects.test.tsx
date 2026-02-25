import { TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
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

interface MockSupabaseChain {
  select: Mock;
  eq: Mock;
  in: Mock;
  order: Mock;
  single: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  neq: Mock;
  then: Mock;
}

// Helper to create a thenable mock chain
const createMockChain = (): MockSupabaseChain => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    neq: vi.fn(),
    then: vi.fn((onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    ),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.neq.mockReturnValue(chain);

  return chain as unknown as MockSupabaseChain;
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
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCreateSubject(), { wrapper });

    const newSubject: TablesInsert<'subjects'> = { title: 'History', slug: 'history' };
    await result.current.mutateAsync(newSubject);

    expect(mockChain.insert).toHaveBeenCalledWith(newSubject);
  });
});

// ── useUpdateSubject ──────────────────────────────────────────────────────────
describe('useUpdateSubject', () => {
  const { wrapper } = makeWrapper();

  it('updates an existing subject', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: mockSubjects[0], error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useUpdateSubject(), { wrapper });

    await result.current.mutateAsync({ id: VALID_UUID, title: 'Math Updated' });

    expect(mockChain.update).toHaveBeenCalledWith({ title: 'Math Updated' });
    expect(mockChain.eq).toHaveBeenCalledWith('subject_id', VALID_UUID);
  });

  it('throws when subject not found', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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
  const { wrapper } = makeWrapper();

  it('deletes a subject', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
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
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

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
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

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
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useBulkCreateSubjects(), { wrapper });
    const payload: TablesInsert<'subjects'>[] = [
      { title: 'S1', slug: 's1' },
      { title: 'S2', slug: 's2' },
    ];
    await result.current.mutateAsync(payload);

    expect(mockChain.insert).toHaveBeenCalledWith(payload);
  });
});

// ── useCheckSubjectSlug ───────────────────────────────────────────────────────
describe('useCheckSubjectSlug', () => {
  const { wrapper } = makeWrapper();

  it('returns true for available slug', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ count: 0, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
    const isAvailable = await result.current.checkSlug('new-slug');

    expect(isAvailable).toBe(true);
    expect(mockChain.eq).toHaveBeenCalledWith('slug', 'new-slug');
  });

  it('returns false for taken slug', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    mockChain.then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ count: 1, error: null }).then(onFulfilled)
    );

    const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
    const isAvailable = await result.current.checkSlug('taken-slug');

    expect(isAvailable).toBe(false);
  });

  it('excludes current subject from check', async () => {
    const mockChain = createMockChain();
    vi.mocked(supabase.from).mockReturnValue(
      mockChain as unknown as ReturnType<typeof supabase.from>
    );

    const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
    await result.current.checkSlug('existing-slug', VALID_UUID);

    expect(mockChain.neq).toHaveBeenCalledWith('subject_id', VALID_UUID);
  });

  it('returns true for empty slug without calling API', async () => {
    const { result } = renderHook(() => useCheckSubjectSlug(), { wrapper });
    const isAvailable = await result.current.checkSlug('');

    expect(isAvailable).toBe(true);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

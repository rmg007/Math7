/* Tests: All 5 question types × useCreateQuestion, useUpdateQuestion */
/**
 * use-questions-types.test.tsx
 *
 * Tests: All 5 question types × useCreateQuestion
 * Also covers: useUpdateQuestion, error propagation, app_id enforcement
 *
 * Why not in use-questions.test.tsx?
 * The existing file covers the fetch/delete/duplicate paths.
 * This file focuses exclusively on the 5 question types and update mutation,
 * which are completely untested (gap from TEST_PLAN AP-CURR-005..009).
 *
 * 5 question types (from generate-questions.ts schema):
 *   mcq            – single correct answer from options list
 *   mcq_multi      – multiple correct answers from options list
 *   text_input     – free-text answer, checked against solution
 *   boolean        – true/false
 *   reorder_steps  – arrange items in correct sequence
 */
import { useApp } from '@/hooks/use-app';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateQuestion, useUpdateQuestion } from '../use-questions';

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/use-app');
vi.mock('@/lib/supabase', () => {
  const createMockChain = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = ['select', 'eq', 'is', 'order', 'single', 'maybeSingle', 'insert', 'update'];
    methods.forEach((m) => {
      chain[m] = vi.fn(() => chain);
    });
    chain.then = vi.fn((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    );
    return chain;
  };
  const mockFrom = createMockChain();
  return {
    supabase: { from: vi.fn(() => mockFrom) },
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_SKILL_ID = '550e8400-e29b-41d4-a716-446655440001';
const MOCK_QUESTION_ID = '550e8400-e29b-41d4-a716-446655440002';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function mockApp(overrides: Partial<ReturnType<typeof useApp>> = {}) {
  vi.mocked(useApp).mockReturnValue({
    currentApp: {
      app_id: MOCK_APP_ID,
      created_at: new Date().toISOString(),
      display_name: 'Test App',
      grade_level: 'K-12',
      grade_number: 1,
      is_active: true,
      subdomain: 'test',
      subject_id: 'subject-1',
      updated_at: new Date().toISOString(),
      ai_token_limit: 0,
      branding: {},
      description: '',
    },
    apps: [],
    isLoading: false,
    setCurrentApp: vi.fn(),
    refreshApps: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    userRole: null,
    isSuperAdmin: false,
    ...overrides,
  } );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMockChain(): Record<string, ReturnType<typeof vi.fn>> {
  return supabase.from('questions') as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

function resolveOnce(data: unknown) {
  getMockChain().then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(onFulfilled)
  );
}

// ── Question type tests ───────────────────────────────────────────────────────
describe('useCreateQuestion — all 5 question types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  // ── AP-CURR-005: multiple_choice ────────────────────────────────────────────────────────
  it('AP-CURR-005: creates multiple_choice question with options and correct_answer', async () => {
    const { wrapper } = makeWrapper();
    const mcqQuestion = {
      app_id: MOCK_APP_ID,
      skill_id: MOCK_SKILL_ID,
      type: 'multiple_choice' as const,
      content: 'What is H₂O?',
      status: 'draft' as const,
      solution: 'Water',
      metadata: {
        options: ['Water', 'Oxygen', 'Hydrogen', 'Carbon'],
        correct_answer: 'Water',
        explanation: 'H₂O is the chemical formula for water.',
      },
    };

    resolveOnce({ ...mcqQuestion, question_id: MOCK_QUESTION_ID });

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await result.current.mutateAsync(mcqQuestion);

    const [insertPayload] = getMockChain().insert.mock.calls[0];
    expect(insertPayload).toMatchObject({
      type: 'multiple_choice',
      app_id: MOCK_APP_ID,
      metadata: expect.objectContaining({
        options: expect.arrayContaining(['Water', 'Oxygen', 'Hydrogen', 'Carbon']),
        correct_answer: 'Water',
      }),
    });
  });

  // ── AP-CURR-006: mcq_multi ─────────────────────────────────────────────────
  it('AP-CURR-006: creates mcq_multi question with multiple correct answers', async () => {
    const { wrapper } = makeWrapper();
    const mcqMultiQuestion = {
      app_id: MOCK_APP_ID,
      skill_id: MOCK_SKILL_ID,
      type: 'mcq_multi' as const,
      content: 'Which are primary colours?',
      status: 'draft' as const,
      solution: 'Red,Blue,Yellow',
      metadata: {
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        correct_answer: ['Red', 'Blue', 'Yellow'],
        explanation: 'Red, Blue, and Yellow are the three primary colours.',
      },
    };

    resolveOnce({ ...mcqMultiQuestion, question_id: MOCK_QUESTION_ID });

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await result.current.mutateAsync(mcqMultiQuestion);

    const [insertPayload] = getMockChain().insert.mock.calls[0];
    expect(insertPayload).toMatchObject({
      type: 'mcq_multi',
      app_id: MOCK_APP_ID,
      metadata: expect.objectContaining({
        correct_answer: expect.arrayContaining(['Red', 'Blue', 'Yellow']),
      }),
    });
    // correct_answer MUST be an array for mcq_multi
    expect(Array.isArray(insertPayload.metadata.correct_answer)).toBe(true);
  });

  // ── AP-CURR-007: text_input ────────────────────────────────────────────────
  it('AP-CURR-007: creates text_input question with key-phrase solution', async () => {
    const { wrapper } = makeWrapper();
    const textInputQuestion = {
      app_id: MOCK_APP_ID,
      skill_id: MOCK_SKILL_ID,
      type: 'text_input' as const,
      content: 'What is the speed of light in a vacuum?',
      status: 'draft' as const,
      solution: '299,792,458 m/s',
      metadata: {
        correct_answer: '299,792,458',
        explanation: 'The speed of light is approximately 299,792,458 metres per second.',
      },
    };

    resolveOnce({ ...textInputQuestion, question_id: MOCK_QUESTION_ID });

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await result.current.mutateAsync(textInputQuestion);

    const [insertPayload] = getMockChain().insert.mock.calls[0];
    expect(insertPayload).toMatchObject({
      type: 'text_input',
      app_id: MOCK_APP_ID,
      solution: '299,792,458 m/s',
    });
    // text_input must not have an options array
    expect(insertPayload.metadata?.options).toBeUndefined();
  });

  // ── AP-CURR-008: boolean ───────────────────────────────────────────────────
  it('AP-CURR-008: creates boolean question with true/false answer', async () => {
    const { wrapper } = makeWrapper();
    const booleanQuestion = {
      app_id: MOCK_APP_ID,
      skill_id: MOCK_SKILL_ID,
      type: 'boolean' as const,
      content: 'The Earth is flat.',
      status: 'draft' as const,
      solution: 'false',
      metadata: {
        correct_answer: 'false',
        explanation: 'The Earth is an oblate spheroid, not flat.',
      },
    };

    resolveOnce({ ...booleanQuestion, question_id: MOCK_QUESTION_ID });

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await result.current.mutateAsync(booleanQuestion);

    const [insertPayload] = getMockChain().insert.mock.calls[0];
    expect(insertPayload).toMatchObject({
      type: 'boolean',
      app_id: MOCK_APP_ID,
      metadata: expect.objectContaining({ correct_answer: 'false' }),
    });
    // boolean must not have an options list (true/false is implied)
    expect(insertPayload.metadata?.options).toBeUndefined();
  });

  // ── AP-CURR-009: reorder_steps ─────────────────────────────────────────────
  it('AP-CURR-009: creates reorder_steps question with ordered sequence', async () => {
    const { wrapper } = makeWrapper();
    const reorderQuestion = {
      app_id: MOCK_APP_ID,
      skill_id: MOCK_SKILL_ID,
      type: 'reorder_steps' as const,
      content: 'Order the steps of photosynthesis:',
      status: 'draft' as const,
      solution: 'Light absorption,Water splitting,ATP synthesis,Carbon fixation',
      metadata: {
        options: ['Carbon fixation', 'Light absorption', 'ATP synthesis', 'Water splitting'],
        correct_answer: ['Light absorption', 'Water splitting', 'ATP synthesis', 'Carbon fixation'],
        explanation: 'Photosynthesis begins with light absorption in the thylakoid.',
      },
    };

    resolveOnce({ ...reorderQuestion, question_id: MOCK_QUESTION_ID });

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await result.current.mutateAsync(reorderQuestion);

    const [insertPayload] = getMockChain().insert.mock.calls[0];
    expect(insertPayload).toMatchObject({
      type: 'reorder_steps',
      app_id: MOCK_APP_ID,
      metadata: expect.objectContaining({
        options: expect.arrayContaining(['Carbon fixation', 'Light absorption']),
        correct_answer: expect.arrayContaining(['Light absorption', 'Water splitting']),
      }),
    });
    // reorder_steps correct_answer MUST be an array (the canonical order)
    expect(Array.isArray(insertPayload.metadata.correct_answer)).toBe(true);
  });
});

// ── Error propagation ─────────────────────────────────────────────────────────
describe('useCreateQuestion — error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('throws when no app is selected', async () => {
    mockApp({ currentApp: null });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await expect(
      result.current.mutateAsync({
        app_id: MOCK_APP_ID,
        content: 'Q',
        skill_id: 's',
        type: 'boolean',
        solution: '',
      })
    ).rejects.toThrow('No app selected');
  });

  it('surfaces Supabase error from insert', async () => {
    const { wrapper } = makeWrapper();
    getMockChain().then.mockImplementationOnce((onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message: 'insert failed', code: '23505' } }).then(
        onFulfilled
      )
    );

    const { result } = renderHook(() => useCreateQuestion(), { wrapper });
    await expect(
      result.current.mutateAsync({
        app_id: MOCK_APP_ID,
        content: 'Q',
        skill_id: MOCK_SKILL_ID,
        type: 'multiple_choice',
        solution: '',
      })
    ).rejects.toMatchObject({ message: 'insert failed' });
  });

  it('always stamps app_id regardless of question type', async () => {
    const { wrapper } = makeWrapper();

    // Note: 'multiple_choice' is the canonical type (not 'mcq')
    const types = ['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps'] as const;
    for (const type of types) {
      vi.clearAllMocks();
      resolveOnce({ question_id: MOCK_QUESTION_ID, type, app_id: MOCK_APP_ID });

      const { result } = renderHook(() => useCreateQuestion(), { wrapper });
      await result.current.mutateAsync({
        app_id: MOCK_APP_ID,
        content: `Test question for ${type}`,
        skill_id: MOCK_SKILL_ID,
        type,
        status: 'draft',
        solution: '',
      });

      const [insertPayload] = getMockChain().insert.mock.calls[0];
      expect(insertPayload.app_id).toBe(MOCK_APP_ID);
    }
  });
});

// ── useUpdateQuestion ─────────────────────────────────────────────────────────
describe('useUpdateQuestion — update mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it('updates question content and status', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: { question_id: MOCK_QUESTION_ID }, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateQuestion(), { wrapper });

    await result.current.mutateAsync({
      question_id: MOCK_QUESTION_ID,
      content: 'Updated question text',
      status: 'live',
    } );

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Updated question text', status: 'live' })
    );
    expect(updateChain.eq).toHaveBeenCalledWith('question_id', MOCK_QUESTION_ID);
  });

  it('filters update by app_id to prevent cross-tenant mutation', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: { question_id: MOCK_QUESTION_ID }, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateQuestion(), { wrapper });
    await result.current.mutateAsync({
      question_id: MOCK_QUESTION_ID,
      status: 'live',
    } );

    // Must filter by app_id (prevents cross-tenant mutation)
    const eqCalls = updateChain.eq.mock.calls as [string, string][];
    const appIdFilter = eqCalls.find(([col]) => col === 'app_id');
    expect(appIdFilter).toBeDefined();
    expect(appIdFilter?.[1]).toBe(MOCK_APP_ID);
  });

  it('surfaces error from Supabase on update failure', async () => {
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'update failed', code: 'PGRST301' } }).then(
          onFulfilled
        )
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateQuestion(), { wrapper });
    await expect(
      result.current.mutateAsync({
        question_id: MOCK_QUESTION_ID,
        status: 'live',
      } )
    ).rejects.toMatchObject({ message: 'update failed' });
  });

  it('super admin update does not require app_id filter (RLS handles it)', async () => {
    mockApp({ isSuperAdmin: true } );
    const { wrapper } = makeWrapper();
    const mockChain = getMockChain();
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: unknown) => unknown) =>
        Promise.resolve({ data: { question_id: MOCK_QUESTION_ID }, error: null }).then(onFulfilled)
      ),
    };
    mockChain.update.mockReturnValue(updateChain);

    const { result } = renderHook(() => useUpdateQuestion(), { wrapper });
    // Should not throw — super admin can update across tenants via RLS
    await expect(
      result.current.mutateAsync({
        question_id: MOCK_QUESTION_ID,
        status: 'live',
      } )
    ).resolves.toBeDefined();
  });
});



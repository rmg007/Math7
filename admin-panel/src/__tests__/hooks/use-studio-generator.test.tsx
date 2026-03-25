import { generateQuestions } from '@/features/ai-assistant/api/generateQuestions';
import type { StudioConfig } from '@/hooks/use-studio-generator';
import { useStudioGenerator } from '@/hooks/use-studio-generator';
import { useToast } from '@/hooks/use-toast';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────

vi.mock('@/features/ai-assistant/api/generateQuestions');
vi.mock('@/hooks/use-toast');

// crypto.randomUUID is not available in jsdom by default
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2) },
  configurable: true,
});

// ─────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────

const BASE_CONFIG: StudioConfig = {
  domain: 'Mathematics',
  topics: ['Algebra'],
  count: 3,
  difficultyMix: { easy: 1, medium: 1, hard: 1 },
  questionTypes: ['multiple_choice'],
};

const MOCK_API_QUESTIONS = [
  {
    text: 'What is 2 + 2?',
    question_type: 'multiple_choice' as const,
    difficulty: 'easy' as const,
    metadata: {
      options: ['3', '4', '5', '6'],
      correct_answer: '4',
      explanation: 'Basic addition.',
    },
  },
  {
    text: 'What is x in 2x = 10?',
    question_type: 'multiple_choice' as const,
    difficulty: 'medium' as const,
    metadata: {
      options: ['4', '5', '6', '7'],
      correct_answer: '5',
      explanation: 'Divide both sides.',
    },
  },
];

// ─────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────

describe('useStudioGenerator', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toasts: [], toast: mockToast, dismiss: vi.fn() });
    vi.mocked(generateQuestions).mockResolvedValue({ questions: MOCK_API_QUESTIONS } as any);
  });

  // ── Initial state ──────────────────────────────────────

  describe('initial state', () => {
    it('returns idle status and empty staged questions', () => {
      const { result } = renderHook(() => useStudioGenerator());

      expect(result.current.status).toBe('idle');
      expect(result.current.stagedQuestions).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.keptCount).toBe(0);
      expect(result.current.removedCount).toBe(0);
      expect(result.current.editedCount).toBe(0);
      expect(result.current.hasUnsaved).toBe(false);
    });
  });

  // ── generateBatch — input validation ──────────────────

  describe('generateBatch — validation', () => {
    it('rejects topics shorter than 3 characters', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.generateBatch({ ...BASE_CONFIG, topics: ['Xy'] });
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Topic too short', variant: 'destructive' })
      );
      expect(generateQuestions).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('rejects empty question types array', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.generateBatch({ ...BASE_CONFIG, questionTypes: [] });
      });

      expect(success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'No question types selected', variant: 'destructive' })
      );
      expect(generateQuestions).not.toHaveBeenCalled();
    });
  });

  // ── generateBatch — success ────────────────────────────

  describe('generateBatch — success', () => {
    it('calls API, validates schema, sets status=done, shows toast', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.generateBatch(BASE_CONFIG);
      });

      expect(success).toBe(true);
      expect(generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Algebra'),
          difficulty_distribution: { easy: 1, medium: 1, hard: 1 },
        })
      );
      expect(result.current.status).toBe('done');
      expect(result.current.stagedQuestions).toHaveLength(2);
      expect(result.current.error).toBe(null);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '✦ Generation complete' })
      );
    });

    it('assigns id, kept=true, edited=false to each question', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      const q = result.current.stagedQuestions[0];
      expect(q.id).toBeDefined();
      expect(q.kept).toBe(true);
      expect(q.edited).toBe(false);
      expect(q.text).toBe('What is 2 + 2?');
    });

    it('sets status=generating while request is in-flight', async () => {
      vi.mocked(generateQuestions).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ questions: MOCK_API_QUESTIONS } as any), 100)
          )
      );

      const { result } = renderHook(() => useStudioGenerator());

      act(() => {
        result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.status).toBe('generating');

      await act(async () => {
        await new Promise((r) => setTimeout(r, 150));
      });
      expect(result.current.status).toBe('done');
    });

    it('clears previous staged questions at start of new batch', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      // First batch
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.stagedQuestions).toHaveLength(2);

      // Toggle one item so we know state resets
      act(() => {
        result.current.toggleKeep(0);
      });

      // Second batch resets
      vi.mocked(generateQuestions).mockResolvedValueOnce({
        questions: [MOCK_API_QUESTIONS[0]],
      } as any);
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.stagedQuestions).toHaveLength(1);
      expect(result.current.stagedQuestions[0].kept).toBe(true); // freshly reset
    });

    it('builds domain-specific prompt for each supported domain', async () => {
      const domains: StudioConfig['domain'][] = [
        'Mathematics',
        'English Language',
        'History',
        'Science',
        'Computer Science',
        'General Knowledge',
      ];
      const { result } = renderHook(() => useStudioGenerator());

      for (const domain of domains) {
        vi.mocked(generateQuestions).mockClear();
        await act(async () => {
          await result.current.generateBatch({ ...BASE_CONFIG, domain });
        });
        expect(generateQuestions).toHaveBeenCalledWith(
          expect.objectContaining({ text: expect.stringContaining(domain) })
        );
      }
    });
  });

  // ── generateBatch — error ──────────────────────────────

  describe('generateBatch — error', () => {
    it('sets status=error on API failure and shows destructive toast', async () => {
      vi.mocked(generateQuestions).mockRejectedValue(new Error('Rate limit exceeded'));

      const { result } = renderHook(() => useStudioGenerator());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.generateBatch(BASE_CONFIG);
      });

      expect(success).toBe(false);
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Rate limit exceeded');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Generation failed', variant: 'destructive' })
      );
    });

    it('clears previous error on a new successful batch', async () => {
      vi.mocked(generateQuestions).mockRejectedValueOnce(new Error('Temporary failure'));
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.error).toBe('Temporary failure');

      vi.mocked(generateQuestions).mockResolvedValueOnce({ questions: MOCK_API_QUESTIONS } as any);
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.error).toBe(null);
      expect(result.current.status).toBe('done');
    });
  });

  // ── Card manipulation ──────────────────────────────────

  describe('toggleKeep', () => {
    it('flips the kept flag on the target card', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.stagedQuestions[0].kept).toBe(true);

      act(() => {
        result.current.toggleKeep(0);
      });
      expect(result.current.stagedQuestions[0].kept).toBe(false);

      act(() => {
        result.current.toggleKeep(0);
      });
      expect(result.current.stagedQuestions[0].kept).toBe(true);
    });
  });

  describe('updateCard', () => {
    it('merges patch and marks edited=true', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.updateCard(0, { text: 'Updated question text' });
      });

      expect(result.current.stagedQuestions[0].text).toBe('Updated question text');
      expect(result.current.stagedQuestions[0].edited).toBe(true);
    });

    it('does not mutate other cards', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.updateCard(0, { text: 'Card 0 changed' });
      });

      expect(result.current.stagedQuestions[1].text).toBe('What is x in 2x = 10?');
      expect(result.current.stagedQuestions[1].edited).toBe(false);
    });
  });

  describe('shiftDifficulty', () => {
    it('shifts difficulty up', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.stagedQuestions[0].difficulty).toBe('easy');

      act(() => {
        result.current.shiftDifficulty(0, 'up');
      });
      expect(result.current.stagedQuestions[0].difficulty).toBe('medium');
    });

    it('shifts difficulty down', async () => {
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });
      expect(result.current.stagedQuestions[1].difficulty).toBe('medium');

      act(() => {
        result.current.shiftDifficulty(1, 'down');
      });
      expect(result.current.stagedQuestions[1].difficulty).toBe('easy');
    });

    it('clamps at hard (no overflow above)', async () => {
      // Get a hard question by shifting twice
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.shiftDifficulty(0, 'up');
      }); // easy -> medium
      act(() => {
        result.current.shiftDifficulty(0, 'up');
      }); // medium -> hard
      act(() => {
        result.current.shiftDifficulty(0, 'up');
      }); // hard -> hard (clamped)

      expect(result.current.stagedQuestions[0].difficulty).toBe('hard');
    });

    it('clamps at easy (no underflow below)', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.shiftDifficulty(0, 'down');
      }); // easy -> easy (clamped)

      expect(result.current.stagedQuestions[0].difficulty).toBe('easy');
    });

    it('marks card as edited', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.shiftDifficulty(0, 'up');
      });
      expect(result.current.stagedQuestions[0].edited).toBe(true);
    });
  });

  describe('cycleDifficulty', () => {
    it('cycles easy → medium → hard → easy', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      expect(result.current.stagedQuestions[0].difficulty).toBe('easy');
      act(() => {
        result.current.cycleDifficulty(0);
      });
      expect(result.current.stagedQuestions[0].difficulty).toBe('medium');
      act(() => {
        result.current.cycleDifficulty(0);
      });
      expect(result.current.stagedQuestions[0].difficulty).toBe('hard');
      act(() => {
        result.current.cycleDifficulty(0);
      });
      expect(result.current.stagedQuestions[0].difficulty).toBe('easy');
    });
  });

  // ── Bulk helpers ───────────────────────────────────────

  describe('keepAll / removeAll', () => {
    it('sets all cards to kept=true', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.toggleKeep(0);
      }); // make one removed
      act(() => {
        result.current.keepAll();
      });

      expect(result.current.stagedQuestions.every((q) => q.kept)).toBe(true);
      expect(result.current.removedCount).toBe(0);
    });

    it('sets all cards to kept=false', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.removeAll();
      });

      expect(result.current.stagedQuestions.every((q) => !q.kept)).toBe(true);
      expect(result.current.keptCount).toBe(0);
    });
  });

  // ── resetBatch ─────────────────────────────────────────

  describe('resetBatch', () => {
    it('clears all staged questions and resets status and error', async () => {
      vi.mocked(generateQuestions).mockRejectedValueOnce(new Error('err'));
      const { result } = renderHook(() => useStudioGenerator());

      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      act(() => {
        result.current.resetBatch();
      });

      expect(result.current.stagedQuestions).toEqual([]);
      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBe(null);
      expect(result.current.hasUnsaved).toBe(false);
    });
  });

  // ── Derived counts ─────────────────────────────────────

  describe('derived counts', () => {
    it('computes keptCount, removedCount, editedCount, hasUnsaved correctly', async () => {
      const { result } = renderHook(() => useStudioGenerator());
      await act(async () => {
        await result.current.generateBatch(BASE_CONFIG);
      });

      // Both questions kept, none edited
      expect(result.current.keptCount).toBe(2);
      expect(result.current.removedCount).toBe(0);
      expect(result.current.editedCount).toBe(0);
      expect(result.current.hasUnsaved).toBe(true);

      act(() => {
        result.current.toggleKeep(0);
      }); // remove one
      act(() => {
        result.current.updateCard(1, { text: 'Edited' });
      }); // edit one

      expect(result.current.keptCount).toBe(1);
      expect(result.current.removedCount).toBe(1);
      expect(result.current.editedCount).toBe(1);
    });
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudioGenerator } from '../use-studio-generator';
import * as generateQuestionsModule from '@/features/ai-assistant/api/generateQuestions';

// Mock dependencies
vi.mock('@/features/ai-assistant/api/generateQuestions');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })) },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'prompt-123' },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));
vi.mock('../use-app', () => ({
  useApp: () => ({ currentApp: { app_id: 'test-app' } }),
}));

describe('useStudioGenerator - Question Type Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize mcq to multiple_choice in AI response', async () => {
    // Mock AI returning legacy 'mcq' type
    vi.mocked(generateQuestionsModule.generateQuestions).mockResolvedValue({
      questions: [
        {
          text: 'What is 2 + 2?',
          question_type: 'mcq' as any, // Legacy type
          difficulty: 'easy',
          metadata: {
            options: ['3', '4', '5', '6'],
            correct_answer: '4',
            explanation: 'Basic math',
          },
        },
      ],
      metadata: {
        model: 'test-model',
        subject_type: 'math',
        generation_time_ms: 1000,
        token_count: 100,
        questions_generated: 1,
      },
    });

    const { result } = renderHook(() => useStudioGenerator());

    const config = {
      domain: 'Math',
      topics: ['Addition'],
      count: 1,
      difficultyMix: { easy: 1, medium: 0, hard: 0 },
      questionTypes: ['multiple_choice' as const],
      customInstructions: '',
    };

    let success = false;
    await waitFor(async () => {
      success = await result.current.generateBatch(config);
    });

    // Should succeed despite AI returning 'mcq'
    expect(success).toBe(true);
    expect(result.current.status).toBe('done');
    expect(result.current.stagedQuestions).toHaveLength(1);

    // Verify normalization occurred
    const question = result.current.stagedQuestions[0];
    expect(question.question_type).toBe('multiple_choice');
  });

  it('should handle multiple legacy aliases', async () => {
    vi.mocked(generateQuestionsModule.generateQuestions).mockResolvedValue({
      questions: [
        {
          text: 'Q1',
          question_type: 'mcq' as any,
          difficulty: 'easy',
          metadata: { options: ['A', 'B'], correct_answer: 'A' },
        },
        {
          text: 'Q2',
          question_type: 'short_answer' as any,
          difficulty: 'medium',
          metadata: { correct_answer: 'Answer' },
        },
        {
          text: 'Q3',
          question_type: 'true_false' as any,
          difficulty: 'hard',
          metadata: { correct_answer: 'True' },
        },
      ],
      metadata: {
        model: 'test',
        subject_type: 'general',
        generation_time_ms: 1000,
        token_count: 100,
        questions_generated: 3,
      },
    });

    const { result } = renderHook(() => useStudioGenerator());

    const config = {
      domain: 'General',
      topics: ['Mixed'],
      count: 3,
      difficultyMix: { easy: 1, medium: 1, hard: 1 },
      questionTypes: ['multiple_choice' as const, 'text_input' as const, 'boolean' as const],
    };

    await waitFor(async () => {
      await result.current.generateBatch(config);
    });

    expect(result.current.stagedQuestions).toHaveLength(3);
    expect(result.current.stagedQuestions[0].question_type).toBe('multiple_choice');
    expect(result.current.stagedQuestions[1].question_type).toBe('text_input');
    expect(result.current.stagedQuestions[2].question_type).toBe('boolean');
  });

  it('should reject truly invalid types', async () => {
    vi.mocked(generateQuestionsModule.generateQuestions).mockResolvedValue({
      questions: [
        {
          text: 'Q1',
          question_type: 'completely_invalid_type' as any,
          difficulty: 'easy',
          metadata: {},
        },
      ],
      metadata: {
        model: 'test',
        subject_type: 'general',
        generation_time_ms: 1000,
        token_count: 100,
        questions_generated: 1,
      },
    });

    const { result } = renderHook(() => useStudioGenerator());

    const config = {
      domain: 'Test',
      topics: ['Test'],
      count: 1,
      difficultyMix: { easy: 1, medium: 0, hard: 0 },
      questionTypes: ['multiple_choice' as const],
    };

    const success = await result.current.generateBatch(config);

    // Should fail validation
    expect(success).toBe(false);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('invalid question format');
  });
});

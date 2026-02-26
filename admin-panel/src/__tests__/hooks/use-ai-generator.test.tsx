import { generateQuestions } from '@/features/ai-assistant/api/generateQuestions';
import { useAIGenerator } from '@/hooks/use-ai-generator';
import { useToast } from '@/hooks/use-toast';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/features/ai-assistant/api/generateQuestions');
vi.mock('@/hooks/use-toast');

describe('useAIGenerator', () => {
  const mockToast = vi.fn();
  const mockQuestions = [
    {
      text: 'Question 1',
      question_type: 'mcq' as const,
      difficulty: 'medium' as const,
      metadata: {
        options: ['Option A', 'Option B'],
        correct_answer: 'Option A',
        explanation: 'Reason 1',
      },
    },
    {
      text: 'Question 2',
      question_type: 'boolean' as const,
      difficulty: 'easy' as const,
      metadata: {
        options: ['True', 'False'],
        correct_answer: 'True',
        explanation: 'Reason 2',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      toasts: [],
      toast: mockToast,
      dismiss: vi.fn(),
    });
    vi.mocked(generateQuestions).mockResolvedValue({
      questions: mockQuestions,
      metadata: {
        model: '@cf/meta/llama-3.1-8b-instruct',
        subject_type: 'general',
        generation_time_ms: 1000,
        token_count: 500,
        questions_generated: 2,
      },
    });
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useAIGenerator());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.generate).toBe('function');
    });
  });

  describe('generate', () => {
    it('should generate questions successfully', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'Mathematics basics',
        count: 5,
        difficulty: 'medium',
        skillTitle: 'Algebra',
        promptInstruction: 'Focus on equations',
        questionType: 'multiple_choice' as const,
      };

      let generateResult;
      await act(async () => {
        generateResult = await result.current.generate(params);
      });

      expect(generateQuestions).toHaveBeenCalledWith({
        text: params.context,
        difficulty_distribution: expect.any(Object),
        custom_instructions: 'Focus on the skill/topic: "Algebra". Focus on equations',
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Generation Complete',
        description: 'Successfully generated 2 questions.',
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(generateResult).toEqual(mockQuestions);
    });

    it('should inject skill context when missing from instruction', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'Science basics',
        count: 3,
        difficulty: 'easy',
        skillTitle: 'Biology',
        promptInstruction: 'Create questions about Biology',
        questionType: 'all' as const,
      };

      await act(async () => {
        await result.current.generate(params);
      });

      expect(generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          text: params.context,
          custom_instructions: 'Create questions about Biology',
        })
      );
    });

    it('should prepend skill context when not in instruction', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'History basics',
        count: 2,
        difficulty: 'hard',
        skillTitle: 'World War II',
        promptInstruction: 'Focus on dates and events',
        questionType: 'boolean' as const,
      };

      await act(async () => {
        await result.current.generate(params);
      });

      expect(generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          text: params.context,
          custom_instructions:
            'Focus on the skill/topic: "World War II". Focus on dates and events',
        })
      );
    });

    it('should handle empty prompt instruction', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'Geography basics',
        count: 4,
        difficulty: 'medium',
        skillTitle: 'Continents',
        promptInstruction: undefined,
        questionType: 'multiple_choice' as const,
      };

      await act(async () => {
        await result.current.generate(params);
      });

      expect(generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          text: params.context,
          custom_instructions: 'Focus on the skill/topic: "Continents". ',
        })
      );
    });

    it('should handle generation errors', async () => {
      const errorMessage = 'API rate limit exceeded';
      vi.mocked(generateQuestions).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'Test context',
        count: 1,
        difficulty: 'easy',
        skillTitle: 'Test Skill',
      };

      let generateResult;
      await act(async () => {
        generateResult = await result.current.generate(params);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(generateResult).toBe(null);
    });

    it('should set generating state during process', async () => {
      vi.mocked(generateQuestions).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ questions: mockQuestions } as any), 100)
          )
      );

      const { result } = renderHook(() => useAIGenerator());

      const params = {
        context: 'Test context',
        count: 1,
        difficulty: 'easy',
        skillTitle: 'Test Skill',
      };

      act(() => {
        result.current.generate(params);
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.error).toBe(null);

      // Wait for completion
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('should clear previous error on new generation attempt', async () => {
      // First call fails
      vi.mocked(generateQuestions).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useAIGenerator());

      await act(async () => {
        await result.current.generate({
          context: 'Test',
          count: 1,
          difficulty: 'easy',
          skillTitle: 'Test',
        });
      });

      expect(result.current.error).toBe('First error');

      // Second call succeeds
      vi.mocked(generateQuestions).mockResolvedValueOnce({ questions: mockQuestions } as any);

      await act(async () => {
        await result.current.generate({
          context: 'Test',
          count: 1,
          difficulty: 'easy',
          skillTitle: 'Test',
        });
      });

      expect(result.current.error).toBe(null);
    });

    it('should handle all difficulty levels', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const difficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of difficulties) {
        await act(async () => {
          await result.current.generate({
            context: 'Test',
            count: 1,
            difficulty,
            skillTitle: 'Test',
          });
        });

        expect(generateQuestions).toHaveBeenCalledWith(expect.objectContaining({ text: 'Test' }));
      }
    });

    it('should handle zero count', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: [] } as any);

      const { result } = renderHook(() => useAIGenerator());

      await act(async () => {
        await result.current.generate({
          context: 'Test',
          count: 0,
          difficulty: 'easy',
          skillTitle: 'Test',
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Generation Complete',
        description: 'Successfully generated 0 questions.',
      });
    });

    it('should handle long skill titles', async () => {
      vi.mocked(generateQuestions).mockResolvedValue({ questions: mockQuestions } as any);

      const { result } = renderHook(() => useAIGenerator());

      const longSkillTitle = 'Advanced Mathematics and Calculus with Differential Equations';

      await act(async () => {
        await result.current.generate({
          context: 'Test',
          count: 1,
          difficulty: 'easy',
          skillTitle: longSkillTitle,
          promptInstruction: 'Basic questions',
        });
      });

      expect(generateQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_instructions: expect.stringContaining(longSkillTitle),
        })
      );
    });
  });
});

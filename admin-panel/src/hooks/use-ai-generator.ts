import { generateQuestions } from '@/features/ai-assistant/api/generateQuestions';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import { useState } from 'react';
import { z } from 'zod';

const AIQuestionSchema = z.object({
  text: z.string(),
  question_type: z.enum(['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  metadata: z.object({
    options: z.array(z.string()).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
  }),
});

export function useAIGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (params: {
    context: string;
    count: number;
    difficulty: string;
    skillTitle: string;
    promptInstruction?: string;
    questionType?: 'all' | 'multiple_choice' | 'boolean';
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { skillTitle, context, count, difficulty, promptInstruction } = params;

      // Build custom instructions
      let customInstructions = promptInstruction || '';
      if (!customInstructions.includes(skillTitle)) {
        customInstructions = `Focus on the skill/topic: "${skillTitle}". ${customInstructions}`;
      }

      // Map difficulty to distribution
      const difficulty_distribution = {
        easy:
          difficulty === 'easy'
            ? count
            : difficulty === 'medium'
              ? Math.floor(count * 0.3)
              : Math.floor(count * 0.2),
        medium:
          difficulty === 'medium'
            ? count
            : difficulty === 'easy'
              ? Math.floor(count * 0.3)
              : Math.floor(count * 0.3),
        hard:
          difficulty === 'hard'
            ? count
            : difficulty === 'easy'
              ? Math.floor(count * 0.2)
              : Math.floor(count * 0.5),
      };

      const response = await generateQuestions({
        text: context,
        difficulty_distribution,
        custom_instructions: customInstructions,
      });

      // Validate response with Zod
      const validatedQuestions = z.array(AIQuestionSchema).parse(response.questions);

      toast({
        title: 'Generation Complete',
        description: `Successfully generated ${validatedQuestions.length} questions.`,
      });

      return validatedQuestions;
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      captureException(err as Error, {
        tags: { component: 'useAIGenerator', method: 'generate' },
        extra: { params },
      });
      toast({
        title: 'Generation Failed',
        description: msg,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    isGenerating,
    error,
  };
}

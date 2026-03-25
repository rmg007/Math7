import { generateQuestions } from '@/features/ai-assistant/api/generateQuestions';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useState } from 'react';

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type QuestionType =
  | 'mcq'
  | 'mcq_multi'
  | 'text_input'
  | 'boolean'
  | 'reorder_steps'
  | 'matching';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type DifficultyMix = {
  easy: number;
  medium: number;
  hard: number;
};

export interface StudioConfig {
  domain: string;
  topics: string[];
  count: number;
  difficultyMix: DifficultyMix;
  questionTypes: QuestionType[];
  customInstructions?: string;
}

export interface StagedQuestion {
  /** Local-only key for React; not persisted */
  id: string;
  text: string;
  question_type: QuestionType;
  difficulty: Difficulty;
  metadata: {
    options?: string[];
    correct_answer?: string | string[];
    explanation?: string;
  };
  kept: boolean;
  edited: boolean;
}

export type StudioStatus = 'idle' | 'generating' | 'done' | 'error';

// ─────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────

const StagedQuestionSchema = z.object({
  text: z.string(),
  question_type: z.enum(['mcq', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  metadata: z.object({
    options: z.array(z.string()).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
  }),
});

// ─────────────────────────────────────────────────────────
// Domain-specific prompt instructions
// ─────────────────────────────────────────────────────────

function getDomainInstructions(domain: string): string {
  const normalized = domain.toLowerCase();

  if (
    normalized.includes('math') ||
    normalized.includes('algebra') ||
    normalized.includes('geometry') ||
    normalized.includes('calculus')
  ) {
    return 'Include calculation steps in explanations. For integer/arithmetic topics, include at least one question with negative numbers. For geometry, reference formulas by name.';
  }
  if (
    normalized.includes('english') ||
    normalized.includes('language') ||
    normalized.includes('grammar') ||
    normalized.includes('writing')
  ) {
    return 'For fill-in-the-blank, ensure the surrounding sentence provides a unique contextual clue that points to exactly one answer. For grammar types, include the rule in the explanation.';
  }
  if (normalized.includes('history')) {
    return 'Ground every question in specific dates, persons, or events. Avoid overly broad questions. For reorder types, use chronological sequencing.';
  }
  if (
    normalized.includes('science') ||
    normalized.includes('physics') ||
    normalized.includes('chemistry') ||
    normalized.includes('biology')
  ) {
    return 'Reference the scientific concept or law by name in the explanation. For lab/experiment topics, prefer reorder steps type.';
  }
  if (
    normalized.includes('computer') ||
    normalized.includes('programming') ||
    normalized.includes('coding') ||
    normalized.includes('software')
  ) {
    return 'For programming topics, use correct syntax in questions and options. Prefer short, precise code snippets over prose descriptions.';
  }
  return 'Keep questions factual and unambiguous. Mix question types freely.';
}

function getTypeInstructions(types: QuestionType[]): string {
  const instructions: string[] = [];
  if (types.includes('matching')) {
    instructions.push(
      'For matching questions, include a `terms` array and a `definitions` array in metadata of equal length.'
    );
  }
  if (types.includes('reorder_steps')) {
    instructions.push(
      'For reorder_steps questions, provide the steps in shuffled order in `options` and the correct sequence as the `correct_answer` array.'
    );
  }
  if (types.includes('mcq') || types.includes('mcq_multi')) {
    instructions.push('For MCQ questions, always provide exactly 4 options.');
  }
  if (types.includes('boolean')) {
    instructions.push(
      'For boolean questions, the `correct_answer` must be exactly "True" or "False".'
    );
  }
  return instructions.join('\n');
}

// ─────────────────────────────────────────────────────────
// Prompt builder (exported for Prompt Preview)
// ─────────────────────────────────────────────────────────

export function buildStudioPrompt(config: StudioConfig): string {
  const { domain, topics, count, difficultyMix, questionTypes, customInstructions } = config;
  const allowedTypes = questionTypes.join(', ');
  const domainInstructions = getDomainInstructions(domain);
  const typeInstructions = getTypeInstructions(questionTypes);
  const topicList = topics.join(', ');

  return `You are an expert ${domain} question author for an educational platform.

SUBJECT DOMAIN: ${domain}
SPECIFIC TOPIC(S): ${topicList}

TASK: Generate exactly ${count} high-quality quiz questions focused exclusively on the topic(s) above.
- ${difficultyMix.easy} EASY questions
- ${difficultyMix.medium} MEDIUM questions  
- ${difficultyMix.hard} HARD questions

ALLOWED QUESTION TYPES (use only these): ${allowedTypes}

DOMAIN GUIDELINES:
${domainInstructions}

TYPE GUIDELINES:
${typeInstructions}

QUALITY RULES:
- Every question must be about the specified topic(s) — no tangential content.
- Every question must have a clear, unambiguous correct answer.
- Every question must include an explanation that teaches the concept.
- Distractors for MCQ must be plausible but clearly wrong upon reflection.
- Vary question phrasing — do not repeat the same sentence structure.
${customInstructions ? `\nADDITIONAL INSTRUCTIONS FROM AUTHOR:\n${customInstructions}` : ''}`;
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useStudioGenerator() {
  const [status, setStatus] = useState<StudioStatus>('idle');
  const [stagedQuestions, setStagedQuestions] = useState<StagedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  // ── Generate a full batch ──────────────────────────────
  const generateBatch = useCallback(
    async (config: StudioConfig): Promise<boolean> => {
      const topicText = config.topics.join(', ');
      if (topicText.trim().length < 3) {
        toast({
          title: 'Topic too short',
          description: 'Please enter at least 3 characters.',
          variant: 'destructive',
        });
        return false;
      }
      if (config.questionTypes.length === 0) {
        toast({
          title: 'No question types selected',
          description: 'Select at least one type.',
          variant: 'destructive',
        });
        return false;
      }

      setStatus('generating');
      setError(null);
      setStagedQuestions([]);

      try {
        const prompt = buildStudioPrompt(config);
        setLastPrompt(prompt);
        const { easy, medium, hard } = config.difficultyMix;

        const response = await generateQuestions({
          text: prompt,
          difficulty_distribution: { easy, medium, hard },
        });

        const validated = z
          .array(StagedQuestionSchema)
          .parse(response.questions)
          .map((q) => ({
            ...q,
            id: crypto.randomUUID(),
            kept: true,
            edited: false,
            question_type: q.question_type as QuestionType,
            difficulty: q.difficulty as Difficulty,
          }));

        setStagedQuestions(validated);
        setStatus('done');

        toast({
          title: '✦ Generation complete',
          description: `${validated.length} questions ready for review.`,
        });

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        setError(msg);
        setStatus('error');
        toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [toast]
  );

  // ── Regenerate a single card ───────────────────────────
  const regenerateSingle = useCallback(
    async (index: number, config: StudioConfig): Promise<void> => {
      const singleConfig: StudioConfig = {
        ...config,
        count: 1,
        difficultyMix: {
          easy: stagedQuestions[index]?.difficulty === 'easy' ? 1 : 0,
          medium: stagedQuestions[index]?.difficulty === 'medium' ? 1 : 0,
          hard: stagedQuestions[index]?.difficulty === 'hard' ? 1 : 0,
        },
      };

      try {
        const prompt = buildStudioPrompt(singleConfig);
        const response = await generateQuestions({
          text: prompt,
          difficulty_distribution: singleConfig.difficultyMix,
        });

        const validated = z.array(StagedQuestionSchema).parse(response.questions);
        if (validated.length === 0) return;

        const replacement: StagedQuestion = {
          ...validated[0],
          id: crypto.randomUUID(),
          kept: true,
          edited: false,
          question_type: validated[0].question_type as QuestionType,
          difficulty: validated[0].difficulty as Difficulty,
        };

        setStagedQuestions((prev) => {
          const next = [...prev];
          next[index] = replacement;
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Regeneration failed';
        toast({ title: 'Regeneration failed', description: msg, variant: 'destructive' });
      }
    },
    [stagedQuestions, toast]
  );

  // ── Update a card field ────────────────────────────────
  const updateCard = useCallback((index: number, patch: Partial<StagedQuestion>) => {
    setStagedQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch, edited: true };
      return next;
    });
  }, []);

  // ── Toggle kept / removed ──────────────────────────────
  const toggleKeep = useCallback((index: number) => {
    setStagedQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], kept: !next[index].kept };
      return next;
    });
  }, []);

  // ── Shift difficulty on a single card ─────────────────
  const shiftDifficulty = useCallback((index: number, direction: 'up' | 'down') => {
    const order: Difficulty[] = ['easy', 'medium', 'hard'];
    setStagedQuestions((prev) => {
      const next = [...prev];
      const current = next[index];
      const idx = order.indexOf(current.difficulty);
      const newIdx = direction === 'up' ? Math.min(idx + 1, 2) : Math.max(idx - 1, 0);
      next[index] = { ...current, difficulty: order[newIdx], edited: true };
      return next;
    });
  }, []);

  // ── Cycle difficulty pill ──────────────────────────────
  const cycleDifficulty = useCallback((index: number) => {
    const order: Difficulty[] = ['easy', 'medium', 'hard'];
    setStagedQuestions((prev) => {
      const next = [...prev];
      const current = next[index];
      const idx = order.indexOf(current.difficulty);
      next[index] = { ...current, difficulty: order[(idx + 1) % 3], edited: true };
      return next;
    });
  }, []);

  // ── Bulk selection helpers ────────────────────────────
  const keepAll = useCallback(
    () => setStagedQuestions((q) => q.map((c) => ({ ...c, kept: true }))),
    []
  );
  const removeAll = useCallback(
    () => setStagedQuestions((q) => q.map((c) => ({ ...c, kept: false }))),
    []
  );

  // ── Reset ─────────────────────────────────────────────
  const resetBatch = useCallback(() => {
    setStagedQuestions([]);
    setStatus('idle');
    setError(null);
    setLastPrompt(null);
  }, []);

  // ── Derived counts ────────────────────────────────────
  const keptCount = stagedQuestions.filter((q) => q.kept).length;
  const removedCount = stagedQuestions.filter((q) => !q.kept).length;
  const editedCount = stagedQuestions.filter((q) => q.edited).length;
  const hasUnsaved = stagedQuestions.length > 0;

  return {
    status,
    stagedQuestions,
    error,
    lastPrompt,
    keptCount,
    removedCount,
    editedCount,
    hasUnsaved,
    generateBatch,
    regenerateSingle,
    updateCard,
    toggleKeep,
    shiftDifficulty,
    cycleDifficulty,
    keepAll,
    removeAll,
    resetBatch,
  };
}

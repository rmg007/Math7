import { AIQuestionSchema, CanonicalQuestionType } from '@questerix/core/constants/question-types';
import { generateQuestions } from '@/features/ai-assistant/api/generateQuestions';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useState } from 'react';
import { useApp } from './use-app';
import { supabase } from '@/lib/supabase';
import { toJson } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// Types (aligned with Database Enums)
// ─────────────────────────────────────────────────────────

export type QuestionType = CanonicalQuestionType;

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
  questionTypes: CanonicalQuestionType[];
  customInstructions?: string;
}

export interface StagedQuestion {
  id: string;
  text: string;
  question_type: CanonicalQuestionType;
  difficulty: Difficulty;
  metadata: {
    options?: string[];
    correct_answer?: string | string[];
    explanation?: string;
    terms?: string[];
    definitions?: string[];
  };
  kept: boolean;
  edited: boolean;
}

export type StudioStatus = 'idle' | 'generating' | 'done' | 'error';

// ─────────────────────────────────────────────────────────
// Domain-specific prompt instructions (Generic Builder)
// ─────────────────────────────────────────────────────────

function getDomainInstructions(domain: string): string {
  const normalized = domain.toLowerCase();

  const mathKeywords = ['math', 'algebra', 'geometry', 'calculus', 'arithmetic', 'physics'];
  const languageKeywords = ['english', 'language', 'grammar', 'writing', 'reading', 'linguistics'];
  const historyKeywords = ['history', 'social studies', 'geography', 'civics'];
  const scienceKeywords = ['science', 'biology', 'chemistry', 'scientific'];
  const codingKeywords = ['computer', 'programming', 'coding', 'software', 'technology', 'it'];

  if (mathKeywords.some((k) => normalized.includes(k))) {
    return 'Include calculation steps in explanations. For integer/arithmetic topics, include at least one question with negative numbers. For geometry, reference formulas by name. Always use clear, unambiguous mathematical notation.';
  }
  if (languageKeywords.some((k) => normalized.includes(k))) {
    return 'For fill-in-the-blank, ensure the surrounding sentence provides a unique contextual clue that points to exactly one answer. For grammar types, include the rule in the explanation. Use age-appropriate vocabulary.';
  }
  if (historyKeywords.some((k) => normalized.includes(k))) {
    return 'Ground every question in specific dates, persons, or events. Avoid overly broad or subjective questions. For reorder types, use chronological sequencing.';
  }
  if (scienceKeywords.some((k) => normalized.includes(k))) {
    return 'Reference the scientific concept or law by name in the explanation. Use correct terminology. For lab/experiment topics, prefer reorder steps type to describe processes.';
  }
  if (codingKeywords.some((k) => normalized.includes(k))) {
    return 'For programming topics, use correct syntax in questions and options. Prefer short, precise code snippets over prose descriptions. Explain code outputs line-by-line.';
  }

  return 'Keep questions factual, unambiguous, and focused on core principles. Mix question types to challenge different cognitive skills. Ensure explanations clarify exactly why the correct answer is right.';
}

function getTypeInstructions(types: CanonicalQuestionType[]): string {
  const instructions: string[] = [];

  if (types.includes('multiple_choice')) {
    instructions.push(
      'For `multiple_choice`, always provide exactly 4 options. The `correct_answer` must match exactly one of the options.'
    );
  }
  if (types.includes('matching')) {
    instructions.push(
      'For `matching` questions, include a `terms` array and a `definitions` array in metadata of equal length (3-5 items).'
    );
  }
  if (types.includes('reorder_steps')) {
    instructions.push(
      'For `reorder_steps` questions, provide the steps in shuffled order in `options` and the correct sequence as the `correct_answer` array.'
    );
  }
  if (types.includes('boolean')) {
    instructions.push(
      'For `boolean` questions, the `correct_answer` must be exactly "True" or "False".'
    );
  }
  if (types.includes('mcq_multi')) {
    instructions.push(
      'For `mcq_multi`, provide 4-6 options and a `correct_answer` array containing all correct options.'
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
- Distractors for MCQ/multiple_choice must be plausible but clearly wrong upon reflection.
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
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const { currentApp } = useApp();
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
      let promptId: string | null = null;

      try {
        const prompt = buildStudioPrompt(config);
        setLastPrompt(prompt);
        setCurrentPromptId(null);
        const { easy, medium, hard } = config.difficultyMix;

        // 1. Create prompt record (status generated)
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error('No authenticated user');
        if (!currentApp?.app_id) throw new Error('No app selected');

        const { data: promptRecord, error: promptError } = await supabase
          .from('studio_prompts')
          .insert({
            app_id: currentApp.app_id,
            created_by: user.id,
            domain_name: config.domain,
            topics: config.topics,
            question_count: config.count,
            difficulty_mix: toJson(config.difficultyMix),
            question_types: config.questionTypes,
            custom_instructions: config.customInstructions,
            assembled_prompt: prompt,
            status: 'generated',
          })
          .select()
          .single();

        if (promptError) throw new Error(`Could not record prompt: ${promptError.message}`);
        promptId = promptRecord.id;
        setCurrentPromptId(promptId);

        const startTime = Date.now();
        const response = await generateQuestions({
          text: prompt,
          difficulty_distribution: { easy, medium, hard },
        });
        const duration = Date.now() - startTime;

        const validationResult = AIQuestionSchema.array().safeParse(response.questions);
        if (!validationResult.success) {
          console.error('[Studio] Validation failed:', validationResult.error.format());

          // Layer 5: Observability - log raw value for monitoring
          const invalidType = validationResult.error.errors.find(
            (e) => e.path[0] === 'question_type'
          );
          if (promptId && invalidType) {
            await supabase
              .from('studio_prompts')
              .update({
                status: 'failed',
                error_details: {
                  invalid_question_type: String(invalidType),
                  raw_ai_response: response.questions,
                },
              })
              .eq('id', promptId);
          }

          throw new Error(
            `AI returned invalid question format: ${validationResult.error.errors[0]?.message || 'Unknown error'}`
          );
        }

        const validated: StagedQuestion[] = validationResult.data.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
          kept: true,
          edited: false,
          question_type: q.question_type as CanonicalQuestionType,
          difficulty: q.difficulty as Difficulty,
        }));

        setStagedQuestions(validated);
        setStatus('done');

        // 2. Update prompt record (success metadata)
        if (promptRecord) {
          await supabase
            .from('studio_prompts')
            .update({
              questions_generated: validated.length,
              generation_time_ms: duration,
              model_used: 'Cloudflare Workers AI',
            })
            .eq('id', promptRecord.id);
        }

        toast({
          title: '✦ Generation complete',
          description: `${validated.length} questions ready for review.`,
        });

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        console.error('[Studio] Generation error:', err);
        setError(msg);
        setStatus('error');

        // 3. Mark prompt record as failed
        if (promptId) {
          await supabase.from('studio_prompts').update({ status: 'failed' }).eq('id', promptId);
        }

        toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [toast, currentApp]
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

        const validationResult = AIQuestionSchema.array().safeParse(response.questions);
        if (!validationResult.success || validationResult.data.length === 0) {
          throw new Error('AI returned invalid format for replacement card.');
        }

        const replacement: StagedQuestion = {
          ...validationResult.data[0],
          id: crypto.randomUUID(),
          kept: true,
          edited: false,
          question_type: validationResult.data[0].question_type as CanonicalQuestionType,
          difficulty: validationResult.data[0].difficulty as Difficulty,
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
    currentPromptId,
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

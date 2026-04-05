import { z } from 'zod';

export const CANONICAL_QUESTION_TYPES = [
  'multiple_choice',
  'mcq_multi',
  'text_input',
  'boolean',
  'reorder_steps',
  'matching',
] as const;

export type CanonicalQuestionType = (typeof CANONICAL_QUESTION_TYPES)[number];

export const QUESTION_TYPE_ALIASES: Record<string, CanonicalQuestionType> = {
  mcq: 'multiple_choice',
  single_choice: 'multiple_choice',
  radio: 'multiple_choice',
  'multi_select': 'mcq_multi',
  'multiple_select': 'mcq_multi',
  'select_all_that_apply': 'mcq_multi',
  true_false: 'boolean',
  tf: 'boolean',
  short_answer: 'text_input',
  'fill_in_blank': 'text_input',
  'fill_blank': 'text_input',
  reorder: 'reorder_steps',
  ordering: 'reorder_steps',
  sequence: 'reorder_steps',
} as const;

export function normalizeQuestionType(raw: string): CanonicalQuestionType | null {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '_');
  return QUESTION_TYPE_ALIASES[normalized] || CANONICAL_QUESTION_TYPES.find(type => type === normalized) || null;
}

export const QuestionTypeSchema = z.preprocess(
  (val) => typeof val === 'string' ? normalizeQuestionType(val) ?? val : val,
  z.enum(CANONICAL_QUESTION_TYPES)
);

export const AIQuestionSchema = z.object({
  text: z.string(),
  question_type: QuestionTypeSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  metadata: z.object({
    options: z.array(z.string()).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
    terms: z.array(z.string()).optional(),
    definitions: z.array(z.string()).optional(),
  }),
});

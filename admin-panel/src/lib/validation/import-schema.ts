import { z } from 'zod';

// UUID regex for strict validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Base schema shared by all question types
const BaseQuestionSchema = z.object({
  skill_id: z.string().regex(uuidRegex, { message: 'Invalid skill_id format (must be UUID)' }),
  content: z.string().min(1, { message: 'Content is required' }),
  explanation: z.string().optional(),
  points: z.number().int().min(0, { message: 'Points must be a non-negative integer' }),
  is_published: z.boolean(),
});

// Specific schemas for each question type
export const MultipleChoiceSchema = BaseQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z
    .array(
      z.object({
        text: z.string().min(1, { message: 'Option text is required' }),
        is_correct: z.boolean(),
      })
    )
    .min(2, { message: 'Multiple choice questions must have at least 2 options' })
    .refine((options) => options.some((opt) => opt.is_correct), {
      message: 'At least one option must be marked as correct',
    }),
  solution: z.any().optional(), // Solution is derived/validated based on options usually
});

export const McqMultiSchema = BaseQuestionSchema.extend({
  type: z.literal('mcq_multi'),
  options: z
    .array(
      z.object({
        text: z.string().min(1, { message: 'Option text is required' }),
        is_correct: z.boolean(),
      })
    )
    .min(2, { message: 'MCQ Multi questions must have at least 2 options' })
    .refine((options) => options.some((opt) => opt.is_correct), {
      message: 'At least one option must be marked as correct',
    }),
  solution: z.any().optional(),
});

export const TextInputSchema = BaseQuestionSchema.extend({
  type: z.literal('text_input'),
  options: z.null().optional(),
  solution: z.string().min(1, { message: 'Solution is required for text input' }),
});

export const BooleanSchema = BaseQuestionSchema.extend({
  type: z.literal('boolean'),
  options: z.null().optional(),
  solution: z.boolean({ required_error: 'Solution is required for boolean questions' }),
});

export const ReorderSchema = BaseQuestionSchema.extend({
  type: z.literal('reorder_steps'),
  options: z
    .array(z.string().min(1))
    .min(2, { message: 'Reorder questions must have at least 2 steps' }),
  solution: z.array(z.string()).min(2), // The correct order
});

// Discriminated Union Schema
export const QueuedQuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceSchema,
  McqMultiSchema,
  TextInputSchema,
  BooleanSchema,
  ReorderSchema,
]);

export type QueuedQuestion = z.infer<typeof QueuedQuestionSchema>;
export type ImportBatch = QueuedQuestion[];

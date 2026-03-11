import { z } from 'zod';

export const QUESTION_TYPES = [
  'multiple_choice',
  'mcq_multi',
  'text_input',
  'boolean',
  'reorder_steps',
] as const;

export const STATUS_OPTIONS: { value: 'draft' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

export const questionSchema = z.object({
  skill_id: z.string().uuid('Please select a target skill'),
  type: z.enum(QUESTION_TYPES),
  content: z
    .string()
    .min(1, 'Question text is required')
    .max(800, 'Question text must be under 800 characters'),
  options: z.unknown(),
  solution: z.unknown(),
  explanation: z.string().max(1200, 'Explanation must be under 1200 characters').optional(),
  hint_text: z.string().max(400, 'Hint must be under 400 characters').optional(),
  rule_text: z.string().max(400, 'Rule must be under 400 characters').optional(),
  eli10_text: z.string().max(400, 'ELI10 text must be under 400 characters').optional(),
  points: z.coerce.number().min(1),
  status: z.enum(['draft', 'live']).default('draft'),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

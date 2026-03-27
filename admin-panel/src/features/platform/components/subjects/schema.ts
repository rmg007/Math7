import { z } from 'zod';
import type { DataColumn } from '@/lib/data-utils';

export const SUBJECT_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'Title' },
  { key: 'slug', header: 'Slug' },
  { key: 'status', header: 'Status' },
  { key: 'display_order', header: 'Order' },
];

export const subjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  color_hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code (e.g. #0D9488)')
    .optional()
    .or(z.literal('')),
  display_order: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'live']).default('draft'),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;

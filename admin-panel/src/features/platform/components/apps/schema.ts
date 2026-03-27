import { z } from 'zod';
import type { DataColumn } from '@/lib/data-utils';

export const APP_COLUMNS: DataColumn[] = [
  { key: 'display_name', header: 'Name' },
  { key: 'subdomain', header: 'Subdomain' },
  { key: 'is_active', header: 'Status' },
  { key: 'grade_level', header: 'Grade' },
];

export const appSchema = z.object({
  subject_id: z.string().uuid('Please select a subject'),
  display_name: z.string().min(1, 'Display name is required'),
  subdomain: z
    .string()
    .min(1, 'Subdomain is required')
    .max(63, 'Subdomain must be less than 64 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and dashes'),
  grade_level: z.string().min(1, 'Grade level is required'),
  grade_number: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type AppFormData = z.infer<typeof appSchema>;

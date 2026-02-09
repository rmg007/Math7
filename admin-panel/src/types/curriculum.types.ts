// Curriculum types derived from the Supabase-generated database schema.
// This file re-exports DB types as domain aliases for use across the app.
// Manual interfaces have been removed to prevent type drift.
import type { Database, Tables } from '@/lib/database.types';

// --- Enum Aliases (derived from DB enums) ---
export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];
export type QuestionType = Database['public']['Enums']['question_type'];

// --- Row Type Aliases (derived from DB table rows) ---
export type Domain = Tables<'domains'>;
export type Skill = Tables<'skills'>;
export type Question = Tables<'questions'>;

// --- Join / Composite Types ---
// These represent query results with expanded relations, not raw DB rows.
export interface DomainWithSkills extends Domain {
  skills: Array<{ domain_id: string; skill_id: string; skill: Skill }>;
}

export interface SkillWithQuestions extends Skill {
  questions: Array<{ skill_id: string; question_id: string; question: Question }>;
}

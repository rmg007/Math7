// Type definitions for curriculum entities based on actual Supabase schema
// Generated from: supabase/migrations/00000000000001_baseline.sql

export type CurriculumStatus = 'draft' | 'published' | 'live';
export type QuestionType = 'multiple_choice' | 'mcq_multi' | 'text_input' | 'boolean' | 'reorder_steps';

export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  color: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: CurriculumStatus;
  app_id: string | null;
}

export interface Skill {
  id: string;
  domain_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  difficulty: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: CurriculumStatus;
  app_id: string | null;
}

export interface Question {
  id: string;
  skill_id: string | null;
  type: QuestionType;
  content: Record<string, unknown>; // JSONB
  options: Record<string, unknown> | null; // JSONB
  solution: Record<string, unknown>; // JSONB
  explanation: string | null;
  points: number;
  sort_order: number;
  is_published: boolean;
  status: CurriculumStatus;
  app_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Join table types (for domain_skills and skill_questions relationships)
export interface DomainSkill {
  domain_id: string;
  skill_id: string;
  skill: Skill;
}

export interface SkillQuestion {
  skill_id: string;
  question_id: string;
  question: Question;
}

// Curriculum API response types (for hooks and services)
export interface DomainWithSkills extends Domain {
  skills: DomainSkill[];
}

export interface SkillWithQuestions extends Skill {
  questions: SkillQuestion[];
}

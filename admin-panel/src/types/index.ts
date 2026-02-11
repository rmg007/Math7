import type { Database, Tables } from '@/lib/database.types';
import type { Json } from '@/lib/database.types';

// --- Shared Constants & Types (from common) ---
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    statusFilter?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// --- Row Type Aliases (The "Golden" types) ---
export type Domain = Tables<'domains'>;
export type Skill = Tables<'skills'>;
export type Question = Tables<'questions'>;
export type Profile = Tables<'profiles'>;
export type App = Tables<'apps'>;
export type Subject = Tables<'subjects'>;

// --- Legacy Base Row Aliases (for backward compatibility) ---
export type DomainRow = Domain;
export type QuestionRow = Question;
export type SkillRow = Skill;
export type ProfileRow = Profile;

// --- Enum Aliases ---
export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];
export type QuestionType = Database['public']['Enums']['question_type'];

// --- Join / Composite Types ---
export interface DomainWithSkills extends Domain {
  skills: Array<{ domain_id: string; skill_id: string; skill: Skill }>;
}

export interface SkillWithQuestions extends Skill {
  questions: Array<{ skill_id: string; question_id: string; question: Question }>;
}

export type QuestionListItem = QuestionRow & {
    metadata?: Json;
    skills: { title: string; domains: { title: string } | null } | null;
} | null;

export type DomainListItem = DomainRow;
export type SkillReference = Pick<SkillRow, 'skill_id' | 'title'>;
export type UserProfile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'created_at'>;

// --- DTOs ---
export interface QuestionImportData {
    content: string;
    type: QuestionType;
    points: number;
    status: CurriculumStatus;
    options: Json;
    solution: Json;
    explanation: string;
    skill_id: string;
    sort_order: number;
}

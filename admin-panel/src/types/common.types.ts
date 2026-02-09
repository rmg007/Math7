// Shared types derived from the Supabase-generated database schema.
// Manual interfaces have been removed to prevent type drift.
// Types that represent JOIN query results use intersection types.
import type { Tables } from '@/lib/database.types';
import type { CurriculumStatus, QuestionType } from './curriculum.types';
import type { Json } from '@/lib/database.types';

// --- Row Type Aliases ---
export type DomainRow = Tables<'domains'>;
export type QuestionRow = Tables<'questions'>;
export type SkillRow = Tables<'skills'>;
export type ProfileRow = Tables<'profiles'>;

// Question list item type (API returns expanded data with joins)
// Extends the DB Row with optional joined fields from related tables.
export type QuestionListItem = QuestionRow & {
    metadata?: Json;
    skills?: { name: string; domains: { name: string } | null } | null;
};

// Domain list item type (direct alias — all fields match the domains Row)
export type DomainListItem = DomainRow;

// Skill list item for dropdowns (minimal projection)
export type SkillReference = Pick<SkillRow, 'skill_id' | 'title'>;

// User management types (projection of profiles table)
export type UserProfile = Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role' | 'created_at'>;

// Question import type (input DTO — intentionally not derived from DB Row
// because it represents a user-provided payload, not a stored record)
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

// --- Shared Pagination Types (consolidated from duplicate definitions in hooks) ---
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

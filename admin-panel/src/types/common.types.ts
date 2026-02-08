import type { QuestionType, CurriculumStatus } from './curriculum.types';
import type { Json } from './database.types';

// Question list item type (API returns expanded data with joins)
export interface QuestionListItem {
    question_id: string;
    content: string;
    type: QuestionType;
    points: number;
    sort_order: number | null;
    status: CurriculumStatus | null;
    skill_id: string | null;
    app_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    options: Json;
    solution: Json;
    explanation: string | null;
    metadata?: Json;
    skills?: { name: string; domains: { name: string } | null } | null;
}

// Domain list item type
export interface DomainListItem {
    domain_id: string;
    title: string;
    slug: string;
    sort_order: number | null;
    status: CurriculumStatus | null;
    description: string | null;
    icon: string | null;
    color: string | null;
    app_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_published: boolean;
}

// Skill list item for dropdowns (minimal)
export interface SkillReference {
    skill_id: string;
    title: string;
}

// User management types
export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    avatarUrl?: string | null;
    role: 'super_admin' | 'admin' | 'student' | 'mentor';
    created_at: string;
}

// Question import type
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

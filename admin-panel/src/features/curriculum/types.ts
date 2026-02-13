import { Database } from '@/lib/database.types';

export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | CurriculumStatus;
  domainId?: string;
  skillId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * UUID validation helper
 */
export function isValidUUID(uuid: string | undefined | null): uuid is string {
  if (!uuid) return false;
  // Relaxed UUID format: accept any 8-4-4-4-12 hex string
  // The strict RFC 4122 pattern rejects synthetic UUIDs like those used as app_ids
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

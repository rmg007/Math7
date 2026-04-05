import { useBulkCreate, useBulkDelete, useBulkUpdateStatus } from '@/hooks/use-bulk-mutation';
import { CurriculumStatus } from '../types';

const OPTIONS = {
  table: 'skills' as const,
  idColumn: 'skill_id',
  invalidateKeys: ['skills', 'skills-paginated', 'dashboard-stats'],
};

export function useBulkDeleteSkills() {
  return useBulkDelete(OPTIONS);
}

export function useBulkUpdateSkillsStatus() {
  return useBulkUpdateStatus<CurriculumStatus>({
    ...OPTIONS,
    invalidateKeys: [...OPTIONS.invalidateKeys, 'publish-preview'],
  });
}

export function useBulkCreateSkills() {
  return useBulkCreate(OPTIONS);
}

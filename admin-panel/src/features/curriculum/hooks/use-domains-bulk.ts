import { useBulkCreate, useBulkDelete, useBulkUpdateStatus } from '@/hooks/use-bulk-mutation';
import { CurriculumStatus } from '../types';

const OPTIONS = {
  table: 'domains' as const,
  idColumn: 'domain_id',
  invalidateKeys: ['domains', 'domains-paginated', 'dashboard-stats'],
};

export function useBulkDeleteDomains() {
  return useBulkDelete(OPTIONS);
}

export function useBulkUpdateDomainsStatus() {
  return useBulkUpdateStatus<CurriculumStatus>({
    ...OPTIONS,
    invalidateKeys: [...OPTIONS.invalidateKeys, 'publish-preview'],
  });
}

export function useBulkCreateDomains() {
  return useBulkCreate(OPTIONS);
}

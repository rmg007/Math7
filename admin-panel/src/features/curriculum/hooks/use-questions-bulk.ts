import { useBulkCreate, useBulkDelete, useBulkUpdateStatus } from '@/hooks/use-bulk-mutation';

const OPTIONS = {
  table: 'questions' as const,
  idColumn: 'question_id',
  invalidateKeys: ['questions', 'questions-paginated', 'dashboard-stats'],
};

export function useBulkDeleteQuestions() {
  return useBulkDelete(OPTIONS);
}

export function useBulkUpdateQuestionsStatus() {
  return useBulkUpdateStatus<'draft' | 'published' | 'live'>({
    ...OPTIONS,
    invalidateKeys: [...OPTIONS.invalidateKeys, 'publish-preview'],
  });
}

export function useBulkCreateQuestions() {
  return useBulkCreate(OPTIONS);
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import type { QuestionListItem } from '@/types';
import {
  useDeleteQuestion,
  useDuplicateQuestion,
  usePaginatedQuestions,
  useUpdateQuestionOrder,
  type QuestionInsert,
} from './use-questions';
import {
  useBulkCreateQuestions,
  useBulkDeleteQuestions,
  useBulkUpdateQuestionsStatus,
} from './use-questions-bulk';
import { useSkills } from './use-skills';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

export const DEFAULT_PAGE_SIZE = 10;

export const QUESTION_TOGGLE_COLUMNS = [
  { key: 'content', header: 'Content', alwaysVisible: true },
  { key: 'type', header: 'Type' },
  { key: 'skill', header: 'Skill' },
  { key: 'points', header: 'Points' },
  { key: 'status', header: 'Status' },
];

export function useQuestionsState() {
  const { currentApp, apps } = useApp();
  const { toast } = useToast();

  const [selectedSkillId, setSelectedSkillId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);
  const [appFilter, setAppFilter] = useState<string>('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(QUESTION_TOGGLE_COLUMNS.map((c) => c.key))
  );

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
  } = usePaginatedQuestions(
    {
      page,
      pageSize,
      search: debouncedSearch,
      status: statusFilter,
      skillId: selectedSkillId,
      sortBy,
      sortOrder,
    },
    appFilter !== 'all' ? appFilter : undefined
  );
  const { data: skills } = useSkills();

  const deleteQuestion = useDeleteQuestion();
  const bulkDelete = useBulkDeleteQuestions();
  const bulkUpdateStatus = useBulkUpdateQuestionsStatus();
  const duplicateQuestion = useDuplicateQuestion();
  const updateQuestionOrder = useUpdateQuestionOrder();
  const bulkCreate = useBulkCreateQuestions();

  const showToast = useCallback(
    (title: string, type: 'success' | 'error' = 'success') => {
      toast({
        title,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    },
    [toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [selectedSkillId, statusFilter]);

  const questions = useMemo(
    () => (paginatedData?.data ?? []).filter((q): q is QuestionListItem => q !== null),
    [paginatedData?.data]
  );

  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q: QuestionListItem) => q.question_id === active.id);
      const newIndex = questions.findIndex((q: QuestionListItem) => q.question_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);

        const updates = reorderedQuestions.map((question: QuestionListItem, index: number) => ({
          question_id: question.question_id,
          sort_order: index + 1 + (page - 1) * pageSize,
        }));

        try {
          await updateQuestionOrder.mutateAsync(updates);
          showToast('Question order updated', 'success');
        } catch {
          showToast('Failed to update question order', 'error');
        }
      }
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q: QuestionListItem) => q.question_id)));
    }
  }, [questions, selectedIds.size]);

  const handleBulkStatusUpdate = async (status: 'draft' | 'published' | 'live') => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ question_ids: Array.from(selectedIds), status });
      showToast(`${selectedIds.size} question(s) marked as ${status}`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update questions', 'error');
    }
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmation({ type: 'single', id });
  }, []);

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      if (deleteConfirmation.type === 'bulk') {
        await bulkDelete.mutateAsync(Array.from(selectedIds));
        showToast(`${selectedIds.size} question(s) deleted`, 'success');
        setSelectedIds(new Set());
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteQuestion.mutateAsync(deleteConfirmation.id);
        showToast('Question deleted', 'success');
      }
    } catch {
      showToast('Failed to delete question(s)', 'error');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateQuestion.mutateAsync(id);
        showToast('Question duplicated', 'success');
      } catch {
        showToast('Failed to duplicate question', 'error');
      }
    },
    [duplicateQuestion, showToast]
  );

  const handleImport = async (data: Record<string, unknown>[]) => {
    if (!currentApp) return;

    try {
      const questionsToImport = data.map((item, index) => {
        const parseField = (field: unknown) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch {
              return field;
            }
          }
          return field || {};
        };

        const skillTitleFromCsv = (item.skill_title ||
          item.skill_name ||
          item.skill ||
          item.Skill) as string;
        let skill_id = (item.skill_id || item.Skill_id) as string;

        if (!skill_id && skillTitleFromCsv && skills) {
          const matchedSkill = skills.find(
            (s) => s.title.toLowerCase() === skillTitleFromCsv.trim().toLowerCase()
          );
          if (matchedSkill) {
            skill_id = matchedSkill.skill_id;
          }
        }

        if (!skill_id && selectedSkillId && selectedSkillId !== 'all') {
          skill_id = selectedSkillId;
        }

        if (!skill_id) {
          throw new Error(
            skillTitleFromCsv
              ? `Row ${index + 1}: Skill "${skillTitleFromCsv}" not found in this app.`
              : `Row ${index + 1}: Skill ID or Title is missing.`
          );
        }

        let statusValue = ((item.status as string) || 'draft').toLowerCase().trim();
        if (statusValue === 'active') statusValue = 'live';

        return {
          app_id: currentApp.app_id,
          content: typeof item.content === 'object' ? item.content : String(item.content || ''),
          type: (item.type || item.Type || 'multiple_choice') as QuestionInsert['type'],
          points: parseInt((item.points as string) || (item.Points as string)) || 1,
          status: (statusValue || 'draft') as QuestionInsert['status'],
          options: parseField(item.options || item.Options),
          solution: parseField(item.solution || item.Solution),
          explanation: String(item.explanation || item.Explanation || ''),
          skill_id,
          sort_order: totalCount + index + 1,
        };
      });

      await bulkCreate.mutateAsync(questionsToImport as QuestionInsert[]);
      showToast(`Successfully imported ${questionsToImport.length} questions`, 'success');
    } catch (error) {
      captureException(error as Error, {
        tags: { component: 'QuestionList', method: 'handleImport' },
      });
      const message = error instanceof Error ? error.message : 'Failed to import questions';
      showToast(message, 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedSkillId('all');
    setPage(1);
  };

  const isDragDisabled =
    Boolean(debouncedSearch) ||
    statusFilter !== 'all' ||
    selectedSkillId !== 'all' ||
    sortBy !== 'sort_order';

  const isAllSelected = questions.length ? selectedIds.size === questions.length : false;
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedSkillId !== 'all';

  return {
    currentApp,
    apps,
    skills,
    questions,
    totalCount,
    totalPages,
    isLoading,
    isError,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSkillId,
    setSelectedSkillId,
    appFilter,
    setAppFilter,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDelete,
    confirmDelete,
    handleDuplicate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    isDeleting: bulkDelete.isPending || deleteQuestion.isPending,
    isUpdating: bulkUpdateStatus.isPending,
    isDuplicating: duplicateQuestion.isPending,
  };
}

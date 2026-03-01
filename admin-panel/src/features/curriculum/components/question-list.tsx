import { AdminHeader } from '@/components/ui/admin-header';
import { QuestionDeleteDialog } from './question-list-dialogs';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColumnToggle } from '@/components/ui/column-toggle';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import type { DataColumn } from '@/lib/data-utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn, formatIdentifier } from '@/lib/utils';
import type { QuestionListItem } from '@/types';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckSquare,
  Copy,
  FileText,
  Filter,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { Link } from 'react-router-dom';
import {
  QuestionInsert,
  useDeleteQuestion,
  useDuplicateQuestion,
  usePaginatedQuestions,
  useUpdateQuestionOrder,
} from '../hooks/use-questions';
import {
  useBulkCreateQuestions,
  useBulkDeleteQuestions,
  useBulkUpdateQuestionsStatus,
} from '../hooks/use-questions-bulk';
import { useSkills } from '../hooks/use-skills';
import { CurriculumFilterBar } from './curriculum-filter-bar';

const QUESTION_COLUMNS: DataColumn[] = [
  { key: 'content', header: 'content' },
  { key: 'type', header: 'type' },
  { key: 'points', header: 'points' },
  { key: 'status', header: 'status' },
  { key: 'options', header: 'options' },
  { key: 'solution', header: 'solution' },
  { key: 'explanation', header: 'explanation' },
];

const QUESTION_TOGGLE_COLUMNS = [
  { key: 'content', header: 'Content', alwaysVisible: true },
  { key: 'type', header: 'Type' },
  { key: 'skill', header: 'Skill' },
  { key: 'points', header: 'Points' },
  { key: 'status', header: 'Status' },
];

const DEFAULT_PAGE_SIZE = 10;

interface SortableRowProps {
  question: QuestionListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDragDisabled: boolean;
  isDuplicating: boolean;
  visibleColumns: Set<string>;
}

const SortableRow = memo(
  ({
    question,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    isDragDisabled,
    isDuplicating,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: question.question_id,
      disabled: isDragDisabled,
    });

    const rowRef = useRef<HTMLTableRowElement>(null);

    useLayoutEffect(() => {
      if (rowRef.current) {
        rowRef.current.style.transform = CSS.Transform.toString(transform) || '';
        rowRef.current.style.transition = transition || '';
      }
    }, [transform, transition]);

    return (
      <TableRow
        data-testid="question-row"
        ref={(node) => {
          setNodeRef(node);
          if (rowRef.current !== node) {
            (rowRef as MutableRefObject<HTMLTableRowElement | null>).current = node;
          }
        }}
        className={cn(
          'even:bg-gray-50/40 relative',
          isDragging && 'bg-gray-50 shadow-md opacity-50 z-10'
        )}
      >
        <TableCell className="w-8 px-2">
          {!isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="p-1 text-gray-200">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
        </TableCell>
        <TableCell className="w-8 px-2">
          <button
            onClick={() => onSelect(question.question_id)}
            className="text-gray-300 hover:text-gray-500"
            aria-label={isSelected ? 'Deselect question' : 'Select question'}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4 max-w-[350px]">
          <div className="flex flex-col min-w-0">
            <div
              className="font-medium text-gray-900 text-xs line-clamp-1 prose-sm"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  typeof question.content === 'string'
                    ? question.content
                    : JSON.stringify(question.content)
                ),
              }}
            />
            {question.apps?.display_name && (
              <span className="text-[11px] text-gray-500 mt-0.5">{question.apps.display_name}</span>
            )}
          </div>
        </TableCell>
        {visibleColumns.has('type') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {formatIdentifier(question.type)}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('skill') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {question.skills?.title || 'No Skill'}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('points') && (
          <TableCell className="text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
              {question.points}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            <StatusBadge status={(question.status?.toLowerCase() as StatusType) || 'draft'} />
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Link
              to={`/questions/${question.question_id}/edit`}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
              title="Edit"
              aria-label="Edit question"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDuplicate(question.question_id)}
              disabled={isDuplicating}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
              title="Duplicate"
              aria-label="Duplicate question"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(question.question_id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
              aria-label="Delete question"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

const SortableCard = memo(
  ({
    question,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    isDragDisabled,
    isDuplicating,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: question.question_id,
      disabled: isDragDisabled,
    });

    const cardRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = CSS.Transform.toString(transform) || '';
        cardRef.current.style.transition = transition || '';
      }
    }, [transform, transition]);

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (cardRef.current !== node) {
            (cardRef as MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn(
          'bg-white rounded-lg border p-3 space-y-3 relative',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200',
          isDragging ? 'opacity-50 z-10 shadow-lg' : 'hover:border-gray-300'
        )}
      >
        <div className="flex items-start gap-2">
          {!isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="p-1 text-gray-200 shrink-0">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <button
            onClick={() => onSelect(question.question_id)}
            className="p-1 text-gray-300 hover:text-gray-500 shrink-0"
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className="font-medium text-gray-900 text-xs line-clamp-2 prose-sm mb-1"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  typeof question.content === 'string'
                    ? question.content
                    : JSON.stringify(question.content)
                ),
              }}
            />
            {question.apps?.display_name && (
              <span className="text-[10px] text-gray-400 leading-none">
                {question.apps.display_name}
              </span>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {visibleColumns.has('type') && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {formatIdentifier(question.type)}
                </span>
              )}
              {visibleColumns.has('skill') && question.skills?.title && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {question.skills.title}
                </span>
              )}
              {visibleColumns.has('points') && (
                <span className="text-[11px] text-gray-500">{question.points} pts</span>
              )}
            </div>
          </div>
          {visibleColumns.has('status') && (
            <div className="shrink-0">
              <StatusBadge status={(question.status?.toLowerCase() as StatusType) || 'draft'} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
          <Link
            to={`/questions/${question.question_id}/edit`}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDuplicate(question.question_id)}
            disabled={isDuplicating}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(question.question_id)}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

export function QuestionList() {
  const { currentApp, isSuperAdmin, apps } = useApp();
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
  const { toast } = useToast();

  const showToast = useCallback(
    (title: string, type: 'success' | 'error' = 'success') => {
      toast({
        title,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    },
    [toast]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const questionIds = useMemo(
    () => questions.map((q: QuestionListItem) => q.question_id),
    [questions]
  );

  const isDragDisabled =
    Boolean(debouncedSearch) ||
    statusFilter !== 'all' ||
    selectedSkillId !== 'all' ||
    sortBy !== 'sort_order';

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

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q: QuestionListItem) => q.question_id)));
    }
  }, [questions, selectedIds.size]);

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

  const handleMarkLive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ question_ids: Array.from(selectedIds), status: 'live' });
      showToast(`${selectedIds.size} question(s) marked as live`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update questions', 'error');
    }
  };

  const handleMarkDraft = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        question_ids: Array.from(selectedIds),
        status: 'draft',
      });
      showToast(`${selectedIds.size} question(s) marked as draft`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update questions', 'error');
    }
  };

  const handleMarkPublished = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        question_ids: Array.from(selectedIds),
        status: 'published',
      });
      showToast(`${selectedIds.size} question(s) marked as published`, 'success');
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
              // Handle potentially double-escaped or stringified JSON
              return JSON.parse(field);
            } catch {
              // Fallback for non-JSON strings that might be simple values
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

        // Try to resolve skill_id from title if not provided
        if (!skill_id && skillTitleFromCsv && skills) {
          const matchedSkill = skills.find(
            (s) => s.title.toLowerCase() === skillTitleFromCsv.trim().toLowerCase()
          );
          if (matchedSkill) {
            skill_id = matchedSkill.skill_id;
          }
        }

        // Fallback to selected skill filter if still missing
        if (!skill_id && selectedSkillId && selectedSkillId !== 'all') {
          skill_id = selectedSkillId;
        }

        if (!skill_id) {
          throw new Error(
            skillTitleFromCsv
              ? `Row ${index + 1}: Skill "${skillTitleFromCsv}" not found in this app.`
              : `Row ${index + 1}: Skill ID or Title is missing. Please select a skill or include skill_title in CSV.`
          );
        }

        // Normalize status
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
          sort_order: (paginatedData?.totalCount ?? 0) + index + 1,
        };
      });

      await bulkCreate.mutateAsync(questionsToImport as QuestionInsert[]);
      showToast(`Successfully imported ${questionsToImport.length} questions`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      const message = error instanceof Error ? error.message : 'Failed to import questions';
      showToast(message, 'error');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    setSelectedIds(new Set());
  };

  const isAllSelected = questions.length ? selectedIds.size === questions.length : false;
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedSkillId !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedSkillId('all');
    setPage(1);
  };

  if (!currentApp) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-12 text-center">
          <p className="text-sm text-gray-500">Select an active app to view Questions.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">
            Error loading questions: {error instanceof Error ? error.message : 'Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="questions-list"
      data-hydration-complete={!isLoading}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <AdminHeader
        title="Question Bank"
        description="Registry of all pedagogical assessment units"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/ai-questions">
              <Button
                variant="outline"
                className="h-10 px-4 rounded-xl border-indigo-100 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                AI Generate
              </Button>
            </Link>
            <Link to="/ai-import">
              <Button
                variant="outline"
                className="h-10 px-4 rounded-xl border-emerald-100 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <DataToolbar
              data={questions as Record<string, unknown>[]}
              columns={QUESTION_COLUMNS}
              entityName="Questions"
              onImport={handleImport}
              importDisabled={false}
            />
            <Link to="/questions/new">
              <Button className="h-10 rounded-xl font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2">
                <Plus className="h-4 w-4" />
                Create Unit
              </Button>
            </Link>
          </div>
        }
      />

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setDeleteConfirmation({ type: 'bulk' })}
        isDeleting={bulkDelete.isPending}
        actions={[
          {
            label: 'Publish',
            onClick: handleMarkPublished,
            icon: bulkUpdateStatus.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null,
          },
          {
            label: 'Go Live',
            onClick: handleMarkLive,
            icon: bulkUpdateStatus.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null,
          },
          {
            label: 'Draft',
            onClick: handleMarkDraft,
            icon: bulkUpdateStatus.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null,
          },
        ]}
      />

      <div className="space-y-8">
        <CurriculumFilterBar
          searchPlaceholder="Search questions..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          count={totalCount}
          countLabel={totalCount === 1 ? 'question' : 'questions'}
          extraFilters={
            <>
              <div className="relative">
                <select
                  aria-label="Filter by skill"
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="h-10 appearance-none pl-4 pr-10 text-xs font-black uppercase tracking-widest rounded-xl border border-indigo-100 bg-white/50 text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer transition-all"
                >
                  <option value="all">Skill Segment: All</option>
                  {skills?.map((skill: { skill_id: string; title: string }) => (
                    <option key={skill.skill_id} value={skill.skill_id}>
                      {skill.title}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400 pointer-events-none" />
              </div>
              {isSuperAdmin ? (
                <div className="relative">
                  <select
                    aria-label="Filter by app"
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className="h-10 appearance-none pl-4 pr-10 text-xs font-black uppercase tracking-widest rounded-xl border border-indigo-100 bg-white/50 text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer transition-all"
                  >
                    <option value="all">App Scope: All</option>
                    {apps.map((app) => (
                      <option key={app.app_id} value={app.app_id}>
                        {app.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : undefined}
              <ColumnToggle
                columns={QUESTION_TOGGLE_COLUMNS}
                visibleColumns={visibleColumns}
                onToggle={(key) =>
                  setVisibleColumns((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  })
                }
              />
            </>
          }
        />

        <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <CardContent className="p-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-8 px-2">
                        <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                      </TableHead>
                      <TableHead className="w-8 px-2">
                        <button
                          onClick={handleSelectAll}
                          aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                          className="text-gray-300 hover:text-gray-500"
                        >
                          {isAllSelected && questions.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-teal-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="px-4">
                        <SortableHeader
                          label="Question"
                          column="content"
                          currentSortBy={sortBy}
                          currentSortOrder={sortOrder}
                          onSort={handleSort}
                        />
                      </TableHead>
                      {visibleColumns.has('type') && (
                        <TableHead>
                          <SortableHeader
                            label="Type"
                            column="type"
                            currentSortBy={sortBy}
                            currentSortOrder={sortOrder}
                            onSort={handleSort}
                          />
                        </TableHead>
                      )}
                      {visibleColumns.has('skill') && (
                        <TableHead>
                          <SortableHeader
                            label="Skill"
                            column="skill_id"
                            currentSortBy={sortBy}
                            currentSortOrder={sortOrder}
                            onSort={handleSort}
                          />
                        </TableHead>
                      )}
                      {visibleColumns.has('points') && (
                        <TableHead className="text-center w-20">
                          <SortableHeader
                            label="Points"
                            column="points"
                            currentSortBy={sortBy}
                            currentSortOrder={sortOrder}
                            onSort={handleSort}
                          />
                        </TableHead>
                      )}
                      {visibleColumns.has('status') && (
                        <TableHead>
                          <SortableHeader
                            label="Status"
                            column="status"
                            currentSortBy={sortBy}
                            currentSortOrder={sortOrder}
                            onSort={handleSort}
                          />
                        </TableHead>
                      )}
                      <TableHead className="text-right px-4 border-l border-gray-100">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {!questions.length ? (
                        <TableRow>
                          <TableCell colSpan={visibleColumns.size + 3} className="py-20">
                            <EmptyState
                              icon={FileText}
                              title={hasActiveFilters ? 'No matches found' : 'No questions yet'}
                              description={
                                hasActiveFilters
                                  ? 'Try adjusting your search or filters.'
                                  : 'Create your first question or use AI to generate them.'
                              }
                              action={
                                hasActiveFilters ? (
                                  <Button
                                    onClick={clearFilters}
                                    className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                                  >
                                    Clear Filters
                                  </Button>
                                ) : (
                                  <Link to="/questions/new">
                                    <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                                      New Question
                                    </Button>
                                  </Link>
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        questions.map((question: QuestionListItem) => (
                          <SortableRow
                            key={question.question_id}
                            question={question}
                            isSelected={selectedIds.has(question.question_id)}
                            onSelect={handleSelectOne}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            isDragDisabled={isDragDisabled}
                            isDuplicating={duplicateQuestion.isPending}
                            visibleColumns={visibleColumns}
                          />
                        ))
                      )}
                    </TableBody>
                  </SortableContext>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-3">
                <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                  {!questions.length ? (
                    <div className="py-12">
                      <EmptyState
                        icon={FileText}
                        title={hasActiveFilters ? 'No matches found' : 'No questions yet'}
                        description={
                          hasActiveFilters
                            ? 'Try adjusting your search or filters.'
                            : 'Create your first question to get started.'
                        }
                        action={
                          hasActiveFilters ? (
                            <Button
                              onClick={clearFilters}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                            >
                              Clear Filters
                            </Button>
                          ) : (
                            <Link to="/questions/new">
                              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                                New Question
                              </Button>
                            </Link>
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question: QuestionListItem) => (
                        <SortableCard
                          key={question.question_id}
                          question={question}
                          isSelected={selectedIds.has(question.question_id)}
                          onSelect={handleSelectOne}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          isDragDisabled={isDragDisabled}
                          isDuplicating={duplicateQuestion.isPending}
                          visibleColumns={visibleColumns}
                        />
                      ))}
                    </div>
                  )}
                </SortableContext>
              </div>
            </DndContext>
          </CardContent>
        </Card>

        {totalCount > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <QuestionDeleteDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        deleteType={deleteConfirmation?.type ?? 'single'}
        selectedCount={selectedIds.size}
        isDeleting={bulkDelete.isPending || deleteQuestion.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

import { AdminHeader } from '@/components/ui/admin-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableHeader } from '@/components/ui/sortable-header';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { useApp } from '@/contexts/AppContext';
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
  Search,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QuestionInsert,
  useBulkCreateQuestions,
  useBulkDeleteQuestions,
  useBulkUpdateQuestionsStatus,
  useDeleteQuestion,
  useDuplicateQuestion,
  usePaginatedQuestions,
  useUpdateQuestionOrder,
} from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';

const QUESTION_COLUMNS: DataColumn[] = [
  { key: 'content', header: 'content' },
  { key: 'type', header: 'type' },
  { key: 'points', header: 'points' },
  { key: 'status', header: 'status' },
  { key: 'options', header: 'options' },
  { key: 'solution', header: 'solution' },
  { key: 'explanation', header: 'explanation' },
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
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: question.question_id,
      disabled: isDragDisabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      boxShadow: isDragging ? '0 8px 32px rgba(99, 102, 241, 0.15)' : undefined,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={cn(
          'hover:bg-indigo-50/20 transition-all group/row border-b border-gray-100/50 last:border-0 relative',
          isSelected && 'bg-indigo-50/30'
        )}
      >
        <td className="pl-8 pr-2 py-5 w-12 relative overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-1 bg-indigo-600 transition-all duration-300',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
            )}
          />
          {!isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="p-2 text-indigo-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none transition-colors"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </button>
          ) : (
            <div className="p-2 text-gray-200">
              <GripVertical className="h-5 w-5" />
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => onSelect(question.question_id)}
            aria-label={isSelected ? 'Deselect question' : 'Select question'}
            className="text-gray-300 hover:text-indigo-600 transition-all duration-300 transform hover:scale-110"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-indigo-600" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
        </td>
        <td className="px-6 py-5 max-w-[450px]">
          <div className="flex flex-col gap-1.5">
            <div
              className="font-bold text-gray-900 text-[15px] tracking-tight line-clamp-2 group-hover/row:text-indigo-700 transition-colors prose-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.content) }}
            />
            {question.skills?.domains?.title && (
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="text-indigo-600">{question.skills.domains.title}</span>
                <span className="text-gray-300">/</span>
                <span>{question.skills.title}</span>
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-5">
          <span className="px-3 py-1.5 bg-white border border-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm group-hover/row:border-indigo-100 group-hover/row:text-indigo-600 transition-all">
            {formatIdentifier(question.type)}
          </span>
        </td>
        <td className="px-4 py-5 text-center">
          <div className="inline-flex flex-col items-center">
            <span className="text-lg font-black text-gray-900 leading-none">{question.points}</span>
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">
              PTS
            </span>
          </div>
        </td>
        <td className="px-4 py-5">
          <StatusBadge
            status={(question.status?.toLowerCase() as StatusType) || 'draft'}
            label={question.status?.toUpperCase()}
          />
        </td>
        <td className="pl-4 pr-10 py-5 text-right">
          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/row:translate-x-0">
            <Link
              to={`/questions/${question.question_id}/edit`}
              className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-2xl transition-all shadow-none hover:shadow-lg hover:shadow-indigo-500/5"
              title="Edit Question"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onDuplicate(question.question_id)}
              disabled={isDuplicating}
              className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-2xl transition-all shadow-none hover:shadow-lg hover:shadow-indigo-500/5 disabled:opacity-50"
              title="Duplicate Question"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(question.question_id)}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100 rounded-2xl transition-all shadow-none hover:shadow-lg hover:shadow-red-500/5"
              title="Delete Question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
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
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: question.question_id,
      disabled: isDragDisabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-white/80 backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500 group/card relative overflow-hidden',
          isSelected
            ? 'border-indigo-400 bg-indigo-50/50 shadow-xl shadow-indigo-500/10'
            : 'border-white/40 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1'
        )}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              {!isDragDisabled ? (
                <button
                  {...attributes}
                  {...listeners}
                  className="p-2.5 text-indigo-300 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none transition-all rounded-xl hover:bg-indigo-50"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-5 w-5" />
                </button>
              ) : (
                <div className="p-2.5 text-gray-200">
                  <GripVertical className="h-5 w-5" />
                </div>
              )}
              <button
                onClick={() => onSelect(question.question_id)}
                className="p-2.5 text-gray-300 hover:text-indigo-600 transition-all rounded-xl hover:bg-indigo-50 transform hover:scale-110"
              >
                {isSelected ? (
                  <CheckSquare className="h-6 w-6 text-indigo-600" />
                ) : (
                  <Square className="h-6 w-6" />
                )}
              </button>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/card:translate-y-0">
              <Link
                to={`/questions/${question.question_id}/edit`}
                className="p-3 rounded-2xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-lg"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDuplicate(question.question_id)}
                disabled={isDuplicating}
                className="p-3 rounded-2xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(question.question_id)}
                className="p-3 rounded-2xl bg-white border border-gray-100 text-red-500 hover:bg-red-50 transition-all shadow-sm hover:shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-w-0">
            <div
              className="font-black text-gray-900 text-lg tracking-tight leading-relaxed mb-4 line-clamp-3 prose-sm"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.content) }}
            />
            <div className="space-y-3">
              {question.skills?.domains?.title && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-100 rounded-lg font-black text-[9px] uppercase tracking-widest px-2 py-0.5"
                  >
                    {question.skills.domains.title}
                  </Badge>
                  <span className="text-gray-300 text-xs italic">/</span>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg font-black text-[9px] uppercase tracking-widest px-2 py-0.5"
                  >
                    {question.skills.title}
                  </Badge>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 bg-white border border-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {formatIdentifier(question.type)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100/50">
            <StatusBadge
              status={(question.status?.toLowerCase() as StatusType) || 'draft'}
              label={question.status?.toUpperCase()}
            />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-gray-900 leading-none">
                  {question.points}
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                  WEIGHT
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle card glow */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
      </div>
    );
  }
);

export function QuestionList() {
  const { currentApp } = useApp();
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

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
  } = usePaginatedQuestions({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    skillId: selectedSkillId,
    sortBy,
    sortOrder,
  });
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

  const questions = useMemo(() => paginatedData?.data ?? [], [paginatedData?.data]);
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

  const confirmExecution = async () => {
    if (!deleteConfirmation) return;
    try {
      if (deleteConfirmation.type === 'bulk') {
        await bulkDelete.mutateAsync(Array.from(selectedIds));
        showToast(`${selectedIds.size} question(s) purged`, 'success');
        setSelectedIds(new Set());
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteQuestion.mutateAsync(deleteConfirmation.id);
        showToast('Question purged successfully', 'success');
      }
    } catch {
      showToast('Failed to execute purge operation', 'error');
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
    if (selectedSkillId === 'all') {
      toast({
        title: 'Skill selection required',
        description:
          'Please select a specific skill filter before importing to assign questions to that skill.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const questionsToImport = data.map((item, index) => {
        const parseField = (field: unknown) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch {
              return {};
            }
          }
          return field || {};
        };

        return {
          app_id: currentApp?.app_id || '',
          content: String(item.content || ''),
          type: (item.type || 'multiple_choice') as QuestionInsert['type'],
          points: parseInt(item.points as string) || 1,
          status: (item.status || 'draft') as QuestionInsert['status'],
          options: parseField(item.options),
          solution: parseField(item.solution),
          explanation: String(item.explanation || ''),
          skill_id: selectedSkillId,
          sort_order: (paginatedData?.totalCount ?? 0) + index + 1,
        };
      });

      await bulkCreate.mutateAsync(questionsToImport as QuestionInsert[]);
      showToast(`Successfully imported ${questionsToImport.length} questions`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      showToast('Failed to import questions. Check console for details.', 'error');
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-white/50 backdrop-blur-md rounded-[2.5rem] p-12 border border-white/20 shadow-xl">
          <p className="text-gray-500 font-black italic uppercase tracking-widest">
            Select an active app to access Question Registry
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
        <AdminHeader
          title="Question Registry"
          description="Clustering evaluation assets for mission-critical curriculum delivery."
          icon={FileText}
          breadcrumbs={[
            { label: 'Curriculum', href: '/domains' },
            { label: 'Questions', href: '/questions' },
          ]}
        />

        {/* Skeleton Filter Bar */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
          <Skeleton className="h-14 flex-1 rounded-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden">
          <div className="p-8 space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-6 pb-6 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-16 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 text-center">
        <p className="text-red-700 font-bold">
          Error loading questions:{' '}
          {error instanceof Error ? error.message : 'Unknown connectivity issue'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title="Question Registry"
        description="Clustering high-availability evaluation assets for mission-critical curriculum delivery."
        icon={FileText}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Questions', href: '/questions' },
        ]}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/ai-questions">
              <Button
                variant="outline"
                className="h-12 px-8 rounded-2xl bg-white/50 backdrop-blur-md border border-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/5 transition-all hover:-translate-y-1 hover:bg-white gap-3 group"
              >
                <Sparkles className="h-4 w-4 text-indigo-500 group-hover:rotate-12 transition-transform" />
                <span>AI Accelerator</span>
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
              <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 gap-3">
                <Plus className="h-5 w-5" />
                <span>Initialize Asset</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Premium Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-6 flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Query curriculum assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-12 rounded-[1.25rem] border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 placeholder:italic focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
          />
          {searchQuery && (
            <button
              onClick={clearFilters}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0 w-full lg:w-auto">
          <div className="flex items-center gap-3 px-5 py-3 bg-white/50 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Skill
            </span>
            <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
              <SelectTrigger
                aria-label="Filter by skill"
                className="w-auto h-auto border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-tight italic gap-2"
              >
                <SelectValue placeholder="All Clusters" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90">
                <SelectItem value="all" className="font-black italic">
                  ALL CLUSTERS
                </SelectItem>
                {skills?.map((skill: { skill_id: string; title: string }) => (
                  <SelectItem key={skill.skill_id} value={skill.skill_id} className="font-bold">
                    {skill.title.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-white/50 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Status
            </span>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'published' | 'live')}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="w-auto h-auto border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-tight italic gap-2"
              >
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90">
                <SelectItem value="all" className="font-black italic">
                  ALL STATES
                </SelectItem>
                <SelectItem value="draft" className="font-bold">
                  DRAFT
                </SelectItem>
                <SelectItem value="published" className="font-bold">
                  PUBLISHED
                </SelectItem>
                <SelectItem value="live" className="font-bold">
                  LIVE
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="px-5 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-3">
            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">
              Assets
            </span>
            <span className="text-sm font-black tracking-tight">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-24 z-30 flex items-center justify-between p-3 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl shadow-indigo-600/20 animate-in slide-in-from-top-8 duration-500 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">{selectedIds.size}</span>
            </div>
            <span className="text-white/70 font-black text-[10px] uppercase tracking-widest group-hover:text-white transition-colors">
              Clustered Operations
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkPublished}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all"
            >
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkLive}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all"
            >
              Go Live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkDraft}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all"
            >
              Draft
            </Button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmation({ type: 'bulk' })}
              className="h-10 px-4 rounded-xl text-red-400 font-black text-[9px] uppercase tracking-[0.15em] hover:bg-red-500 hover:text-white transition-all gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Purge
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b-2 border-gray-100">
                <tr>
                  <th className="w-12 h-14 pl-6 pr-2 font-black text-[10px] uppercase tracking-widest text-gray-600"></th>
                  <th className="w-12 h-14 px-4">
                    <button
                      onClick={handleSelectAll}
                      aria-label={isAllSelected ? 'Deselect all questions' : 'Select all questions'}
                      className="text-gray-300 hover:text-indigo-600 transition-colors"
                    >
                      {isAllSelected && questions.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="h-14 px-6 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Question Content"
                      column="content"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Asset Type"
                      column="type"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-default">
                      <Filter className="h-3 w-3" />
                      Target Skill
                    </div>
                  </th>
                  <th className="h-14 px-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Weight"
                      column="points"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px] justify-center"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Status"
                      column="status"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 pl-4 pr-10 text-right font-black text-[10px] uppercase tracking-widest text-gray-600">
                    Execution
                  </th>
                </tr>
              </thead>
              <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {!questions.length ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-24 text-center">
                        <EmptyState
                          icon={FileText}
                          title={hasActiveFilters ? 'No matches found' : 'Registry empty'}
                          description={
                            hasActiveFilters
                              ? 'Adjust your search parameters or skill focus.'
                              : 'The question cluster is empty. Use AI generation or manual creation to populate it.'
                          }
                          action={
                            hasActiveFilters ? (
                              <Button
                                onClick={clearFilters}
                                className="rounded-full px-8 shadow-md"
                              >
                                Clear filters
                              </Button>
                            ) : (
                              <Button
                                onClick={() => (window.location.href = '/questions/new')}
                                className="rounded-full px-8 shadow-md"
                              >
                                New Question
                              </Button>
                            )
                          }
                        />
                      </td>
                    </tr>
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
                      />
                    ))
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4">
            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
              {!questions.length ? (
                <div className="rounded-[2.5rem] border border-dashed border-gray-200 p-12 bg-white/30 backdrop-blur-md">
                  <EmptyState
                    icon={FileText}
                    title={hasActiveFilters ? 'No matches found' : 'Registry empty'}
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your focus.'
                        : 'Start adding assets to your library.'
                    }
                    action={
                      hasActiveFilters ? (
                        <Button onClick={clearFilters} className="rounded-full px-8 shadow-md">
                          Clear filters
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
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
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </DndContext>

        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight italic">
              Confirm Purge
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              {deleteConfirmation?.type === 'bulk'
                ? `You are about to permanently purge ${selectedIds.size} questions from the registry. This operation cannot be reversed.`
                : 'This asset will be permanently removed from the curriculum engine. Are you sure you want to proceed?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 italic transition-all border-none">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExecution}
              disabled={bulkDelete.isPending || deleteQuestion.isPending}
              className="h-12 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
            >
              {(bulkDelete.isPending || deleteQuestion.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

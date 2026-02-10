import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import { 
    usePaginatedQuestions, 
    useDeleteQuestion, 
    useDuplicateQuestion, 
    useUpdateQuestionOrder, 
    useBulkDeleteQuestions, 
    useBulkUpdateQuestionsStatus,
    useBulkCreateQuestions,
    QuestionInsert
} from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIdentifier } from '@/lib/format-utils';
import type { DataColumn } from '@/lib/data-utils';
import type { QuestionListItem } from '@/types/common.types';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  X,
  GripVertical,
  Sparkles,
  CheckSquare,
  Square,
  Trash2,
  FileText,
  Filter,
  Pencil,
  Copy
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableRow({ question, isSelected, onSelect, onDelete, onDuplicate, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.question_id, disabled: isDragDisabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-indigo-50/30 transition-all group/row border-b border-gray-50 last:border-0 relative">
            <td className="pl-6 pr-2 py-4 w-12 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-indigo-600 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                {!isDragDisabled ? (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-2 text-indigo-400/50 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none transition-colors"
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
                <button onClick={() => onSelect(question.question_id)} className="text-gray-300 hover:text-indigo-600 transition-colors">
                    {isSelected ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                </button>
            </td>
            <td className="px-6 py-4 max-w-[400px]">
                <div 
                    className="font-bold text-gray-900 text-sm tracking-tight line-clamp-2 group-hover/row:text-indigo-700 transition-colors prose-sm"
                    dangerouslySetInnerHTML={{ __html: question.content }}
                />
            </td>
            <td className="px-4 py-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                    {formatIdentifier(question.type)}
                </span>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700 leading-tight truncate max-w-[150px]">{question.skills?.title || 'ORPHAN'}</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-60">SKILL</span>
                </div>
            </td>
            <td className="px-4 py-4 text-center">
                 <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-orange-100 text-orange-700 font-black text-xs border border-orange-200 shadow-sm">
                    {question.points}
                </span>
            </td>
            <td className="px-4 py-4">
                <StatusBadge 
                    status={question.status?.toLowerCase() as StatusType || 'draft'} 
                    label={question.status?.toUpperCase()}
                />
            </td>
            <td className="pl-4 pr-8 py-3 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <Link
                        to={`/questions/${question.question_id}/edit`}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Question"
                    >
                        <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                        onClick={() => onDuplicate(question.question_id)}
                        disabled={isDuplicating}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                        title="Duplicate Question"
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(question.question_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Question"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SortableCard({ question, isSelected, onSelect, onDelete, onDuplicate, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.question_id, disabled: isDragDisabled });

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
                "bg-white/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 group/card",
                isSelected ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10' : 'border-white/40 hover:border-indigo-200 hover:shadow-lg'
            )}
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
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
                        <button
                            onClick={() => onSelect(question.question_id)}
                            className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                        >
                            {isSelected ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                        </button>
                    </div>
                     <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <Link
                            to={`/questions/${question.question_id}/edit`}
                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                        >
                            <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={() => onDuplicate(question.question_id)}
                            disabled={isDuplicating}
                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(question.question_id)}
                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="min-w-0">
                    <div 
                        className="font-bold text-gray-900 text-[15px] tracking-tight leading-relaxed mb-3 line-clamp-3 prose-sm"
                        dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                         <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                            {formatIdentifier(question.type)}
                        </span>
                        {question.skills?.title && (
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">
                                SKILL: {question.skills.title.substring(0, 15)}...
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                     <StatusBadge 
                        status={question.status?.toLowerCase() as StatusType || 'draft'} 
                        label={question.status?.toUpperCase()}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</span>
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-orange-100 text-orange-700 font-black text-xs border border-orange-200">
                             {question.points}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'single' | 'bulk', id?: string } | null>(null);

    const { data: paginatedData, isLoading, isError, error } = usePaginatedQuestions({
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
    
    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        toast({
            title,
            variant: type === 'error' ? 'destructive' : 'default',
        });
    };

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

    const questionIds = useMemo(() => questions.map((q: QuestionListItem) => q.question_id), [questions]);

    const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all' || selectedSkillId !== 'all' || sortBy !== 'sort_order';

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

    const handleSelectAll = () => {
        if (selectedIds.size === questions.length && questions.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map((q: QuestionListItem) => q.question_id)));
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

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
            await bulkUpdateStatus.mutateAsync({ question_ids: Array.from(selectedIds), status: 'draft' });
            showToast(`${selectedIds.size} question(s) marked as draft`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update questions', 'error');
        }
    };

    const handleMarkPublished = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ question_ids: Array.from(selectedIds), status: 'published' });
            showToast(`${selectedIds.size} question(s) marked as published`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update questions', 'error');
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmation({ type: 'single', id });
    };

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

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateQuestion.mutateAsync(id);
            showToast('Question duplicated', 'success');
        } catch {
            showToast('Failed to duplicate question', 'error');
        }
    };

    const handleImport = async (data: Record<string, unknown>[]) => {
        if (!currentApp) return;
        if (selectedSkillId === 'all') {
            toast({
                title: 'Skill selection required',
                description: 'Please select a specific skill filter before importing to assign questions to that skill.',
                variant: 'destructive'
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
                    sort_order: (paginatedData?.totalCount ?? 0) + index + 1
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
                    <p className="text-gray-500 font-black italic uppercase tracking-widest">Select an active app to access Question Registry</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminHeader 
                    title="Question Library"
                    description="Manage and organize your curriculum questions by type, skill, and difficulty."
                    icon={FileText}
                    breadcrumbs={[
                        { label: 'Curriculum', href: '/domains' },
                        { label: 'Questions', href: '/questions' }
                    ]}
                />
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 p-8 space-y-4">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isError) {
         return (
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 text-center">
                <p className="text-red-700 font-bold">Error loading questions: {error instanceof Error ? error.message : 'Unknown connectivity issue'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AdminHeader 
                title="Question Registry"
                description="Manage and optimize the high-availability curriculum questions and evaluation assets."
                icon={FileText}
                breadcrumbs={[
                    { label: 'Curriculum', href: '/domains' },
                    { label: 'Questions', href: '/questions' }
                ]}
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link to="/ai-questions">
                            <Button variant="outline" className="h-12 px-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5 gap-2 group">
                                <Sparkles className="h-4 w-4 text-purple-500 group-hover:rotate-12 transition-transform" />
                                <span>AI Generator</span>
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
                            <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 gap-2">
                                <Plus className="h-4 w-4" />
                                <span>New Question</span>
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Premium Filter Bar */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search question content, solutions, or explanations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearFilters}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <Filter className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">Skill:</span>
                        <Select
                            value={selectedSkillId}
                            onValueChange={setSelectedSkillId}
                        >
                            <SelectTrigger className="w-auto h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-indigo-700 hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                <SelectValue placeholder="All Skills" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90">
                                <SelectItem value="all">ALL SKILLS</SelectItem>
                                {skills?.map((skill: { skill_id: string; title: string }) => (
                                    <SelectItem key={skill.skill_id} value={skill.skill_id}>{skill.title.toUpperCase()}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">Status:</span>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'published' | 'live')}
                        >
                            <SelectTrigger className="w-auto h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-indigo-700 hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/20 backdrop-blur-xl bg-white/90">
                                <SelectItem value="all">ALL STATUS</SelectItem>
                                <SelectItem value="draft">DRAFT</SelectItem>
                                <SelectItem value="published">PUBLISHED</SelectItem>
                                <SelectItem value="live">LIVE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Assets:</span>
                         <span className="text-sm font-black text-indigo-700 tracking-tight">{totalCount} CLUSTERED</span>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 pl-4">
                        <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{selectedIds.size} SELECTED FOR BATCH OPERATIONS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkPublished}
                             className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
                        >
                            Publish
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkLive}
                             className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
                        >
                            Go Live
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkDraft}
                             className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10"
                        >
                            Draft
                        </Button>
                        <div className="w-px h-6 bg-white/20 mx-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                            className="h-10 px-4 rounded-xl text-red-200 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Purge
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b-2 border-gray-100">
                                <tr>
                                    <th className="w-12 h-14 pl-6 pr-2 font-black text-[10px] uppercase tracking-widest text-gray-400"></th>
                                    <th className="w-12 h-14 px-4">
                                        <button onClick={handleSelectAll} className="text-gray-300 hover:text-indigo-600 transition-colors">
                                            {isAllSelected && questions.length > 0 ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </th>
                                    <th className="h-14 px-6 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">
                                        <SortableHeader
                                            label="Question Content"
                                            column="content"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                            className="text-[10px]"
                                        />
                                    </th>
                                    <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">
                                         <SortableHeader
                                            label="Asset Type"
                                            column="type"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                            className="text-[10px]"
                                        />
                                    </th>
                                    <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">Target Skill</th>
                                    <th className="h-14 px-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-400">
                                        <SortableHeader
                                            label="Weight"
                                            column="points"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                            className="text-[10px] justify-center"
                                        />
                                    </th>
                                    <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="h-14 pl-4 pr-8 text-right font-black text-[10px] uppercase tracking-widest text-gray-400">Execution</th>
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
                                                    description={hasActiveFilters ? 'Adjust your search parameters or skill focus.' : 'The question cluster is empty. Use AI generation or manual creation to populate it.'}
                                                    action={
                                                        hasActiveFilters ? {
                                                            label: "Clear filters",
                                                            onClick: clearFilters
                                                        } : {
                                                            label: "New Question",
                                                            onClick: () => (window.location.href = "/questions/new")
                                                        }
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
                                <div className="rounded-[2rem] border border-dashed border-gray-200 p-12 bg-white/30 backdrop-blur-md">
                                    <EmptyState
                                        icon={FileText}
                                        title={hasActiveFilters ? 'No matches found' : 'Registry empty'}
                                        description={hasActiveFilters ? 'Try adjusting your focus.' : 'Start adding assets to your library.'}
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

            <AlertDialog open={Boolean(deleteConfirmation)} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-10 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight italic">Confirm Purge</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 font-medium">
                            {deleteConfirmation?.type === 'bulk' 
                                ? `You are about to permanently purge ${selectedIds.size} questions from the registry. This operation cannot be reversed.` 
                                : "This asset will be permanently removed from the curriculum engine. Are you sure you want to proceed?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 italic transition-all border-none">Abort</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmExecution}
                            className="h-12 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
                        >
                            Confirm Purge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

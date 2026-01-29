/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { usePaginatedQuestions, useDeleteQuestion, useBulkDeleteQuestions, useBulkUpdateQuestionsStatus, useDuplicateQuestion, useUpdateQuestionOrder } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { DataColumn } from '@/lib/data-utils';
import { Plus, CheckSquare, Square, Search, X, Trash, FileText, GripVertical } from 'lucide-react';

const QUESTION_COLUMNS: DataColumn[] = [
    { key: 'content', header: 'content' },
    { key: 'type', header: 'type' },
    { key: 'skills', header: 'skill_title', transform: (v: unknown) => (v as { title?: string } | null)?.title ?? '' },
    { key: 'points', header: 'points' },
    { key: 'sort_order', header: 'sort_order' },
    { key: 'status', header: 'status' },
];
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

const DEFAULT_PAGE_SIZE = 10;

interface Question {
    id: string;
    content: string;
    type: string;
    points: number;
    sort_order: number;
    status?: string;
    skills?: { title: string; domains: { title: string } | null } | null;
}

interface SortableRowProps {
    question: Question;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    renderStatusBadge: (status: string) => JSX.Element;
    isDragDisabled: boolean;
    isDuplicating: boolean;
}

function SortableRow({ question, isSelected, onSelect, onDelete, onDuplicate, renderStatusBadge, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id, disabled: isDragDisabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
        backgroundColor: isDragging ? '#f9fafb' : undefined,
        position: 'relative' as const,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-50 transition-colors">
            <td className="px-2 py-4 w-10">
                {!isDragDisabled ? (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
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
            <td className="px-4 py-4">
                <button onClick={() => onSelect(question.id)} className="text-gray-400 hover:text-gray-600">
                    {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                </button>
            </td>
            <td className="px-6 py-4 max-w-[300px]">
                <span className="font-medium text-gray-900 truncate block">{question.content}</span>
            </td>
            <td className="px-6 py-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                    {question.type}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-gray-700">{question.skills?.title}</span>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">
                    {question.points}
                </span>
            </td>
            <td className="px-6 py-4">
                {renderStatusBadge(question.status || 'draft')}
            </td>
            <td className="px-6 py-4">
                {!question.skills ? (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        Yes
                    </span>
                ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        No
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Link
                        to={`/questions/${question.id}/edit`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => onDuplicate(question.id)}
                        disabled={isDuplicating}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        Duplicate
                    </button>
                    <button
                        onClick={() => onDelete(question.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SortableCard({ question, isSelected, onSelect, onDelete, onDuplicate, renderStatusBadge, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id, disabled: isDragDisabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 16px rgba(0, 0, 0, 0.15)' : undefined,
        position: 'relative' as const,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-xl border ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'} p-4 space-y-3 transition-colors`}
        >
            <div className="flex items-start gap-3">
                {!isDragDisabled ? (
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                        aria-label="Drag to reorder"
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="p-2 text-gray-200 flex-shrink-0">
                        <GripVertical className="h-5 w-5" />
                    </div>
                )}
                <button
                    onClick={() => onSelect(question.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2">{question.content}</p>
                </div>
                <div className="flex-shrink-0">
                    {renderStatusBadge(question.status || 'draft')}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                    {question.type}
                </span>
                {question.skills?.title && (
                    <span className="text-gray-600 text-xs">
                        Skill: <span className="font-medium">{question.skills.title}</span>
                    </span>
                )}
                <span className="inline-flex items-center gap-1 text-gray-600">
                    <span className="text-xs">Points:</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-700 font-semibold text-xs">
                        {question.points}
                    </span>
                </span>
                {!question.skills && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Orphan
                    </span>
                )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Link
                    to={`/questions/${question.id}/edit`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                    Edit
                </Link>
                <button
                    onClick={() => onDuplicate(question.id)}
                    disabled={isDuplicating}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                    Duplicate
                </button>
                <button
                    onClick={() => onDelete(question.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export function QuestionList() {
    const [selectedSkillId, setSelectedSkillId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<string>('sort_order');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { data: paginatedData, isLoading } = usePaginatedQuestions({
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
    const { showToast } = useToast();

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

    const questions = paginatedData?.data ?? [];
    const totalCount = paginatedData?.totalCount ?? 0;
    const totalPages = paginatedData?.totalPages ?? 1;

    const questionIds = useMemo(() => questions.map((q: any) => q.id), [questions]);

    const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all' || selectedSkillId !== 'all' || sortBy !== 'sort_order';

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q: any) => q.id === active.id);
            const newIndex = questions.findIndex((q: any) => q.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);

                const updates = reorderedQuestions.map((question: any, index: number) => ({
                    id: question.id,
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
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map((q: any) => q.id)));
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

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.size} question(s)?`)) {
            try {
                await bulkDelete.mutateAsync(Array.from(selectedIds));
                showToast(`${selectedIds.size} question(s) deleted`, 'success');
                setSelectedIds(new Set());
            } catch {
                showToast('Failed to delete questions', 'error');
            }
        }
    };

    const handleMarkLive = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'live' });
            showToast(`${selectedIds.size} question(s) marked as live`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update questions', 'error');
        }
    };

    const handleMarkDraft = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'draft' });
            showToast(`${selectedIds.size} question(s) marked as draft`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update questions', 'error');
        }
    };

    const handleMarkPublished = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'published' });
            showToast(`${selectedIds.size} question(s) marked as published (ready for release)`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update questions', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this question?')) {
            try {
                await deleteQuestion.mutateAsync(id);
                showToast('Question deleted', 'success');
            } catch {
                showToast('Failed to delete question', 'error');
            }
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

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Live
                    </span>
                );
            case 'published':
                return (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        Published
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        Draft
                    </span>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading questions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Questions</h2>
                    <p className="mt-1 text-sm md:text-base text-gray-500">Manage curriculum questions</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <DataToolbar
                        data={questions as any[]}
                        columns={QUESTION_COLUMNS}
                        entityName="Questions"
                        importDisabled={true}
                        importDisabledMessage="Question import is not available. Please create questions manually."
                    />
                    <Link
                        to="/questions/new"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Question</span>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
                <div className="space-y-3 md:space-y-4 mb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                                <span>Clear filters</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
                            <label className="text-sm font-medium text-gray-600">Skill:</label>
                            <select
                                value={selectedSkillId}
                                onChange={(e) => setSelectedSkillId(e.target.value)}
                                className="px-3 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base w-full sm:w-auto sm:min-w-[200px]"
                            >
                                <option value="all">All Skills</option>
                                {skills?.map((skill: any) => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
                            <label className="text-sm font-medium text-gray-600">Status:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'live')}
                                className="px-3 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base w-full sm:w-auto"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="live">Live</option>
                            </select>
                        </div>

                        {selectedIds.size > 0 && (
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                                <span className="text-sm text-gray-600 w-full sm:w-auto">{selectedIds.size} selected</span>
                                <button
                                    onClick={handleMarkPublished}
                                    disabled={bulkUpdateStatus.isPending}
                                    className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex-1 sm:flex-none"
                                >
                                    Mark Published
                                </button>
                                <button
                                    onClick={handleMarkLive}
                                    disabled={bulkUpdateStatus.isPending}
                                    className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex-1 sm:flex-none"
                                >
                                    Mark Live
                                </button>
                                <button
                                    onClick={handleMarkDraft}
                                    disabled={bulkUpdateStatus.isPending}
                                    className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex-1 sm:flex-none"
                                >
                                    Mark Draft
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkDelete.isPending}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* @ts-expect-error - Known React types version mismatch with @dnd-kit */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-2 py-4 w-10">
                                        {!isDragDisabled ? (
                                            <span className="text-gray-400">
                                                <GripVertical className="h-5 w-5" />
                                            </span>
                                        ) : null}
                                    </th>
                                    <th className="text-left px-4 py-4 w-10">
                                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                                            {isAllSelected && questions.length > 0 ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Content"
                                            column="content"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Type"
                                            column="type"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Skill</th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Points"
                                            column="points"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Status"
                                            column="status"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Orphan</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!questions.length ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                    <FileText className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 mb-4">
                                                    {hasActiveFilters ? 'No questions match your filters.' : 'No questions found. Create one to get started.'}
                                                </p>
                                                {hasActiveFilters ? (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Clear filters
                                                    </button>
                                                ) : (
                                                    <Link
                                                        to="/questions/new"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Create Question
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                                        {questions.map((question: any) => (
                                            <SortableRow
                                                key={question.id}
                                                question={question}
                                                isSelected={selectedIds.has(question.id)}
                                                onSelect={handleSelectOne}
                                                onDelete={handleDelete}
                                                onDuplicate={handleDuplicate}
                                                renderStatusBadge={renderStatusBadge}
                                                isDragDisabled={isDragDisabled}
                                                isDuplicating={duplicateQuestion.isPending}
                                            />
                                        ))}
                                    </SortableContext>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                            {!questions.length ? (
                                <div className="rounded-xl border border-gray-100 p-8 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 mb-4">
                                            {hasActiveFilters ? 'No questions match your filters.' : 'No questions found. Create one to get started.'}
                                        </p>
                                        {hasActiveFilters ? (
                                            <button
                                                onClick={clearFilters}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                                Clear filters
                                            </button>
                                        ) : (
                                            <Link
                                                to="/questions/new"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Question
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {questions.map((question: any) => (
                                        <SortableCard
                                            key={question.id}
                                            question={question}
                                            isSelected={selectedIds.has(question.id)}
                                            onSelect={handleSelectOne}
                                            onDelete={handleDelete}
                                            onDuplicate={handleDuplicate}
                                            renderStatusBadge={renderStatusBadge}
                                            isDragDisabled={isDragDisabled}
                                            isDuplicating={duplicateQuestion.isPending}
                                        />
                                    ))}
                                </div>
                            )}
                        </SortableContext>
                    </div>
                </DndContext>

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
    );
}

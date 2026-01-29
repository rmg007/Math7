/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { usePaginatedSkills, useDeleteSkill, useBulkDeleteSkills, useBulkUpdateSkillsStatus, useDuplicateSkill, useUpdateSkillOrder } from '../hooks/use-skills';
import { useDomains } from '../hooks/use-domains';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { DataColumn } from '@/lib/data-utils';
import { Plus, CheckSquare, Square, Search, X, Trash, Layers, GripVertical } from 'lucide-react';

const SKILL_COLUMNS: DataColumn[] = [
    { key: 'title', header: 'title' },
    { key: 'slug', header: 'slug' },
    { key: 'domains', header: 'domain_title', transform: (v: unknown) => (v as { title?: string } | null)?.title ?? '' },
    { key: 'difficulty_level', header: 'difficulty_level' },
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

interface Skill {
    id: string;
    title: string;
    slug: string;
    sort_order: number;
    status?: string;
    difficulty_level?: number;
    domain_id?: string;
    domains?: { title: string } | null;
}

interface SortableRowProps {
    skill: Skill;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    renderStatusBadge: (status: string) => JSX.Element;
    isDragDisabled: boolean;
    isDuplicating: boolean;
}

function SortableRow({ skill, isSelected, onSelect, onDelete, onDuplicate, renderStatusBadge, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: skill.id, disabled: isDragDisabled });

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
                <button onClick={() => onSelect(skill.id)} className="text-gray-400 hover:text-gray-600">
                    {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                </button>
            </td>
            <td className="px-6 py-4">
                <div>
                    <span className="font-medium text-gray-900">{skill.title}</span>
                    <p className="text-sm text-gray-500">{skill.slug}</p>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {skill.domains?.title}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm">
                    {skill.difficulty_level}
                </span>
            </td>
            <td className="px-6 py-4">
                {renderStatusBadge(skill.status || 'draft')}
            </td>
            <td className="px-6 py-4">
                {!skill.domains ? (
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
                        to={`/skills/${skill.id}/edit`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => onDuplicate(skill.id)}
                        disabled={isDuplicating}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                        Duplicate
                    </button>
                    <button
                        onClick={() => onDelete(skill.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SortableCard({ skill, isSelected, onSelect, onDelete, onDuplicate, renderStatusBadge, isDragDisabled, isDuplicating }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: skill.id, disabled: isDragDisabled });

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
                    onClick={() => onSelect(skill.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{skill.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{skill.slug}</p>
                </div>
                <div className="flex-shrink-0">
                    {renderStatusBadge(skill.status || 'draft')}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                {skill.domains?.title && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {skill.domains.title}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 text-gray-600">
                    <span className="text-xs">Difficulty:</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                        {skill.difficulty_level}
                    </span>
                </span>
                {!skill.domains && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Orphan
                    </span>
                )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Link
                    to={`/skills/${skill.id}/edit`}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                    Edit
                </Link>
                <button
                    onClick={() => onDuplicate(skill.id)}
                    disabled={isDuplicating}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                    Duplicate
                </button>
                <button
                    onClick={() => onDelete(skill.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export function SkillList() {
    const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<string>('sort_order');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { data: paginatedData, isLoading } = usePaginatedSkills({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        domainId: selectedDomainId,
        sortBy,
        sortOrder,
    });
    const { data: domains } = useDomains();
    const deleteSkill = useDeleteSkill();
    const bulkDelete = useBulkDeleteSkills();
    const bulkUpdateStatus = useBulkUpdateSkillsStatus();
    const duplicateSkill = useDuplicateSkill();
    const updateSkillOrder = useUpdateSkillOrder();
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
    }, [selectedDomainId, statusFilter]);

    const skills = paginatedData?.data ?? [];
    const totalCount = paginatedData?.totalCount ?? 0;
    const totalPages = paginatedData?.totalPages ?? 1;

    const skillIds = useMemo(() => skills.map((s: any) => s.id), [skills]);

    const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all' || selectedDomainId !== 'all' || sortBy !== 'sort_order';

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = skills.findIndex((s: any) => s.id === active.id);
            const newIndex = skills.findIndex((s: any) => s.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedSkills = arrayMove(skills, oldIndex, newIndex);

                const updates = reorderedSkills.map((skill: any, index: number) => ({
                    id: skill.id,
                    sort_order: index + 1 + (page - 1) * pageSize,
                }));

                try {
                    await updateSkillOrder.mutateAsync(updates);
                    showToast('Skill order updated', 'success');
                } catch {
                    showToast('Failed to update skill order', 'error');
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
        if (selectedIds.size === skills.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(skills.map((s: any) => s.id)));
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
        if (confirm(`Are you sure you want to delete ${selectedIds.size} skill(s)?`)) {
            try {
                await bulkDelete.mutateAsync(Array.from(selectedIds));
                showToast(`${selectedIds.size} skill(s) deleted`, 'success');
                setSelectedIds(new Set());
            } catch {
                showToast('Failed to delete skills', 'error');
            }
        }
    };

    const handleMarkLive = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'live' });
            showToast(`${selectedIds.size} skill(s) marked as live`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update skills', 'error');
        }
    };

    const handleMarkDraft = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'draft' });
            showToast(`${selectedIds.size} skill(s) marked as draft`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update skills', 'error');
        }
    };

    const handleMarkPublished = async () => {
        if (selectedIds.size === 0) return;
        try {
            await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'published' });
            showToast(`${selectedIds.size} skill(s) marked as published (ready for release)`, 'success');
            setSelectedIds(new Set());
        } catch {
            showToast('Failed to update skills', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this skill?')) {
            try {
                await deleteSkill.mutateAsync(id);
                showToast('Skill deleted', 'success');
            } catch {
                showToast('Failed to delete skill', 'error');
            }
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await duplicateSkill.mutateAsync(id);
            showToast('Skill duplicated', 'success');
        } catch {
            showToast('Failed to duplicate skill', 'error');
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

    const isAllSelected = skills.length ? selectedIds.size === skills.length : false;
    const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedDomainId !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSelectedDomainId('all');
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
                    <p className="mt-4 text-gray-500">Loading skills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Skills</h2>
                    <p className="mt-1 text-sm md:text-base text-gray-500">Manage learning skills</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <DataToolbar
                        data={skills as any[]}
                        columns={SKILL_COLUMNS}
                        entityName="Skills"
                        importDisabled={true}
                        importDisabledMessage="Skill import is not available. Please create skills manually."
                    />
                    <Link
                        to="/skills/new"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Skill</span>
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
                                placeholder="Search skills..."
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
                            <label className="text-sm font-medium text-gray-600">Domain:</label>
                            <select
                                value={selectedDomainId}
                                onChange={(e) => setSelectedDomainId(e.target.value)}
                                className="px-3 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base w-full sm:w-auto"
                            >
                                <option value="all">All Domains</option>
                                {domains?.map(domain => (
                                    <option key={domain.id} value={domain.id}>{domain.title}</option>
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

                        {isDragDisabled && sortBy === 'sort_order' && (
                            <span className="text-xs md:text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                Clear filters to enable drag reordering
                            </span>
                        )}

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

                {/* @ts-expect-error - React types version mismatch with @dnd-kit */}
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
                                        <span className="sr-only">Drag handle</span>
                                    </th>
                                    <th className="text-left px-4 py-4 w-10">
                                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                                            {isAllSelected && skills.length > 0 ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Title"
                                            column="title"
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Domain</th>
                                    <th className="text-left px-6 py-4">
                                        <SortableHeader
                                            label="Difficulty"
                                            column="difficulty_level"
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
                            <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                                <tbody className="divide-y divide-gray-100">
                                    {!skills.length ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                        <Layers className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 mb-4">
                                                        {hasActiveFilters ? 'No skills match your filters.' : 'No skills found. Create one to get started.'}
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
                                                            to="/skills/new"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Create Skill
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        skills.map((skill: any) => (
                                            <SortableRow
                                                key={skill.id}
                                                skill={skill}
                                                isSelected={selectedIds.has(skill.id)}
                                                onSelect={handleSelectOne}
                                                onDelete={handleDelete}
                                                onDuplicate={handleDuplicate}
                                                renderStatusBadge={renderStatusBadge}
                                                isDragDisabled={isDragDisabled}
                                                isDuplicating={duplicateSkill.isPending}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </SortableContext>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                            {!skills.length ? (
                                <div className="rounded-xl border border-gray-100 p-8 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <Layers className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 mb-4">
                                            {hasActiveFilters ? 'No skills match your filters.' : 'No skills found. Create one to get started.'}
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
                                                to="/skills/new"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Skill
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {skills.map((skill: any) => (
                                        <SortableCard
                                            key={skill.id}
                                            skill={skill}
                                            isSelected={selectedIds.has(skill.id)}
                                            onSelect={handleSelectOne}
                                            onDelete={handleDelete}
                                            onDuplicate={handleDuplicate}
                                            renderStatusBadge={renderStatusBadge}
                                            isDragDisabled={isDragDisabled}
                                            isDuplicating={duplicateSkill.isPending}
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

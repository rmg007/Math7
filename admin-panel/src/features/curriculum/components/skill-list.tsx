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
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableHeader } from '@/components/ui/sortable-header';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import type { DataColumn } from '@/lib/data-utils';
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Copy,
  Filter,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDomains } from '../hooks/use-domains';
import {
  useBulkCreateSkills,
  useBulkDeleteSkills,
  useBulkUpdateSkillsStatus,
  useDeleteSkill,
  useDuplicateSkill,
  usePaginatedSkills,
  useUpdateSkillOrder,
} from '../hooks/use-skills';
import { CurriculumFilterBar } from './curriculum-filter-bar';

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

import type { App } from '@/features/platform/hooks/use-apps';
import type { Tables } from '@/lib/database.types';

const DEFAULT_PAGE_SIZE = 10;

type SkillListItem = Tables<'skills'> & {
  domains?: { title: string } | null;
};

const SKILL_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'title' },
  { key: 'slug', header: 'slug' },
  {
    key: 'domains',
    header: 'domain_title',
    transform: (v: unknown) => (v as { title?: string } | null)?.title ?? '',
  },
  { key: 'difficulty_level', header: 'difficulty_level' },
  { key: 'sort_order', header: 'sort_order' },
  { key: 'status', header: 'status' },
];

interface SortableRowProps {
  skill: SkillListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  renderStatusBadge: (status: string) => JSX.Element;
  isDragDisabled: boolean;
  isDuplicating: boolean;
}

const SortableRow = memo(
  ({
    skill,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    renderStatusBadge,
    isDragDisabled,
    isDuplicating,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: skill.skill_id,
      disabled: isDragDisabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className="hover:bg-indigo-50/30 transition-all group/row border-b border-gray-50 last:border-0 relative"
      >
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
          <button
            onClick={() => onSelect(skill.skill_id)}
            aria-label={isSelected ? 'Deselect skill' : 'Select skill'}
            className="text-gray-300 hover:text-indigo-600 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-indigo-600" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
        </td>
        <td className="px-4 py-4 min-w-[250px]">
          <div className="flex flex-col">
            <span className="font-black text-gray-900 text-sm tracking-tight leading-none group-hover/row:text-indigo-700 transition-colors">
              {skill.title}
            </span>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] mt-1.5 opacity-70 italic truncate">
              /{skill.slug}
            </span>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
            {skill.domains?.title || 'ORPHAN'}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs border border-gray-200 shadow-sm">
            {skill.difficulty_level}
          </span>
        </td>
        <td className="px-4 py-4">{renderStatusBadge(skill.status || 'draft')}</td>
        <td className="pl-4 pr-8 py-3 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <Link
              to={`/skills/${skill.skill_id}/edit`}
              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Edit Skill"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onDuplicate(skill.skill_id)}
              disabled={isDuplicating}
              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              title="Duplicate Skill"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(skill.skill_id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Delete Skill"
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
    skill,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    renderStatusBadge,
    isDragDisabled,
    isDuplicating,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: skill.skill_id,
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
          'bg-white/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 group/card',
          isSelected
            ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/10'
            : 'border-white/40 hover:border-indigo-200 hover:shadow-lg'
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
                onClick={() => onSelect(skill.skill_id)}
                aria-label={isSelected ? 'Deselect skill' : 'Select skill'}
                className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-indigo-600" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <Link
                to={`/skills/${skill.skill_id}/edit`}
                className="p-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDuplicate(skill.skill_id)}
                disabled={isDuplicating}
                className="p-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(skill.skill_id)}
                className="p-2.5 rounded-xl bg-white border border-gray-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover/card:scale-110">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 text-lg tracking-tight truncate leading-tight mb-1">
                {skill.title}
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic opacity-60 truncate">
                /{skill.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                {skill.domains?.title?.substring(0, 12)}...
              </span>
              {renderStatusBadge(skill.status || 'draft')}
            </div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">
              LVL {skill.difficulty_level}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export function SkillList() {
  const { isSuperAdmin, apps } = useApp();
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
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

  const {
    data: paginatedData,
    isLoading,
    error,
  } = usePaginatedSkills(
    {
      page,
      pageSize,
      search: debouncedSearch,
      status: statusFilter,
      domainId: selectedDomainId,
      sortBy,
      sortOrder,
    },
    appFilter !== 'all' ? appFilter : undefined
  );
  const { data: domains } = useDomains();
  const deleteSkill = useDeleteSkill();
  const bulkDelete = useBulkDeleteSkills();
  const bulkUpdateStatus = useBulkUpdateSkillsStatus();
  const duplicateSkill = useDuplicateSkill();
  const updateSkillOrder = useUpdateSkillOrder();
  const bulkCreate = useBulkCreateSkills();
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
  }, [selectedDomainId, statusFilter]);

  const skills = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const skillIds = useMemo(() => skills.map((s: SkillListItem) => s.skill_id), [skills]);

  const isDragDisabled =
    Boolean(debouncedSearch) ||
    statusFilter !== 'all' ||
    selectedDomainId !== 'all' ||
    sortBy !== 'sort_order';

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((s: SkillListItem) => s.skill_id === active.id);
      const newIndex = skills.findIndex((s: SkillListItem) => s.skill_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSkills = arrayMove(skills, oldIndex, newIndex);

        const updates = reorderedSkills.map((skill: SkillListItem, index: number) => ({
          skill_id: skill.skill_id,
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

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === skills.length && skills.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(skills.map((s: SkillListItem) => s.skill_id)));
    }
  }, [skills, selectedIds.size]);

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
      await bulkUpdateStatus.mutateAsync({ skill_ids: Array.from(selectedIds), status: 'live' });
      showToast(`${selectedIds.size} skill(s) marked as live`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update skills', 'error');
    }
  };

  const handleMarkDraft = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ skill_ids: Array.from(selectedIds), status: 'draft' });
      showToast(`${selectedIds.size} skill(s) marked as draft`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update skills', 'error');
    }
  };

  const handleMarkPublished = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        skill_ids: Array.from(selectedIds),
        status: 'published',
      });
      showToast(`${selectedIds.size} skill(s) marked as published`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update skills', 'error');
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
        showToast(`${selectedIds.size} skill(s) purged`, 'success');
        setSelectedIds(new Set());
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteSkill.mutateAsync(deleteConfirmation.id);
        showToast('Skill purged successfully', 'success');
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
        await duplicateSkill.mutateAsync(id);
        showToast('Skill duplicated', 'success');
      } catch {
        showToast('Failed to duplicate skill', 'error');
      }
    },
    [duplicateSkill, showToast]
  );

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

  const handleImport = async (data: Record<string, unknown>[]) => {
    try {
      await bulkCreate.mutateAsync(data);
      showToast(`${data.length} skills imported successfully`, 'success');
    } catch {
      showToast('Failed to import skills. Check for duplicate slugs.', 'error');
    }
  };

  const renderStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status.toLowerCase() as StatusType} label={status.toUpperCase()} />;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminHeader
          title="Curriculum Skills"
          description="Configure and organize the detailed learning objectives for your curriculum."
          icon={Layers}
          breadcrumbs={[
            { label: 'Curriculum', href: '/domains' },
            { label: 'Skills', href: '/skills' },
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

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-8 text-center">
        <p className="text-red-700 font-bold">Error loading skills. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title="Curriculum Skills"
        description="Manage and organize learning skills for your curriculum taxonomy."
        icon={Layers}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Skills', href: '/skills' },
        ]}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DataToolbar
              data={skills as Record<string, unknown>[]}
              columns={SKILL_COLUMNS}
              entityName="Skills"
              onImport={handleImport}
              importDisabled={false}
            />
            <Link to="/skills/new">
              <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 gap-2">
                <Plus className="h-4 w-4" />
                <span>New Skill</span>
              </Button>
            </Link>
          </div>
        }
      />

      <CurriculumFilterBar
        searchPlaceholder="Search skills by title, slug, or identifier..."
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        extraFilters={
          <>
            <div className="relative w-full md:w-56">
              <select
                aria-label="Filter by domain"
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full h-14 appearance-none pl-6 pr-12 text-sm font-black uppercase tracking-widest rounded-[1.25rem] border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
              >
                <option value="all">ALL DOMAINS</option>
                {domains?.map((domain) => (
                  <option key={domain.domain_id} value={domain.domain_id}>
                    {domain.title.toUpperCase()}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
            </div>
            {isSuperAdmin ? (
              <div className="relative w-full md:w-56">
                <select
                  aria-label="Filter by app"
                  value={appFilter}
                  onChange={(e) => setAppFilter(e.target.value)}
                  className="w-full h-14 appearance-none pl-6 pr-12 text-sm font-black uppercase tracking-widest rounded-[1.25rem] border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="all">ALL APPS</option>
                  {apps.map((app: App) => (
                    <option key={app.app_id} value={app.app_id}>
                      {app.display_name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
              </div>
            ) : undefined}
          </>
        }
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 pl-4">
            <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
              {selectedIds.size} SELECTED FOR BATCH PROCESSING
            </span>
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
                      aria-label={isAllSelected ? 'Deselect all skills' : 'Select all skills'}
                      className="text-gray-300 hover:text-indigo-600 transition-colors"
                    >
                      {isAllSelected && skills.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="Identity & Skill"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px]"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    Parent Domain
                  </th>
                  <th className="h-14 px-4 text-center font-black text-[10px] uppercase tracking-widest text-gray-600">
                    <SortableHeader
                      label="LVL"
                      column="difficulty_level"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                      className="text-[10px] justify-center"
                    />
                  </th>
                  <th className="h-14 px-4 text-left font-black text-[10px] uppercase tracking-widest text-gray-600">
                    Status
                  </th>
                  <th className="h-14 pl-4 pr-8 text-right font-black text-[10px] uppercase tracking-widest text-gray-600">
                    Execution
                  </th>
                </tr>
              </thead>
              <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {!skills.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-24 text-center">
                        <EmptyState
                          icon={Layers}
                          title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                          description={
                            hasActiveFilters
                              ? 'Try adjusting your search or domain filter.'
                              : 'Start building your curriculum by adding some learning objectives.'
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
                                onClick={() => (window.location.href = '/skills/new')}
                                className="rounded-full px-8 shadow-md"
                              >
                                Create Skill
                              </Button>
                            )
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    skills.map((skill: SkillListItem) => (
                      <SortableRow
                        key={skill.skill_id}
                        skill={skill}
                        isSelected={selectedIds.has(skill.skill_id)}
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
          <div className="md:hidden p-4">
            <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
              {!skills.length ? (
                <div className="rounded-[2rem] border border-dashed border-gray-200 p-12 bg-white/30 backdrop-blur-md">
                  <EmptyState
                    icon={Layers}
                    title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Get started by creating your first skill.'
                    }
                    action={
                      hasActiveFilters ? (
                        <Button
                          onClick={clearFilters}
                          className="rounded-full px-8 shadow-md"
                          variant="outline"
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button
                          onClick={() => (window.location.href = '/skills/new')}
                          className="rounded-full px-8 shadow-md"
                        >
                          Create Skill
                        </Button>
                      )
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {skills.map((skill: SkillListItem) => (
                    <SortableCard
                      key={skill.skill_id}
                      skill={skill}
                      isSelected={selectedIds.has(skill.skill_id)}
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
        onOpenChange={(open: boolean) => !open && setDeleteConfirmation(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-gray-900 tracking-tight italic">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-medium">
              {deleteConfirmation?.type === 'bulk'
                ? `This will permanently purge ${selectedIds.size} selected skill(s). This action is irreversible.`
                : 'This action cannot be undone. This will permanently delete the skill and all associated questions from our high-availability clusters.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 italic transition-all border-none">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExecution}
              className="h-12 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
            >
              Confirm Execution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

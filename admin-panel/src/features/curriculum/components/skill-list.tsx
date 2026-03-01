import { AdminHeader } from '@/components/ui/admin-header';
import { SkillDeleteDialog } from './skill-list-dialogs';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Copy,
  Filter,
  GripVertical,
  Layers,
  Loader2,
  Pencil,
  Plus,
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
import { useDomains } from '../hooks/use-domains';
import {
  useDeleteSkill,
  useDuplicateSkill,
  usePaginatedSkills,
  useUpdateSkillOrder,
} from '../hooks/use-skills';
import {
  useBulkCreateSkills,
  useBulkDeleteSkills,
  useBulkUpdateSkillsStatus,
} from '../hooks/use-skills-bulk';
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

import type { Tables } from '@/lib/database.types';
import type { App } from '@/types/platform';
import type { CurriculumStatus } from '../types';

const DEFAULT_PAGE_SIZE = 10;

type SkillListItem = Tables<'skills'> & {
  domains?: { title: string } | null;
  apps?: { display_name: string } | null;
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
  { key: 'description', header: 'description' },
];

const SKILL_TOGGLE_COLUMNS = [
  { key: 'title', header: 'Title', alwaysVisible: true },
  { key: 'domain', header: 'Domain' },
  { key: 'difficulty', header: 'Difficulty' },
  { key: 'status', header: 'Status' },
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
  visibleColumns: Set<string>;
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
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: skill.skill_id,
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
        data-testid="skill-row"
        ref={(node) => {
          setNodeRef(node);
          if (rowRef.current !== node) {
            (rowRef as MutableRefObject<HTMLTableRowElement | null>).current = node;
          }
        }}
        className={cn(
          'group/row even:bg-gray-50/40',
          isSelected && 'bg-teal-50/50',
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
            onClick={() => onSelect(skill.skill_id)}
            className="text-gray-300 hover:text-gray-500"
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 text-xs">{skill.title}</span>
            {skill.apps?.display_name && (
              <span className="text-[11px] text-gray-500 mt-0.5">{skill.apps.display_name}</span>
            )}
          </div>
        </TableCell>
        {visibleColumns.has('domain') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {skill.domains?.title || 'No Domain'}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('difficulty') && (
          <TableCell className="text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
              {skill.difficulty_level}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            {renderStatusBadge(skill.status || 'draft')}
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Link
              to={`/skills/${skill.skill_id}/edit`}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDuplicate(skill.skill_id)}
              disabled={isDuplicating}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(skill.skill_id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
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
    skill,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    renderStatusBadge,
    isDragDisabled,
    isDuplicating,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: skill.skill_id,
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
          'bg-white rounded-lg border p-3 space-y-2 relative',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200',
          isDragging && 'opacity-50 z-10'
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
            onClick={() => onSelect(skill.skill_id)}
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
            <div className="flex flex-col min-w-0 mb-1">
              <h3 className="font-medium text-gray-900 text-xs truncate">{skill.title}</h3>
              {skill.apps?.display_name && (
                <span className="text-[11px] text-gray-500 leading-none mt-0.5">
                  {skill.apps.display_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {visibleColumns.has('domain') && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {skill.domains?.title || 'No Domain'}
                </span>
              )}
              {visibleColumns.has('difficulty') && (
                <span className="text-[11px] text-gray-500">Lvl {skill.difficulty_level}</span>
              )}
            </div>
          </div>
          {visibleColumns.has('status') && (
            <div className="shrink-0">{renderStatusBadge(skill.status || 'draft')}</div>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
          <Link
            to={`/skills/${skill.skill_id}/edit`}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDuplicate(skill.skill_id)}
            disabled={isDuplicating}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(skill.skill_id)}
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
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(SKILL_TOGGLE_COLUMNS.map((c) => c.key))
  );

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

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      if (deleteConfirmation.type === 'bulk') {
        await bulkDelete.mutateAsync(Array.from(selectedIds));
        showToast(`${selectedIds.size} skill(s) deleted`, 'success');
        setSelectedIds(new Set());
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteSkill.mutateAsync(deleteConfirmation.id);
        showToast('Skill deleted', 'success');
      }
    } catch {
      showToast('Failed to delete skill(s)', 'error');
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
      if (!domains) {
        throw new Error('Domains not loaded. Please wait or refresh the page.');
      }

      const skillsToCreate = data.map((item, index) => {
        const title = (item.title || item.Title || item.name || item.Name) as string;
        const slug = (item.slug || item.Slug) as string;
        const domainTitleFromCsv = (item.domain_title ||
          item.domain_name ||
          item.domain ||
          item.Domain) as string;

        // Find domain_id from title among existing domains for this app
        let domain_id = (item.domain_id || item.Domain_id || item.domain_id) as string;
        if (!domain_id && domainTitleFromCsv) {
          const matchedDomain = domains.find(
            (d) => d.title.toLowerCase() === domainTitleFromCsv.trim().toLowerCase()
          );
          if (matchedDomain) {
            domain_id = matchedDomain.domain_id;
          }
        }

        // If still no domain_id and we have a selected domain filter (and it's not 'all'), use it as fallback
        if (!domain_id && selectedDomainId && selectedDomainId !== 'all') {
          domain_id = selectedDomainId;
        }

        if (!domain_id) {
          const availableDomainTitles = domains.map((d) => `"${d.title}"`).join(', ');
          throw new Error(
            domainTitleFromCsv
              ? `Row ${index + 1}: Domain "${domainTitleFromCsv}" not found in the current app. Available domains are: ${availableDomainTitles || 'None'}.`
              : `Row ${index + 1}: Domain title is missing in CSV. Please include a "domain_title" column or select a domain filter.`
          );
        }

        // Normalize status to lowercase to match Postgres enum
        let statusValue = ((item.status as string) || 'draft').toLowerCase().trim();
        if (statusValue === 'active') statusValue = 'live';

        // Validate status value against enum
        const validStatuses: CurriculumStatus[] = ['draft', 'published', 'live'];
        const finalStatus = validStatuses.includes(statusValue as CurriculumStatus)
          ? (statusValue as CurriculumStatus)
          : 'draft';

        return {
          title: title || 'Untitled Skill',
          slug:
            slug ||
            (title
              ? title
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]/g, '_')
              : `skill_${Date.now()}_${index}`),
          domain_id,
          difficulty_level:
            Number(item.difficulty_level || item.difficulty || item.level || 1) || 1,
          sort_order: Number(item.sort_order || item.order || 0) || 0,
          status: finalStatus,
          description: (item.description || item.Description || '') as string,
        };
      });

      await bulkCreate.mutateAsync(skillsToCreate);
      showToast(`${data.length} skills imported successfully`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      let message = error instanceof Error ? error.message : 'Failed to import skills';
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        message = 'Import failed: One or more skills have slugs that already exist in this app.';
      }
      showToast(message, 'error');
    }
  };

  const renderStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status.toLowerCase() as StatusType} />;
  }, []);

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
              <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">Error loading skills. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="skills-list"
      data-hydration-complete={!isLoading}
      className="max-w-7xl mx-auto space-y-4 p-4 md:p-6"
    >
      <AdminHeader
        title="Skills"
        description="Manage learning skills."
        icon={Layers}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={skills as Record<string, unknown>[]}
              columns={SKILL_COLUMNS}
              entityName="Skills"
              onImport={handleImport}
              importDisabled={false}
            />
            <Link to="/skills/new" aria-label="New Skill">
              <Button className="h-9 px-3 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> New Skill
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

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <CurriculumFilterBar
          searchPlaceholder="Search skills..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          count={totalCount}
          countLabel={totalCount === 1 ? 'skill' : 'skills'}
          extraFilters={
            <>
              <div className="relative">
                <select
                  aria-label="Filter by domain"
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
                >
                  <option value="all">All Domains</option>
                  {domains?.map((domain) => (
                    <option key={domain.domain_id} value={domain.domain_id}>
                      {domain.title}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
              {isSuperAdmin ? (
                <div className="relative">
                  <select
                    aria-label="Filter by app"
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
                  >
                    <option value="all">All Apps</option>
                    {apps.map((app: App) => (
                      <option key={app.app_id} value={app.app_id}>
                        {app.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : undefined}
              <ColumnToggle
                columns={SKILL_TOGGLE_COLUMNS}
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                      {isAllSelected && skills.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="px-4">
                    <SortableHeader
                      label="Skill"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  {visibleColumns.has('domain') && (
                    <TableHead>
                      <SortableHeader
                        label="Domain"
                        column="domain_id"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('difficulty') && (
                    <TableHead className="text-center w-24">
                      <SortableHeader
                        label="Difficulty"
                        column="difficulty_level"
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
              <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {!skills.length ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.size + 3} className="py-20">
                        <EmptyState
                          icon={Layers}
                          title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                          description={
                            hasActiveFilters
                              ? 'Try adjusting your search or filters.'
                              : 'Create your first skill to build your curriculum.'
                          }
                          action={
                            hasActiveFilters ? (
                              <Button
                                onClick={clearFilters}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                              >
                                Clear Filters
                              </Button>
                            ) : (
                              <Link to="/skills/new">
                                <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                                  New Skill
                                </Button>
                              </Link>
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
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
            <SortableContext items={skillIds} strategy={verticalListSortingStrategy}>
              {!skills.length ? (
                <div className="py-12">
                  <EmptyState
                    icon={Layers}
                    title={hasActiveFilters ? 'No matches found' : 'No skills yet'}
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Create your first skill to get started.'
                    }
                    action={
                      hasActiveFilters ? (
                        <Button
                          onClick={clearFilters}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Link to="/skills/new">
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                            New Skill
                          </Button>
                        </Link>
                      )
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
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
                      visibleColumns={visibleColumns}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </DndContext>

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

      <SkillDeleteDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        deleteType={deleteConfirmation?.type ?? 'single'}
        selectedCount={selectedIds.size}
        isDeleting={bulkDelete.isPending || deleteSkill.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

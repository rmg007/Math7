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
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Book,
  CheckSquare,
  Filter,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import {
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
  useBulkCreateDomains,
  useBulkDeleteDomains,
  useBulkUpdateDomainsStatus,
  useDeleteDomain,
  usePaginatedDomains,
  useUpdateDomainOrder,
} from '../hooks/use-domains';
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

const DEFAULT_PAGE_SIZE = 10;

const DOMAIN_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'title' },
  { key: 'slug', header: 'slug' },
  { key: 'description', header: 'description' },
  { key: 'sort_order', header: 'sort_order' },
  { key: 'status', header: 'status' },
];

const DOMAIN_TOGGLE_COLUMNS = [
  { key: 'title', header: 'Title', alwaysVisible: true },
  { key: 'sort_order', header: 'Order' },
  { key: 'updated_at', header: 'Last Updated' },
  { key: 'status', header: 'Status' },
];

interface Domain {
  domain_id: string;
  title: string;
  slug: string;
  sort_order: number | null;
  status: 'draft' | 'published' | 'live' | null;
  updated_at: string;
  app_id: string;
  apps?: { display_name: string } | null;
  color_hex?: string | null;
}

interface SortableRowProps {
  domain: Domain;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  renderStatusBadge: (status: string) => JSX.Element;
  isDragDisabled: boolean;
  visibleColumns: Set<string>;
}

function SortableRow({
  domain,
  isSelected,
  onSelect,
  onDelete,
  renderStatusBadge,
  isDragDisabled,
  visibleColumns,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: domain.domain_id,
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
          onClick={() => onSelect(domain.domain_id)}
          className="text-gray-300 hover:text-gray-500"
          aria-label={isSelected ? 'Deselect domain' : 'Select domain'}
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-teal-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </TableCell>
      {visibleColumns.has('sort_order') && (
        <TableCell className="text-center w-12">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
            {domain.sort_order ?? 0}
          </span>
        </TableCell>
      )}
      <TableCell className="px-4">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 text-xs">{domain.title}</span>
          {domain.apps?.display_name && (
            <span className="text-[11px] text-gray-500 mt-0.5">{domain.apps.display_name}</span>
          )}
        </div>
      </TableCell>
      {visibleColumns.has('updated_at') && (
        <TableCell className="hidden lg:table-cell">
          <span className="text-xs text-gray-500">
            {new Date(domain.updated_at).toLocaleDateString()}{' '}
            <span className="text-gray-500">
              {new Date(domain.updated_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
        </TableCell>
      )}
      {visibleColumns.has('status') && (
        <TableCell className="whitespace-nowrap">
          {renderStatusBadge(domain.status || 'draft')}
        </TableCell>
      )}
      <TableCell className="px-4 text-right border-l border-gray-100">
        <div className="flex items-center justify-end gap-0.5">
          <Link
            to={`/domains/${domain.domain_id}/edit`}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Edit"
            aria-label="Edit domain"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDelete(domain.domain_id)}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Delete"
            aria-label="Delete domain"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableCard({
  domain,
  isSelected,
  onSelect,
  onDelete,
  renderStatusBadge,
  isDragDisabled,
  visibleColumns,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: domain.domain_id,
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
          onClick={() => onSelect(domain.domain_id)}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs shrink-0">
              {domain.sort_order ?? 0}
            </span>
            <div className="flex flex-col min-w-0">
              <h3 className="font-medium text-gray-900 text-xs truncate">{domain.title}</h3>
              {domain.apps?.display_name && (
                <span className="text-[11px] text-gray-500 leading-none mt-0.5">
                  {domain.apps.display_name}
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-gray-500">
            {visibleColumns.has('updated_at') &&
              `Modified: ${new Date(domain.updated_at).toLocaleDateString()}`}
          </div>
        </div>
        {visibleColumns.has('status') && (
          <div className="shrink-0">{renderStatusBadge(domain.status || 'draft')}</div>
        )}
      </div>
      <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
        <Link
          to={`/domains/${domain.domain_id}/edit`}
          className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => onDelete(domain.domain_id)}
          className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DomainList() {
  const { currentApp, isSuperAdmin, apps } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DOMAIN_TOGGLE_COLUMNS.map((c) => c.key))
  );
  const [deleteImpact, setDeleteImpact] = useState<{
    skillCount: number;
    questionCount: number;
    loading: boolean;
  }>({ skillCount: 0, questionCount: 0, loading: false });
  const [appFilter, setAppFilter] = useState<string>('all');

  const {
    data: paginatedData,
    isLoading,
    error,
  } = usePaginatedDomains(
    {
      page,
      pageSize,
      search: debouncedSearch,
      status: statusFilter,
      sortBy,
      sortOrder,
    },
    appFilter !== 'all' ? appFilter : undefined
  );

  const deleteDomain = useDeleteDomain();
  const bulkDelete = useBulkDeleteDomains();
  const bulkUpdateStatus = useBulkUpdateDomainsStatus();
  const bulkCreate = useBulkCreateDomains();
  const updateDomainOrder = useUpdateDomainOrder();
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
  }, [statusFilter]);

  const domains = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const domainIds = useMemo(() => domains.map((d) => d.domain_id), [domains]);

  const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all';

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = domains.findIndex((d) => d.domain_id === active.id);
      const newIndex = domains.findIndex((d) => d.domain_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedDomains = arrayMove(domains, oldIndex, newIndex);

        const updates = reorderedDomains.map((domain, index) => ({
          domain_id: domain.domain_id,
          sort_order: index + 1 + (page - 1) * pageSize,
        }));

        try {
          await updateDomainOrder.mutateAsync(updates);
          showToast('Domain order updated', 'success');
        } catch {
          showToast('Failed to update domain order', 'error');
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
    if (selectedIds.size === domains.length && domains.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(domains.map((d) => d.domain_id)));
    }
  }, [domains, selectedIds.size]);

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

  const fetchDeleteImpact = useCallback(async (domainIds: string[]) => {
    setDeleteImpact({ skillCount: 0, questionCount: 0, loading: true });
    try {
      const { count: skillCount } = await supabase
        .from('skills')
        .select('skill_id', { count: 'exact', head: true })
        .in('domain_id', domainIds)
        .is('deleted_at', null);

      const { data: skillRows } = await supabase
        .from('skills')
        .select('skill_id')
        .in('domain_id', domainIds)
        .is('deleted_at', null);

      let questionCount = 0;
      if (skillRows && skillRows.length > 0) {
        const skillIds = skillRows.map((s) => s.skill_id);
        const { count } = await supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true })
          .in('skill_id', skillIds)
          .is('deleted_at', null);
        questionCount = count ?? 0;
      }

      setDeleteImpact({ skillCount: skillCount ?? 0, questionCount, loading: false });
    } catch {
      setDeleteImpact({ skillCount: 0, questionCount: 0, loading: false });
    }
  }, []);

  const handleDelete = (id: string) => {
    setDeleteConfirmation({ type: 'single', id });
    fetchDeleteImpact([id]);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      if (deleteConfirmation.type === 'bulk') {
        await bulkDelete.mutateAsync(Array.from(selectedIds));
        showToast(`${selectedIds.size} domain(s) deleted`, 'success');
        setSelectedIds(new Set());
      } else if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
        await deleteDomain.mutateAsync(deleteConfirmation.id);
        showToast('Domain deleted', 'success');
      }
    } catch {
      showToast('Failed to delete domain(s)', 'error');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleMarkPublished = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'published' });
      showToast(`${selectedIds.size} domain(s) marked as published`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };

  const handleMarkLive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'live' });
      showToast(`${selectedIds.size} domain(s) marked as live`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };

  const handleMarkDraft = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status: 'draft' });
      showToast(`${selectedIds.size} domain(s) marked as draft`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update domains', 'error');
    }
  };

  const handleImport = async (data: Record<string, unknown>[]) => {
    try {
      const domainsToCreate = data.map((item, index) => {
        const title = (item.title || item.Title || item.name || item.Name) as string;
        const slug = (item.slug || item.Slug) as string;

        // Normalize status
        let statusValue = ((item.status as string) || 'draft').toLowerCase().trim();
        if (statusValue === 'active') statusValue = 'live';
        const validStatuses = ['draft', 'published', 'live'];
        const finalStatus = validStatuses.includes(statusValue) ? statusValue : 'draft';

        return {
          title: title || 'Untitled Domain',
          slug:
            slug ||
            (title
              ? title
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]/g, '_')
              : `domain_${Date.now()}_${index}`),
          description: (item.description || item.Description || '') as string,
          sort_order: Number(item.sort_order || item.order || 0) || 0,
          status: finalStatus,
        };
      });

      await bulkCreate.mutateAsync(domainsToCreate);
      showToast(`Successfully imported ${data.length} domains`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      let message = 'Failed to import domains. Check for duplicate slugs.';
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        message = 'Import failed: One or more domains have slugs that already exist in this app.';
      }
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

  const isAllSelected = domains.length > 0 && selectedIds.size === domains.length;
  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  };

  const renderStatusBadge = (status: string) => {
    return <StatusBadge status={status as StatusType} />;
  };

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
          <p className="text-sm text-red-600">Error loading domains. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-12 text-center">
          <p className="text-sm text-gray-500">Select an active app to access Domains.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="domains-list" className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Domains"
        description="Organize domain categories."
        icon={Book}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={domains}
              columns={DOMAIN_COLUMNS}
              entityName="Domains"
              onImport={handleImport}
              importDisabled={false}
            />
            <Link to="/domains/new">
              <Button className="h-9 px-3 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> New Domain
              </Button>
            </Link>
          </div>
        }
      />

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => {
          setDeleteConfirmation({ type: 'bulk' });
          fetchDeleteImpact(Array.from(selectedIds));
        }}
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
          searchPlaceholder="Search domains..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          count={totalCount}
          countLabel={totalCount === 1 ? 'domain' : 'domains'}
          extraFilters={
            <>
              {isSuperAdmin ? (
                <div className="relative">
                  <select
                    aria-label="Filter by app"
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
                  >
                    <option value="all">All Apps</option>
                    {apps.map((app) => (
                      <option key={app.app_id} value={app.app_id}>
                        {app.display_name}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              ) : undefined}
              <ColumnToggle
                columns={DOMAIN_TOGGLE_COLUMNS}
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
                      {isAllSelected && domains.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.has('sort_order') && (
                    <TableHead className="text-center w-12">
                      <SortableHeader
                        label="#"
                        column="sort_order"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  <TableHead className="px-4">
                    <SortableHeader
                      label="Domain"
                      column="title"
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  {visibleColumns.has('updated_at') && (
                    <TableHead className="hidden lg:table-cell">
                      <SortableHeader
                        label="Last Updated"
                        column="updated_at"
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
              <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {!domains.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20">
                        <EmptyState
                          icon={Book}
                          title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                          description={
                            hasActiveFilters
                              ? 'Try adjusting your search or filters.'
                              : 'Create your first domain to organize your curriculum.'
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
                              <Link to="/domains/new">
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                                  New Domain
                                </Button>
                              </Link>
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains.map((domain) => (
                      <SortableRow
                        key={domain.domain_id}
                        domain={domain}
                        isSelected={selectedIds.has(domain.domain_id)}
                        onSelect={handleSelectOne}
                        onDelete={handleDelete}
                        renderStatusBadge={renderStatusBadge}
                        isDragDisabled={isDragDisabled}
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
            <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
              {!domains.length ? (
                <div className="py-12">
                  <EmptyState
                    icon={Book}
                    title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                    description={
                      hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Create your first domain to get started.'
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
                        <Link to="/domains/new">
                          <Button className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm">
                            New Domain
                          </Button>
                        </Link>
                      )
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <SortableCard
                      key={domain.domain_id}
                      domain={domain}
                      isSelected={selectedIds.has(domain.domain_id)}
                      onSelect={handleSelectOne}
                      onDelete={handleDelete}
                      renderStatusBadge={renderStatusBadge}
                      isDragDisabled={isDragDisabled}
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

      <AlertDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <AlertDialogContent className="rounded-lg border border-gray-200 bg-white shadow-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-gray-900">
              Delete{' '}
              {deleteConfirmation?.type === 'bulk' ? `${selectedIds.size} domains` : 'domain'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              {deleteConfirmation?.type === 'bulk'
                ? `This will permanently delete ${selectedIds.size} selected domain(s).`
                : 'This action cannot be undone.'}
              {deleteImpact.loading ? (
                <span className="block mt-2 text-gray-400 text-xs">
                  Checking for dependent items...
                </span>
              ) : deleteImpact.skillCount > 0 || deleteImpact.questionCount > 0 ? (
                <span className="block mt-2 font-medium text-red-600 text-xs">
                  This will also delete {deleteImpact.skillCount} skill(s) and{' '}
                  {deleteImpact.questionCount} question(s).
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-9 px-4 rounded text-sm font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={bulkDelete.isPending || deleteDomain.isPending}
              className="h-9 px-5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm"
            >
              {(bulkDelete.isPending || deleteDomain.isPending) && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

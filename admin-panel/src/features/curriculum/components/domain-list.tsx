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
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import type { DataColumn } from '@/lib/data-utils';
import { supabase } from '@/lib/supabase';
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
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface Domain {
  domain_id: string;
  title: string;
  slug: string;
  sort_order: number | null;
  status: 'draft' | 'published' | 'live' | null;
  updated_at: string;
}

interface SortableRowProps {
  domain: Domain;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  renderStatusBadge: (status: string) => JSX.Element;
  isDragDisabled: boolean;
}

function SortableRow({
  domain,
  isSelected,
  onSelect,
  onDelete,
  renderStatusBadge,
  isDragDisabled,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: domain.domain_id,
    disabled: isDragDisabled,
  });

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
            className="p-2 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none"
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
          onClick={() => onSelect(domain.domain_id)}
          className="text-gray-400 hover:text-gray-600"
          title={isSelected ? 'Deselect domain' : 'Select domain'}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-purple-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>
      </td>
      <td className="px-6 py-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-700 font-bold text-sm">
          {domain.sort_order ?? 0}
        </span>
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm tracking-tight">{domain.title}</span>
          <span className="text-2xs text-gray-400 font-mono tracking-wide uppercase shrink-0">
            {domain.domain_id.substring(0, 8)}
          </span>
        </div>
      </td>
      <td className="px-6 py-3">
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {new Date(domain.updated_at).toLocaleDateString()}{' '}
          <span className="text-gray-400">
            {new Date(domain.updated_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </span>
      </td>
      <td className="px-6 py-3">{renderStatusBadge(domain.status || 'draft')}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/domains/${domain.domain_id}/edit`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit Domain"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(domain.domain_id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Domain"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortableCard({
  domain,
  isSelected,
  onSelect,
  onDelete,
  renderStatusBadge,
  isDragDisabled,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: domain.domain_id,
    disabled: isDragDisabled,
  });

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
          onClick={() => onSelect(domain.domain_id)}
          className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          title={isSelected ? 'Deselect domain' : 'Select domain'}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-purple-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-semibold text-xs flex-shrink-0">
              {domain.sort_order ?? 0}
            </span>
            <h3 className="font-medium text-gray-900 truncate">{domain.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Modified: {new Date(domain.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex-shrink-0">{renderStatusBadge(domain.status || 'draft')}</div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Link
          to={`/domains/${domain.domain_id}/edit`}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          onClick={() => onDelete(domain.domain_id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
          aria-label="Delete domain"
        >
          <Trash2 className="h-4 w-4" />
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
  const sortBy = 'title';
  const sortOrder = 'asc' as const;
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);
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
      await bulkCreate.mutateAsync(data);
      showToast(`Successfully imported ${data.length} domains`, 'success');
    } catch {
      showToast('Failed to import domains. Check for duplicate slugs.', 'error');
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading domains...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600">Error loading domains. Please try again.</p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-white/50 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-xl">
          <p className="text-gray-500 font-bold uppercase tracking-widest italic">
            Select an active app to access Domains
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title="Domains"
        description="Organize domain categories."
        icon={Book}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DataToolbar
              data={domains as unknown as Record<string, unknown>[]}
              columns={DOMAIN_COLUMNS}
              entityName="Domains"
              onImport={handleImport}
              importDisabled={false}
            />
            <Link to="/domains/new">
              <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-0.5 gap-3">
                <Plus className="h-5 w-5" />
                <span>Add Domain</span>
              </Button>
            </Link>
          </div>
        }
      />

      {selectedIds.size > 0 && (
        <div className="sticky top-24 z-30 flex items-center justify-between p-3 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-top-8 duration-500 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-4 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">{selectedIds.size}</span>
            </div>
            <span className="text-white/70 font-black text-2xs uppercase tracking-widest">
              Bulk Actions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkUpdateStatus.isPending}
              onClick={handleMarkPublished}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 gap-2"
            >
              {bulkUpdateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkUpdateStatus.isPending}
              onClick={handleMarkLive}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 gap-2"
            >
              {bulkUpdateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Go Live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkUpdateStatus.isPending}
              onClick={handleMarkDraft}
              className="h-10 px-4 rounded-xl text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 gap-2"
            >
              {bulkUpdateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Draft
            </Button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkDelete.isPending}
              onClick={() => {
                setDeleteConfirmation({ type: 'bulk' });
                fetchDeleteImpact(Array.from(selectedIds));
              }}
              className="h-10 px-4 rounded-xl text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all gap-2"
            >
              {bulkDelete.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Purge
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <CurriculumFilterBar
          searchPlaceholder="Search domains..."
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          extraFilters={
            isSuperAdmin ? (
              <div className="relative w-full md:w-56">
                <select
                  aria-label="Filter by app"
                  value={appFilter}
                  onChange={(e) => setAppFilter(e.target.value)}
                  className="w-full h-14 appearance-none pl-6 pr-12 text-sm font-black uppercase tracking-widest rounded-[1.25rem] border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="all">ALL APPS</option>
                  {apps.map((app) => (
                    <option key={app.app_id} value={app.app_id}>
                      {app.display_name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
              </div>
            ) : undefined
          }
        />

        <div className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden">
              <table className="w-full">
                <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-50">
                    {!domains.length ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12">
                          <EmptyState
                            icon={Book}
                            title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                            description={
                              hasActiveFilters
                                ? 'Try adjusting your search or filters to find what you are looking for.'
                                : 'Get started by creating your first domain to organize your curriculum.'
                            }
                            action={
                              hasActiveFilters ? (
                                <button
                                  onClick={clearFilters}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                  Clear filters
                                </button>
                              ) : (
                                <Link
                                  to="/domains/new"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                  Create Domain
                                </Link>
                              )
                            }
                          />
                        </td>
                      </tr>
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
                        />
                      ))
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <SortableContext items={domainIds} strategy={verticalListSortingStrategy}>
                {!domains.length ? (
                  <div className="rounded-xl border border-gray-100 p-8">
                    <EmptyState
                      icon={Book}
                      title={hasActiveFilters ? 'No matches found' : 'No domains yet'}
                      description={
                        hasActiveFilters
                          ? 'Try adjusting your search or filters.'
                          : 'Get started by creating your first domain.'
                      }
                      action={
                        hasActiveFilters ? (
                          <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Clear filters
                          </button>
                        ) : (
                          <Link
                            to="/domains/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Create Domain
                          </Link>
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {domains.map((domain) => (
                      <SortableCard
                        key={domain.domain_id}
                        domain={domain}
                        isSelected={selectedIds.has(domain.domain_id)}
                        onSelect={handleSelectOne}
                        onDelete={handleDelete}
                        renderStatusBadge={renderStatusBadge}
                        isDragDisabled={isDragDisabled}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </div>
          </DndContext>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <AlertDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.type === 'bulk'
                ? `This will permanently delete ${selectedIds.size} selected domain(s).`
                : 'This action cannot be undone. This will permanently delete the domain.'}
              {deleteImpact.loading ? (
                <span className="block mt-2 text-gray-500 text-sm">
                  Checking for dependent items...
                </span>
              ) : deleteImpact.skillCount > 0 || deleteImpact.questionCount > 0 ? (
                <span className="block mt-2 font-semibold text-red-600 text-sm">
                  This will also delete {deleteImpact.skillCount} skill(s) and{' '}
                  {deleteImpact.questionCount} question(s) linked to{' '}
                  {deleteConfirmation?.type === 'bulk' ? 'these domains' : 'this domain'}.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={bulkDelete.isPending || deleteDomain.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {(bulkDelete.isPending || deleteDomain.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

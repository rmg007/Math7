import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDeleteDomain, usePaginatedDomains, useUpdateDomainOrder } from '../hooks/use-domains';
import {
  useBulkCreateDomains,
  useBulkDeleteDomains,
  useBulkUpdateDomainsStatus,
} from '../hooks/use-domains-bulk';

export const DEFAULT_PAGE_SIZE = 10;

export const DOMAIN_TOGGLE_COLUMNS = [
  { key: 'title', header: 'Title', alwaysVisible: true },
  { key: 'sort_order', header: 'Order' },
  { key: 'updated_at', header: 'Last Updated' },
  { key: 'status', header: 'Status' },
];

export function useDomainsState() {
  const { currentApp, isSuperAdmin, apps } = useApp();
  const { toast } = useToast();

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
  }, [statusFilter]);

  const domains = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

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
    if (selectedIds.size === domains.length && domains.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(domains.map((d) => d.domain_id)));
    }
  }, [domains, selectedIds.size]);

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

  const handleDelete = useCallback(
    (id: string) => {
      setDeleteConfirmation({ type: 'single', id });
      fetchDeleteImpact([id]);
    },
    [fetchDeleteImpact]
  );

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

  const handleBulkStatusUpdate = async (status: 'draft' | 'published' | 'live') => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status });
      showToast(`${selectedIds.size} domain(s) marked as ${status}`, 'success');
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  };

  const isDragDisabled = Boolean(debouncedSearch) || statusFilter !== 'all';
  const isAllSelected = domains.length > 0 && selectedIds.size === domains.length;
  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  return {
    currentApp,
    isSuperAdmin,
    apps,
    domains,
    totalCount,
    totalPages,
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    deleteImpact,
    appFilter,
    setAppFilter,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleDelete,
    confirmDelete,
    handleBulkStatusUpdate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    fetchDeleteImpact,
    isDeleting: bulkDelete.isPending,
    isUpdating: bulkUpdateStatus.isPending,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
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
import { useDomains } from '../hooks/use-domains';
import type { CurriculumStatus } from '../types';

export const DEFAULT_PAGE_SIZE = 10;

export const SKILL_TOGGLE_COLUMNS = [
  { key: 'title', header: 'Title', alwaysVisible: true },
  { key: 'domain', header: 'Domain' },
  { key: 'difficulty', header: 'Difficulty' },
  { key: 'status', header: 'Status' },
];

export function useSkillsState() {
  const { isSuperAdmin, apps, currentApp } = useApp();
  const { toast } = useToast();

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
  }, [selectedDomainId, statusFilter]);

  const skills = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((s) => s.skill_id === active.id);
      const newIndex = skills.findIndex((s) => s.skill_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSkills = arrayMove(skills, oldIndex, newIndex);

        const updates = reorderedSkills.map((skill, index) => ({
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
    if (selectedIds.size === skills.length && skills.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(skills.map((s) => s.skill_id)));
    }
  }, [skills, selectedIds.size]);

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

  const handleBulkStatusUpdate = async (status: 'draft' | 'published' | 'live') => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        skill_ids: Array.from(selectedIds),
        status,
      });
      showToast(`${selectedIds.size} skill(s) marked as ${status}`, 'success');
      setSelectedIds(new Set());
    } catch {
      showToast('Failed to update skills', 'error');
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

        let domain_id = (item.domain_id || item.Domain_id) as string;
        if (!domain_id && domainTitleFromCsv) {
          const matchedDomain = domains.find(
            (d) => d.title.toLowerCase() === domainTitleFromCsv.trim().toLowerCase()
          );
          if (matchedDomain) {
            domain_id = matchedDomain.domain_id;
          }
        }

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

        let statusValue = ((item.status as string) || 'draft').toLowerCase().trim();
        if (statusValue === 'active') statusValue = 'live';

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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedDomainId('all');
    setPage(1);
  };

  const isDragDisabled =
    Boolean(debouncedSearch) ||
    statusFilter !== 'all' ||
    selectedDomainId !== 'all' ||
    sortBy !== 'sort_order';

  const isAllSelected = skills.length ? selectedIds.size === skills.length : false;
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedDomainId !== 'all';

  return {
    isSuperAdmin,
    apps,
    currentApp,
    domains,
    skills,
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
    selectedDomainId,
    setSelectedDomainId,
    selectedIds,
    setSelectedIds,
    sortBy,
    sortOrder,
    visibleColumns,
    setVisibleColumns,
    deleteConfirmation,
    setDeleteConfirmation,
    appFilter,
    setAppFilter,
    handleDragEnd,
    handleSort,
    handleSelectOne,
    handleSelectAll,
    handleDelete,
    confirmDelete,
    handleBulkStatusUpdate,
    handleDuplicate,
    handleImport,
    clearFilters,
    isDragDisabled,
    isAllSelected,
    hasActiveFilters,
    isDeleting: bulkDelete.isPending || deleteSkill.isPending,
    isUpdating: bulkUpdateStatus.isPending,
    isDuplicating: duplicateSkill.isPending,
  };
}

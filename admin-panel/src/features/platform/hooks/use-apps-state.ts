import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import { normalizeFormData } from '@/lib/normalization';
import {
  useApps,
  useBulkCreateApps,
  useBulkDeleteApps,
  useBulkUpdateAppsStatus,
  useCheckAppSubdomain,
  useCreateApp,
  useDeleteApp,
  useUpdateApp,
  type AppInsert,
  type CompiledApp,
} from '../hooks/use-apps';
import { useSubjects } from '../hooks/use-subjects';
import { APP_COLUMNS, appSchema, type AppFormData } from '../components/apps/schema';
import type { DataColumn } from '@/lib/data-utils';

export function useAppsState() {
  const { data: apps, isLoading: appsLoading } = useApps();
  const { data: subjects } = useSubjects();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const bulkDelete = useBulkDeleteApps();
  const bulkUpdateStatus = useBulkUpdateAppsStatus();
  const bulkCreate = useBulkCreateApps();
  const { checkSubdomain } = useCheckAppSubdomain();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(APP_COLUMNS.map((c: DataColumn) => c.key))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<CompiledApp | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);

  const form = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
    mode: 'onChange',
    defaultValues: {
      subject_id: '',
      display_name: '',
      subdomain: '',
      grade_level: '',
      grade_number: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingApp) {
        form.reset({
          subject_id: editingApp.subject_id || '',
          display_name: editingApp.display_name,
          subdomain: editingApp.subdomain,
          grade_level: editingApp.grade_level || '',
          grade_number: editingApp.grade_number || 0,
          is_active: editingApp.is_active || false,
        });
      } else {
        form.reset({
          subject_id: subjects && subjects.length > 0 ? subjects[0].subject_id : '',
          display_name: '',
          subdomain: '',
          grade_level: '',
          grade_number: 0,
          is_active: true,
        });
      }
    }
  }, [isDialogOpen, editingApp, subjects, form]);

  const handleOpenDialog = useCallback((app?: CompiledApp) => {
    setEditingApp(app || null);
    setIsDialogOpen(true);
  }, []);

  const filteredApps = useMemo(
    () =>
      apps?.filter((app: CompiledApp) => {
        const matchesSearch =
          app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.subjects?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || (statusFilter === 'active' ? app.is_active : !app.is_active);
        return matchesSearch && matchesStatus;
      }) || [],
    [apps, searchQuery, statusFilter]
  );

  const sortedApps = useMemo(
    () =>
      [...filteredApps].sort((a, b) => {
        let aValue: string | number | boolean | null | undefined;
        let bValue: string | number | boolean | null | undefined;

        if (sortBy === 'subject') {
          aValue = a.subjects?.title || '';
          bValue = b.subjects?.title || '';
        } else {
          const valA = a[sortBy as keyof CompiledApp];
          const valB = b[sortBy as keyof CompiledApp];
          aValue =
            typeof valA !== 'object' || valA === null
              ? (valA as string | number | boolean | null | undefined)
              : '';
          bValue =
            typeof valB !== 'object' || valB === null
              ? (valB as string | number | boolean | null | undefined)
              : '';
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const result = aValue < bValue ? -1 : 1;
        return sortOrder === 'asc' ? result : -result;
      }),
    [filteredApps, sortBy, sortOrder]
  );

  const paginatedApps = useMemo(
    () => sortedApps.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedApps, currentPage, pageSize]
  );

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
    if (selectedIds.size === filteredApps.length && filteredApps.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map((a: CompiledApp) => a.app_id)));
    }
  }, [filteredApps, selectedIds.size]);

  const handleBulkStatusUpdate = async (is_active: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        ids: Array.from(selectedIds),
        is_active,
      });
      toast({ title: 'Success', description: `${selectedIds.size} applications updated` });
      setSelectedIds(new Set());
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppsPage', method: 'handleBulkStatusUpdate' },
        extra: { is_active, idsCount: selectedIds.size },
      });
      toast({
        title: 'Error',
        description: 'Failed to update applications',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmation({ type: 'bulk' });
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      toast({ title: 'Success', description: `${selectedIds.size} applications deleted` });
      setSelectedIds(new Set());
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppsPage', method: 'confirmBulkDelete' },
        extra: { idsCount: selectedIds.size },
      });
      toast({
        title: 'Error',
        description: 'Failed to delete applications',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleImport = async (data: Record<string, unknown>[]) => {
    try {
      const appsToCreate = data.map((item, index) => {
        const display_name = (item.display_name ||
          item.Display_Name ||
          item.name ||
          item.Name) as string;
        const subdomain = (item.subdomain || item.Subdomain) as string;
        const subjectTitleFromCsv = (item.subject_title ||
          item.subject_name ||
          item.subject ||
          item.Subject) as string;

        let subject_id = (item.subject_id || item.Subject_id) as string;
        if (!subject_id && subjectTitleFromCsv && subjects) {
          const matchedSubject = subjects.find(
            (s) => s.title.toLowerCase() === subjectTitleFromCsv.trim().toLowerCase()
          );
          if (matchedSubject) {
            subject_id = matchedSubject.subject_id;
          }
        }

        if (!subject_id) {
          throw new Error(
            subjectTitleFromCsv
              ? `Row ${index + 1}: Subject "${subjectTitleFromCsv}" not found. Please create it first.`
              : `Row ${index + 1}: Subject ID or Title is missing. Please include subject_title in CSV.`
          );
        }

        const statusValue = item.is_active as string | boolean;
        let is_active = true;
        if (typeof statusValue === 'string') {
          const val = statusValue.toLowerCase().trim();
          is_active = val === 'true' || val === 'active' || val === '1' || val === 'yes';
        } else if (typeof statusValue === 'boolean') {
          is_active = statusValue;
        }

        return {
          subject_id,
          display_name: display_name || 'Untitled Application',
          subdomain:
            subdomain ||
            (display_name
              ? display_name
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]/g, '-')
              : `app-${Date.now()}-${index}`),
          grade_level: (item.grade_level ||
            item.Grade_Level ||
            item.grade ||
            item.Grade ||
            '') as string,
          grade_number: Number(item.grade_number || item.Grade_Number || 0) || 0,
          is_active,
        };
      }) as AppInsert[];

      await bulkCreate.mutateAsync(appsToCreate);
      toast({
        title: 'Success',
        description: `Successfully imported ${appsToCreate.length} applications`,
      });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppsPage', method: 'handleImport' },
      });
      toast({
        title: 'Import Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: AppFormData) => {
    const normalizedData = normalizeFormData(data, {
      trim: ['display_name', 'subdomain', 'grade_level'],
      lowercase: ['subdomain'],
    });

    try {
      const isAvailable = await checkSubdomain(normalizedData.subdomain, editingApp?.app_id);
      if (!isAvailable) {
        form.setError('subdomain', {
          type: 'manual',
          message: 'This subdomain is already in use. Please choose another one.',
        });
        toast({
          title: 'Subdomain conflict',
          description:
            'An application with this subdomain already exists. Please use a unique subdomain.',
          variant: 'destructive',
        });
        return;
      }

      if (editingApp) {
        await updateApp.mutateAsync({ id: editingApp.app_id, ...normalizedData });
        toast({ title: 'Success', description: 'Application updated' });
      } else {
        await createApp.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'Application created' });
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      captureException(err as Error, {
        tags: { component: 'AppsPage', method: 'onSubmit' },
        extra: { isEditing: Boolean(editingApp) },
      });

      let errorMessage = 'An unexpected error occurred while saving the application.';
      const supabaseError = err as { code?: string; status?: number };

      if (supabaseError?.code === '23505' || supabaseError?.status === 409) {
        errorMessage =
          'An application with this subdomain already exists. Please use a different subdomain.';
        form.setError('subdomain', { type: 'manual', message: errorMessage });
      }

      toast({
        title: 'Error saving application',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmation({ type: 'single', id });
  };

  const confirmSingleDelete = async () => {
    if (!deleteConfirmation?.id) return;
    const id = deleteConfirmation.id;

    try {
      await deleteApp.mutateAsync(id);
      toast({ title: 'Deleted', description: 'Application has been removed.' });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'AppsPage', method: 'confirmSingleDelete' },
        extra: { id },
      });
      toast({
        title: 'Error',
        description: 'Failed to delete application',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const isAllSelected = filteredApps.length > 0 && selectedIds.size === filteredApps.length;

  return {
    apps,
    appsLoading,
    subjects,
    createApp,
    updateApp,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    visibleColumns,
    setVisibleColumns,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    isDialogOpen,
    setIsDialogOpen,
    editingApp,
    deleteConfirmation,
    setDeleteConfirmation,
    form,
    handleOpenDialog,
    filteredApps,
    paginatedApps,
    handleSelectOne,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleBulkDelete,
    confirmBulkDelete,
    handleImport,
    onSubmit,
    handleDelete,
    confirmSingleDelete,
    handleSort,
    isAllSelected,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import { normalizeFormData } from '@/lib/normalization';
import {
  useBulkCreateSubjects,
  useBulkDeleteSubjects,
  useBulkUpdateSubjectsStatus,
  useCheckSubjectSlug,
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateSubject,
  type Subject,
  type SubjectInsert,
} from '../hooks/use-subjects';
import {
  SUBJECT_COLUMNS,
  subjectSchema,
  type SubjectFormData,
} from '../components/subjects/schema';

export function useSubjectsState() {
  const { data: subjects, isLoading } = useSubjects();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'live'>('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(SUBJECT_COLUMNS.map((c) => c.key))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('display_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    id?: string;
  } | null>(null);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const bulkCreate = useBulkCreateSubjects();
  const bulkDelete = useBulkDeleteSubjects();
  const bulkUpdateStatus = useBulkUpdateSubjectsStatus();
  const { checkSlug } = useCheckSubjectSlug();

  const filteredSubjects = useMemo(
    () =>
      subjects?.filter((s) => {
        const matchesSearch =
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) || [],
    [subjects, searchQuery, statusFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const sortedSubjects = useMemo(
    () =>
      [...filteredSubjects].sort((a, b) => {
        const aValue = a[sortBy as keyof Subject];
        const bValue = b[sortBy as keyof Subject];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const result = aValue < bValue ? -1 : 1;
        return sortOrder === 'asc' ? result : -result;
      }),
    [filteredSubjects, sortBy, sortOrder]
  );

  const paginatedSubjects = useMemo(
    () => sortedSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedSubjects, currentPage, pageSize]
  );

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      color_hex: '#0D9488',
      display_order: 0,
      status: 'draft',
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (editingSubject) {
        form.reset({
          title: editingSubject.title,
          slug: editingSubject.slug,
          description: editingSubject.description || '',
          color_hex: editingSubject.color_hex || '',
          display_order: editingSubject.display_order ?? 1,
          status: (editingSubject.status as 'draft' | 'published' | 'live') || 'draft',
        });
      } else {
        const nextOrder = (subjects?.length ?? 0) + 1;
        form.reset({
          title: '',
          slug: '',
          description: '',
          color_hex: '',
          display_order: nextOrder,
          status: 'draft',
        });
      }
    }
  }, [isDialogOpen, editingSubject, subjects, form]);

  const handleOpenDialog = useCallback((subject?: Subject) => {
    setEditingSubject(subject || null);
    setIsDialogOpen(true);
  }, []);

  const onSubmit = async (data: SubjectFormData) => {
    const normalizedData = normalizeFormData(data, {
      trim: ['title', 'description'],
      lowercase: ['slug', 'color_hex'],
    });

    try {
      const isAvailable = await checkSlug(normalizedData.slug, editingSubject?.subject_id);
      if (!isAvailable) {
        form.setError('slug', {
          type: 'manual',
          message: 'This slug is already in use. Please choose another one.',
        });
        toast({
          title: 'Slug conflict',
          description: 'A subject with this slug already exists. Please use a unique slug.',
          variant: 'destructive',
        });
        return;
      }

      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.subject_id, ...normalizedData });
        toast({ title: 'Success', description: 'Subject updated' });
      } else {
        await createSubject.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'Subject created' });
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      captureException(err as Error, {
        tags: { component: 'SubjectsPage', method: 'onSubmit' },
        extra: { isEditing: Boolean(editingSubject) },
      });

      let errorMessage = 'An unexpected error occurred while saving the subject.';
      const supabaseError = err as { code?: string; status?: number };

      if (supabaseError?.code === '23505' || supabaseError?.status === 409) {
        errorMessage = 'A subject with this slug already exists. Please use a different slug.';
        form.setError('slug', { type: 'manual', message: errorMessage });
      }

      toast({
        title: 'Error saving subject',
        description: errorMessage,
        variant: 'destructive',
      });
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

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredSubjects.length && filteredSubjects.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubjects.map((s) => s.subject_id)));
    }
  }, [filteredSubjects, selectedIds.size]);

  const handleBulkStatusUpdate = async (status: 'draft' | 'published' | 'live') => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        ids: Array.from(selectedIds),
        status,
      });
      toast({ title: 'Success', description: `${selectedIds.size} subjects updated` });
      setSelectedIds(new Set());
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'SubjectsPage', method: 'handleBulkStatusUpdate' },
        extra: { status, idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to update subjects', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmation({ type: 'bulk' });
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      toast({ title: 'Success', description: `${selectedIds.size} subjects deleted` });
      setSelectedIds(new Set());
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'SubjectsPage', method: 'confirmBulkDelete' },
        extra: { idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to delete subjects', variant: 'destructive' });
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleImport = async (data: Record<string, unknown>[]) => {
    try {
      const subjectsToCreate = data.map((item, index) => {
        const title = (item.title || item.Title || item.name || item.Name) as string;
        const slug = (item.slug || item.Slug) as string;

        let statusValue = ((item.status as string) || 'draft').toLowerCase().trim();
        if (statusValue === 'active') statusValue = 'live';
        const validStatuses: string[] = ['draft', 'published', 'live'];
        const finalStatus = (validStatuses.includes(statusValue) ? statusValue : 'draft') as
          | 'draft'
          | 'published'
          | 'live';

        return {
          title: title || 'Untitled Subject',
          slug:
            slug ||
            (title
              ? title
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]/g, '_')
              : `subject_${Date.now()}_${index}`),
          description: (item.description || item.Description || '') as string,
          color_hex: (item.color_hex || item.Color || item.color || '#0D9488') as string,
          display_order: Number(item.display_order || item.order || item.Order || 0) || 0,
          status: finalStatus,
        };
      }) as SubjectInsert[];
      await bulkCreate.mutateAsync(subjectsToCreate);
      toast({ title: 'Success', description: `${data.length} subjects imported successfully` });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'SubjectsPage', method: 'handleImport' },
      });
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to import subjects',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmation({ type: 'single', id });
  }, []);

  const confirmSingleDelete = async () => {
    if (!deleteConfirmation?.id) return;
    const id = deleteConfirmation.id;

    try {
      await deleteSubject.mutateAsync(id);
      toast({
        title: 'Subject Deleted',
        description: 'The subject and all associated metadata have been removed.',
      });
    } catch (err: unknown) {
      captureException(err as Error, {
        tags: { component: 'SubjectsPage', method: 'confirmSingleDelete' },
        extra: { id },
      });
      let description = 'Failed to delete subject';
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23503'
      ) {
        description =
          'Cannot delete this subject because it is assigned to one or more Applications.';
      }

      toast({
        title: 'Error',
        description,
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

  const isAllSelected = filteredSubjects.length > 0 && selectedIds.size === filteredSubjects.length;

  return {
    subjects,
    isLoading,
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
    editingSubject,
    deleteConfirmation,
    setDeleteConfirmation,
    createSubject,
    updateSubject,
    form,
    handleOpenDialog,
    filteredSubjects,
    paginatedSubjects,
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

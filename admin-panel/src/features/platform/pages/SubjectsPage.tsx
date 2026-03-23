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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortableHeader } from '@/components/ui/sortable-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import type { DataColumn } from '@/lib/data-utils';
import { normalizeFormData } from '@/lib/normalization';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Boxes,
  CheckCircle2,
  CheckSquare,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

interface SubjectRowProps {
  subject: Subject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  visibleColumns: Set<string>;
}

const statusConfig = {
  live: {
    label: 'Live',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  draft: {
    label: 'Draft',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
} as const;

const SubjectRow = memo(
  ({ subject, isSelected, onSelect, onEdit, onDelete, visibleColumns }: SubjectRowProps) => {
    const status = statusConfig[subject.status as keyof typeof statusConfig] ?? statusConfig.draft;

    return (
      <TableRow
        key={subject.subject_id}
        data-testid="subject-row"
        className={cn('group/row even:bg-gray-50/40', isSelected && 'bg-teal-50/50')}
      >
        <TableCell className="w-8 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(subject.subject_id);
            }}
            className="p-1 hover:bg-white rounded transition-colors group"
            aria-label={isSelected ? 'Deselect subject' : 'Select subject'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        {visibleColumns.has('title') && (
          <TableCell className="px-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {subject.color_hex && (
                <span
                  ref={(node) => {
                    if (node) {
                      node.style.setProperty('--subject-color', subject.color_hex || '');
                    }
                  }}
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 bg-[var(--subject-color)]"
                  title={`Color: ${subject.color_hex}`}
                  aria-label={`Subject color: ${subject.color_hex}`}
                />
              )}
              <span className="font-medium text-gray-900 text-xs truncate">{subject.title}</span>
            </div>
          </TableCell>
        )}
        {visibleColumns.has('slug') && (
          <TableCell className="hidden md:table-cell whitespace-nowrap">
            <code className="text-xs text-gray-500 font-mono">{subject.slug}</code>
          </TableCell>
        )}
        {visibleColumns.has('icon_url') && (
          <TableCell className="px-2 text-center hidden sm:table-cell w-12">
            {subject.icon_url ? (
              <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center mx-auto">
                <img src={subject.icon_url} alt="" className="w-4 h-4 object-contain" />
              </div>
            ) : (
              <span className="text-gray-300 text-xs">&mdash;</span>
            )}
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                status.bgColor,
                status.textColor
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('display_order') && (
          <TableCell className="hidden lg:table-cell text-center whitespace-nowrap">
            <span className="text-xs text-gray-500 tabular-nums">{subject.display_order ?? 0}</span>
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(subject)}
              title="Edit subject"
              className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subject.subject_id)}
              title="Delete subject"
              className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-600 focus:ring-offset-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

const SubjectCard = memo(
  ({ subject, isSelected, onSelect, onEdit, onDelete, visibleColumns }: SubjectRowProps) => {
    const status = statusConfig[subject.status as keyof typeof statusConfig] ?? statusConfig.draft;

    return (
      <div
        className={cn(
          'bg-white rounded-lg border p-3 space-y-3 relative transition-all',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => onSelect(subject.subject_id)}
              className="mt-0.5 shrink-0 text-gray-300 hover:text-teal-600 transition-colors"
              title={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected ? (
                <CheckSquare className="h-4.5 w-4.5 text-teal-600" />
              ) : (
                <Square className="h-4.5 w-4.5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {subject.color_hex && (
                  <span
                    ref={(node) => {
                      if (node) {
                        node.style.setProperty('--subject-color', subject.color_hex || '');
                      }
                    }}
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 bg-[var(--subject-color)]"
                    title={`Color: ${subject.color_hex}`}
                    aria-label={`Subject color: ${subject.color_hex}`}
                  />
                )}
                <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
                  {subject.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {visibleColumns.has('slug') && (
                  <code className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 rounded">
                    {subject.slug}
                  </code>
                )}
                {visibleColumns.has('display_order') && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    Order: {subject.display_order ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>
          {visibleColumns.has('status') && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                status.bgColor,
                status.textColor
              )}
            >
              <span className={cn('w-1 h-1 rounded-full', status.dotColor)} />
              {status.label}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/50 rounded-md border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Icon
            </span>
            {subject.icon_url ? (
              <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center">
                <img src={subject.icon_url} alt="" className="w-4 h-4 object-contain" />
              </div>
            ) : (
              <span className="text-gray-300 text-xs">&mdash;</span>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(subject)}
              className="h-8 px-3 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 gap-1.5 font-medium text-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subject.subject_id)}
              className="h-8 px-3 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5 font-medium text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

const SUBJECT_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'Title' },
  { key: 'slug', header: 'Slug' },
  { key: 'status', header: 'Status' },
  { key: 'display_order', header: 'Order' },
];

const subjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  color_hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code (e.g. #0D9488)')
    .optional()
    .or(z.literal('')),
  display_order: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'published', 'live']).default('draft'),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

export function SubjectsPage() {
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

  // Reset form when dialog opens/closes or editing subject changes
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
    // Normalize text fields: trim whitespace, lowercase the slug
    const normalizedData = normalizeFormData(data, {
      trim: ['title', 'description'],
      lowercase: ['slug', 'color_hex'],
    });

    try {
      // Pre-flight check for slug availability
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

      // Handle Supabase/Postgres 409 Conflict (Duplicate Key)
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

        // Normalize status
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

  return (
    <>
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        actions={[
          {
            label: 'Set Live',
            onClick: () => handleBulkStatusUpdate('live'),
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            className: 'text-emerald-400 hover:bg-emerald-500/10',
          },
          {
            label: 'Draft',
            onClick: () => handleBulkStatusUpdate('draft'),
            className: 'text-slate-400 hover:bg-slate-500/10',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6" data-hydration-complete={!isLoading}>
        <AdminHeader
          title="Subjects"
          description="Manage subjects."
          icon={Boxes}
          className="mb-2"
          actions={
            <Button
              onClick={() => handleOpenDialog()}
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Subject
            </Button>
          }
        />

        {/* Card Header: Main Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">
                Count
              </span>
              <span className="text-xs font-bold text-teal-600 tabular-nums">
                {filteredSubjects.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <select
                  aria-label="Filter by status"
                  title="Filter by status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'live')
                  }
                  className="bg-transparent border-none text-xs font-bold text-gray-600 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <ColumnToggle
                columns={SUBJECT_COLUMNS}
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

              <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

              <DataToolbar
                data={subjects ?? []}
                columns={SUBJECT_COLUMNS}
                entityName="Subjects"
                onImport={handleImport}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-100 hover:bg-gray-50">
                  <TableHead className="w-8 px-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-300 hover:text-teal-600 transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.has('title') && (
                    <TableHead className="px-4">
                      <SortableHeader
                        label="Title"
                        column="title"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('slug') && (
                    <TableHead className="hidden md:table-cell">
                      <SortableHeader
                        label="Slug"
                        column="slug"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.has('icon_url') && (
                    <TableHead className="px-2 text-center hidden sm:table-cell w-12 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      Icon
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
                  {visibleColumns.has('display_order') && (
                    <TableHead className="hidden lg:table-cell text-center">
                      <SortableHeader
                        label="Order"
                        column="display_order"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-right px-4 border-l border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="even:bg-gray-50/40">
                      <TableCell className="w-8 px-2" />
                      {visibleColumns.has('title') && (
                        <TableCell className="px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-3.5 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.has('slug') && (
                        <TableCell className="hidden md:table-cell">
                          <div className="h-3.5 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </TableCell>
                      )}
                      {visibleColumns.has('icon_url') && (
                        <TableCell className="px-2 hidden sm:table-cell">
                          <div className="h-6 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        </TableCell>
                      )}
                      {visibleColumns.has('status') && (
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                        </TableCell>
                      )}
                      {visibleColumns.has('display_order') && (
                        <TableCell className="hidden lg:table-cell">
                          <div className="h-3.5 bg-gray-200 rounded w-6 animate-pulse"></div>
                        </TableCell>
                      )}
                      <TableCell className="px-4">
                        <div className="flex gap-0.5 justify-end">
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : subjects?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20">
                      <EmptyState
                        icon={Boxes}
                        title="No subjects yet"
                        description="Create your first subject to get started."
                        action={
                          <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                          >
                            New Subject
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubjects.map((s) => (
                    <SubjectRow
                      key={s.subject_id}
                      subject={s}
                      isSelected={selectedIds.has(s.subject_id)}
                      onSelect={handleSelectOne}
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                      visibleColumns={visibleColumns}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-3 bg-gray-50/30">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : subjects?.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Boxes}
                  title="No subjects yet"
                  description="Create your first subject to get started."
                  action={
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                    >
                      New Subject
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedSubjects.map((s) => (
                  <SubjectCard
                    key={s.subject_id}
                    subject={s}
                    isSelected={selectedIds.has(s.subject_id)}
                    onSelect={handleSelectOne}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                    visibleColumns={visibleColumns}
                  />
                ))}
              </div>
            )}
          </div>

          {filteredSubjects.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredSubjects.length / pageSize)}
                totalCount={filteredSubjects.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="px-6 pt-6 pb-4 space-y-4">
                  <div>
                    <DialogTitle className="text-base font-semibold text-gray-900">
                      {editingSubject ? 'Edit' : 'Create'} Subject
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 mt-0.5">
                      {editingSubject
                        ? 'Update the subject details below.'
                        : 'Fill in the details to create a new subject.'}
                    </DialogDescription>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Mathematics"
                                {...field}
                                data-testid="subject-title"
                                className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Slug
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. math"
                                {...field}
                                disabled={Boolean(editingSubject)}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                                  )
                                }
                                data-testid="subject-slug"
                                className="h-9 rounded border border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none font-mono text-xs disabled:opacity-50 disabled:bg-gray-50"
                                required
                                pattern="[a-z0-9_]+"
                                title="Lowercase letters, numbers, and underscores only"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="color_hex"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Color
                            </FormLabel>
                            <div className="flex gap-2">
                              <div
                                style={
                                  {
                                    '--preview-color': field.value || '#0D9488',
                                  } as React.CSSProperties
                                }
                                className="h-9 w-9 rounded border border-gray-300 shrink-0 bg-[var(--preview-color)]"
                              />
                              <FormControl>
                                <Input
                                  placeholder="#0D9488"
                                  {...field}
                                  data-testid="subject-color"
                                  className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none w-full text-sm"
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="display_order"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Order
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                data-testid="subject-order"
                                className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Status
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                                <SelectItem value="draft" className="text-sm">
                                  Draft
                                </SelectItem>
                                <SelectItem value="live" className="text-sm">
                                  Live
                                </SelectItem>
                                <SelectItem value="published" className="text-sm">
                                  Published
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Description{' '}
                            <span className="text-gray-400 font-normal">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description..."
                              {...field}
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-9 px-4 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSubject.isPending || updateSubject.isPending}
                    className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5"
                  >
                    {(createSubject.isPending || updateSubject.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {editingSubject ? 'UPDATE CLUSTER' : 'AUTHORIZE DEPLOYMENT'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(deleteConfirmation)}
          onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        >
          <AlertDialogContent className="max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {deleteConfirmation?.type === 'bulk'
                  ? `This will permanently delete ${selectedIds.size} subjects. This action cannot be undone.`
                  : 'This will permanently delete this subject. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={
                  deleteConfirmation?.type === 'bulk' ? confirmBulkDelete : confirmSingleDelete
                }
                className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

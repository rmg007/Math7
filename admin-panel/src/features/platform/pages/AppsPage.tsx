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
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { DataColumn } from '@/lib/data-utils';
import { normalizeFormData } from '@/lib/normalization';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  Layers,
  Layout,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useApps,
  useBulkCreateApps,
  useBulkDeleteApps,
  useBulkUpdateAppsStatus,
  useCreateApp,
  useDeleteApp,
  useUpdateApp,
  type AppInsert,
  type CompiledApp,
} from '../hooks/use-apps';

import { useSubjects } from '../hooks/use-subjects';

interface AppRowProps {
  app: CompiledApp;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (app: CompiledApp) => void;
  onDelete: (id: string) => void;
}

const AppRow = memo(({ app, isSelected, onSelect, onEdit, onDelete }: AppRowProps) => {
  return (
    <TableRow
      key={app.app_id}
      className={cn('group/row even:bg-gray-50/40', isSelected && 'bg-teal-50/50')}
    >
      <TableCell className="w-8 px-2">
        <button
          onClick={() => onSelect(app.app_id)}
          className="text-gray-300 hover:text-gray-500"
          aria-label={isSelected ? 'Deselect application' : 'Select application'}
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-teal-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </TableCell>
      <TableCell className="px-4">
        <span className="font-medium text-gray-900 text-xs truncate">{app.display_name}</span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-gray-500">{app.subjects?.title ?? 'Unlinked'}</span>
      </TableCell>
      <TableCell>
        <a
          href={`http://${app.subdomain}.questerix.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 group/link"
          title="Launch App"
        >
          <code className="text-xs text-teal-600 font-mono">{app.subdomain}.questerix.com</code>
          <ExternalLink className="w-3 h-3 text-gray-300 group-hover/link:text-teal-500" />
        </a>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <code className="text-xs text-gray-400 font-mono">questerix-student.pages.dev</code>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="text-xs text-gray-500">{app.grade_level || 'N/A'}</span>
      </TableCell>
      <TableCell>
        <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
      </TableCell>
      <TableCell className="px-4 text-right border-l border-gray-100">
        <div className="flex justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(app)}
            className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(app.app_id)}
            className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-600 focus:ring-offset-1"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

const APP_COLUMNS: DataColumn[] = [
  { key: 'display_name', header: 'Name' },
  { key: 'subdomain', header: 'Subdomain' },
  { key: 'is_active', header: 'Status' },
  { key: 'grade_level', header: 'Grade' },
];

const appSchema = z.object({
  subject_id: z.string().uuid('Please select a subject'),
  display_name: z.string().min(1, 'Display name is required'),
  subdomain: z
    .string()
    .min(1, 'Subdomain is required')
    .max(63, 'Subdomain must be less than 64 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and dashes'),
  grade_level: z.string().min(1, 'Grade level is required'),
  grade_number: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type AppFormData = z.infer<typeof appSchema>;

export function AppsPage() {
  const { data: apps, isLoading: appsLoading } = useApps();
  const { data: subjects } = useSubjects();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const bulkDelete = useBulkDeleteApps();
  const bulkUpdateStatus = useBulkUpdateAppsStatus();
  const bulkCreate = useBulkCreateApps();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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
      apps?.filter(
        (app) =>
          app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.subjects?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) || [],
    [apps, searchQuery]
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
      setSelectedIds(new Set(filteredApps.map((a) => a.app_id)));
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
    } catch (error) {
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
    } catch (error) {
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

        // Resolve subject_id from title if not provided
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

        // Normalize status
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
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: AppFormData) => {
    const normalizedData = normalizeFormData(data, {
      lowercase: ['display_name', 'subdomain', 'grade_level'],
    });

    try {
      if (editingApp) {
        await updateApp.mutateAsync({ id: editingApp.app_id, ...normalizedData });
        toast({ title: 'Success', description: 'Application updated' });
      } else {
        await createApp.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'Application created' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save application', variant: 'destructive' });
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
    } catch (error) {
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

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Applications"
        description="Manage apps and deployments."
        icon={Layout}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={apps as unknown as Record<string, unknown>[]}
              columns={APP_COLUMNS}
              entityName="Applications"
              onImport={handleImport}
            />
            <Button
              onClick={() => handleOpenDialog()}
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Application
            </Button>
          </div>
        }
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-teal-900 rounded-lg shadow-md">
          <div className="flex items-center gap-3 pl-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-semibold">
              {selectedIds.size}
            </span>
            <span className="text-xs text-teal-200 font-medium">selected</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate(true)}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10"
            >
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate(false)}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10"
            >
              Deactivate
            </Button>
            <div className="w-px h-5 bg-teal-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="h-7 px-3 rounded text-xs text-red-400 hover:text-white hover:bg-red-600 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 px-2 rounded text-xs text-teal-300 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Card Header: Search + Count */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
                title="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
          </span>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8 px-2">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-300 hover:text-gray-500"
                  aria-label={
                    isAllSelected ? 'Deselect all applications' : 'Select all applications'
                  }
                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="px-4">
                <SortableHeader
                  label="Name"
                  column="display_name"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Subject"
                  column="subject"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Subdomain"
                  column="subdomain"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead
                className="hidden lg:table-cell"
                title="Point your custom domain CNAME record to this target"
              >
                DNS Target
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortableHeader
                  label="Grade"
                  column="grade_level"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label="Status"
                  column="is_active"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right px-4 border-l border-gray-100">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="even:bg-gray-50/40">
                  <TableCell className="w-8 px-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="h-3.5 bg-gray-200 rounded w-28 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-3.5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-36 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex gap-0.5 justify-end">
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-20">
                  <EmptyState
                    icon={Layers}
                    title={searchQuery ? 'No matches found' : 'No applications yet'}
                    description={
                      searchQuery
                        ? `No applications match "${searchQuery}".`
                        : 'Create your first application to get started.'
                    }
                    action={
                      searchQuery ? (
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Search
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleOpenDialog()}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          New Application
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedApps.map((app) => (
                <AppRow
                  key={app.app_id}
                  app={app}
                  isSelected={selectedIds.has(app.app_id)}
                  onSelect={handleSelectOne}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>

        {filteredApps.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredApps.length / pageSize)}
              totalCount={filteredApps.length}
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
                  <h2 className="text-base font-semibold text-gray-900">
                    <DialogTitle>{editingApp ? 'Edit' : 'Create'} Application</DialogTitle>
                  </h2>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    {editingApp
                      ? 'Update the application details below.'
                      : 'Fill in the details to create a new application.'}
                  </DialogDescription>
                </div>

                {/* DNS Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">DNS required:</span> Map{' '}
                    <code className="font-mono bg-amber-100 px-1 rounded text-[11px]">
                      {form.watch('subdomain') || '...'}.questerix.com
                    </code>{' '}
                    to{' '}
                    <code className="font-mono bg-amber-100 px-1 rounded text-[11px]">
                      questerix-student.pages.dev
                    </code>{' '}
                    and add the subdomain as a Custom Domain in Cloudflare Pages.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Mathematics G12"
                              {...field}
                              data-testid="app-display-name"
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
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Subdomain
                          </FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input
                                placeholder="e.g. math-g12"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9-]/g, '')
                                      .slice(0, 63)
                                  )
                                }
                                data-testid="app-subdomain"
                                className="h-9 rounded-l rounded-r-none border border-r-0 border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none font-mono text-xs"
                                required
                                pattern="[a-z0-9-]+"
                                title="Lowercase letters, numbers, and dashes only"
                              />
                            </FormControl>
                            <span className="h-9 px-2 flex items-center bg-gray-50 border border-gray-300 rounded-r text-[11px] text-gray-500">
                              .questerix.com
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject_id"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-gray-700">Subject</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                            {subjects?.map((s) => (
                              <SelectItem
                                key={s.subject_id}
                                value={s.subject_id}
                                className="text-sm"
                              >
                                {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="grade_level"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Grade Level
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Grade 12"
                              {...field}
                              data-testid="app-grade-level"
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
                      name="grade_number"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Grade Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 rounded bg-gray-50 border border-gray-200 space-y-0">
                        <div className="flex items-center gap-3">
                          <Power
                            className={cn(
                              'w-4 h-4',
                              field.value ? 'text-teal-600' : 'text-gray-300'
                            )}
                          />
                          <div>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Active
                            </FormLabel>
                            <p className="text-[11px] text-gray-500 mt-0">
                              Make this app publicly available
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-teal-600"
                          />
                        </FormControl>
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
                  disabled={createApp.isPending || updateApp.isPending}
                  className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5"
                >
                  {(createApp.isPending || updateApp.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editingApp ? 'Update Application' : 'Create Application'}
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
                ? `This will permanently delete ${selectedIds.size} applications. This will also delete their associated landing pages. This action cannot be undone.`
                : 'This will permanently delete this application and its associated landing page. This action cannot be undone.'}
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
  );
}

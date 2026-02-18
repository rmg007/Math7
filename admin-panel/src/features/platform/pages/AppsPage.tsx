import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
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
import { normalizeFormData } from '@/lib/normalization';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ExternalLink,
  Layout,
  Layers,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useApps,
  useCreateApp,
  useDeleteApp,
  useUpdateApp,
  type CompiledApp,
} from '../hooks/use-apps';
import { useSubjects } from '../hooks/use-subjects';

interface AppRowProps {
  app: CompiledApp;
  onEdit: (app: CompiledApp) => void;
  onDelete: (id: string) => void;
}

const AppRow = memo(({ app, onEdit, onDelete }: AppRowProps) => {
  return (
    <TableRow
      key={app.app_id}
      className="group/row even:bg-gray-50/40"
    >
      <TableCell className="px-4">
        <span className="font-medium text-gray-900 text-xs truncate">
          {app.display_name}
        </span>
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
          <code className="text-xs text-teal-600 font-mono">
            {app.subdomain}.questerix.com
          </code>
          <ExternalLink className="w-3 h-3 text-gray-300 group-hover/link:text-teal-500" />
        </a>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <code className="text-xs text-gray-400 font-mono">
          questerix-student.pages.dev
        </code>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="text-xs text-gray-500">
          {app.grade_level || 'N/A'}
        </span>
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
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<CompiledApp | null>(null);

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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteApp.mutateAsync(id);
        toast({ title: 'Deleted', description: 'Application has been removed.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' });
      }
    },
    [deleteApp, toast]
  );

  const filteredApps =
    apps?.filter(
      (app) =>
        app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.subjects?.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const sortedApps = [...filteredApps].sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aValue: any = a[sortBy as keyof CompiledApp];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bValue: any = b[sortBy as keyof CompiledApp];

    if (sortBy === 'subject') {
      aValue = a.subjects?.title || '';
      bValue = b.subjects?.title || '';
    }

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue < bValue ? -1 : 1;
    return sortOrder === 'asc' ? result : -result;
  });

  const paginatedApps = sortedApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Applications"
        description="Manage apps and deployments."
        icon={Layout}
        className="mb-2"
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Application
          </Button>
        }
      />

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
              <TableHead className="hidden lg:table-cell"
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
              <TableHead className="text-right px-4 border-l border-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="even:bg-gray-50/40">
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
                <TableCell colSpan={7} className="py-20">
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
                    {editingApp ? 'Update the application details below.' : 'Fill in the details to create a new application.'}
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
                      name="subject_id"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Subject
                          </FormLabel>
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
                                <SelectItem key={s.subject_id} value={s.subject_id} className="text-sm">
                                  {s.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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

              <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createApp.isPending || updateApp.isPending}
                  className="h-9 px-5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingApp ? 'Save Changes' : 'Create Application'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

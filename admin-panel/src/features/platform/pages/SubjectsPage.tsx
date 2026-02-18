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
import { normalizeFormData } from '@/lib/normalization';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateSubject,
  type Subject,
} from '../hooks/use-subjects';

interface SubjectRowProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  live: { label: 'Live', dotColor: 'bg-emerald-500', textColor: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  published: { label: 'Published', dotColor: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  draft: { label: 'Draft', dotColor: 'bg-gray-400', textColor: 'text-gray-700', bgColor: 'bg-gray-100' },
} as const;

const SubjectRow = memo(({ subject, onEdit, onDelete }: SubjectRowProps) => {
  const status = statusConfig[subject.status as keyof typeof statusConfig] ?? statusConfig.draft;

  return (
    <TableRow
      key={subject.subject_id}
      className="group/row border-b border-gray-200 hover:!bg-teal-50 even:bg-gray-50/40"
    >
      <TableCell className="px-4 py-1.5">
        <div className="flex items-center gap-2">
          {subject.color_hex && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
              style={{ backgroundColor: subject.color_hex }}
              title={subject.color_hex}
            />
          )}
          <span className="font-medium text-gray-900 text-xs truncate">
            {subject.title}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-1.5 hidden md:table-cell">
        <code className="text-xs text-gray-500 font-mono">
          {subject.slug}
        </code>
      </TableCell>
      <TableCell className="px-2 py-1.5 text-center hidden sm:table-cell w-12">
        {subject.icon_url ? (
          <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center mx-auto">
            <img src={subject.icon_url} alt="" className="w-4 h-4 object-contain" />
          </div>
        ) : (
          <span className="text-gray-300 text-xs">&mdash;</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-1.5">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', status.bgColor, status.textColor)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dotColor)} />
          {status.label}
        </span>
      </TableCell>
      <TableCell className="px-3 py-1.5 hidden lg:table-cell">
        <span className="text-xs text-gray-500 tabular-nums">
          {subject.display_order ?? 0}
        </span>
      </TableCell>
      <TableCell className="px-4 py-1.5 text-right border-l border-gray-100">
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
});

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
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('display_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

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
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.subject_id, ...normalizedData });
        toast({ title: 'Success', description: 'Subject updated' });
      } else {
        await createSubject.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'Subject created' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to persist subject data',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSubject.mutateAsync(id);
        toast({
          title: 'Subject Deleted',
          description:
            'The subject and all associated metadata have been removed from the platform.',
        });
      } catch (error: unknown) {
        let description = 'Failed to delete subject';

        // Handle constraint violation (Postgres error code 23503)
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === '23503'
        ) {
          description =
            'Cannot delete this subject because it is assigned to one or more Applications. Please reassign or delete the applications first.';
        }

        toast({
          title: 'Error',
          description,
          variant: 'destructive',
        });
      }
    },
    [deleteSubject, toast]
  );

  const filteredSubjects =
    subjects?.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    const aValue = a[sortBy as keyof Subject];
    const bValue = b[sortBy as keyof Subject];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue < bValue ? -1 : 1;
    return sortOrder === 'asc' ? result : -result;
  });

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
        title="Subjects"
        description="Manage subjects."
        icon={Boxes}
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded"
              title="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <span className="text-[11px] text-gray-500 whitespace-nowrap">
          {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-600 px-4 py-2.5 h-auto">
                  <SortableHeader
                    label="Title"
                    column="title"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-600 px-3 py-2.5 h-auto hidden md:table-cell">
                  <SortableHeader
                    label="Slug"
                    column="slug"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-600 px-2 py-2.5 h-auto text-center hidden sm:table-cell w-12">
                  Icon
                </TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-600 px-3 py-2.5 h-auto">
                  <SortableHeader
                    label="Status"
                    column="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-gray-600 px-3 py-2.5 h-auto hidden lg:table-cell">
                  <SortableHeader
                    label="Order"
                    column="display_order"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-right px-4 py-2.5 h-auto font-semibold text-[11px] uppercase tracking-wider text-gray-600 border-l border-gray-100">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-200 even:bg-gray-50/40">
                    <TableCell className="px-4 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3.5 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-1.5 hidden md:table-cell">
                      <div className="h-3.5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 hidden sm:table-cell">
                      <div className="h-6 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-3 py-1.5 hidden lg:table-cell">
                      <div className="h-3.5 bg-gray-200 rounded w-6 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-1.5">
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
                          Create Subject
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                sortedSubjects.map((s) => (
                  <SubjectRow
                    key={s.subject_id}
                    subject={s}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded border border-gray-200 bg-white p-0 overflow-hidden shadow-md max-w-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {editingSubject ? (
                      <Pencil className="w-5 h-5 text-white" />
                    ) : (
                      <Plus className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      <DialogTitle>{editingSubject ? 'Edit' : 'Create'} Subject</DialogTitle>
                    </h2>
                    <DialogDescription className="text-xs text-gray-600 mt-0">
                      {editingSubject ? 'Update details' : 'Add new subject'}
                    </DialogDescription>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Title
                          </FormLabel>
                          <FormControl>
                                                          <Input
                              placeholder="e.g. Mathematics"
                              {...field}
                              data-testid="subject-title"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-normal text-sm"
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Slug
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. math"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                                )
                              }
                              data-testid="subject-slug"
                              className="h-9 rounded border border-gray-300 bg-white text-teal-700 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-mono text-xs font-normal"
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Color
                          </FormLabel>
                          <div className="flex gap-2">
                            <div
                              className="h-9 w-9 rounded border border-gray-300 shrink-0"
                              style={{ backgroundColor: field.value || '#0D9488' }}
                            />
                            <FormControl>
                              <Input
                              placeholder="#0D9488"
                              {...field}
                              data-testid="subject-color"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-normal w-full text-sm"
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              data-testid="subject-order"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-normal text-sm"
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-gray-700">
                            Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-normal text-sm">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded border border-gray-200 shadow-sm">
                              <SelectItem value="draft" className="text-sm">Draft</SelectItem>
                              <SelectItem value="live" className="text-sm">Live</SelectItem>
                              <SelectItem value="published" className="text-sm">Published</SelectItem>
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
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-gray-700">
                          Description (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description..."
                            {...field}
                            className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 font-normal text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="bg-gray-50 p-4 flex gap-2 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-9 px-4 rounded text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSubject.isPending || updateSubject.isPending}
                  className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSubject ? 'Save' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

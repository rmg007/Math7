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

const SubjectRow = memo(({ subject, onEdit, onDelete }: SubjectRowProps) => {
  return (
    <TableRow
      key={subject.subject_id}
      className="border-b border-gray-200 hover:bg-neutral-100 transition-colors last:border-0"
    >
      <TableCell className="px-6 py-3">
        <span className="font-semibold text-gray-900 text-base">
          {subject.title}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <code className="px-2 py-1 rounded-md bg-gray-100 text-teal-600 font-mono text-xs font-medium border border-gray-300">
          {subject.slug}
        </code>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
            subject.status === 'live' && 'bg-emerald-100 text-emerald-700',
            subject.status === 'draft' && 'bg-amber-100 text-amber-700',
            subject.status === 'published' && 'bg-blue-100 text-blue-700'
          )}
        >
          {subject.status === 'live' ? 'Live' : subject.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-sm text-gray-600">
          {subject.display_order ?? 0}
        </span>
      </TableCell>
      <TableCell className="px-6 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(subject)}
            title="Edit subject"
            className="h-10 w-10 rounded-lg text-teal-600 hover:bg-teal-50 hover:text-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subject.subject_id)}
            title="Delete subject"
            className="h-10 w-10 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            <Trash2 className="w-4 h-4" />
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-6">
      <AdminHeader
        title="Subjects"
        description="Manage subjects."
        icon={Boxes}
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-colors gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg whitespace-nowrap">
          <span className="text-xs font-medium text-teal-700">
            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-white border-b border-gray-200">
                <TableHead className="font-semibold text-sm text-gray-700 px-6 py-3 h-auto">
                  <SortableHeader
                    label="Title"
                    column="title"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-sm text-gray-700 px-4 py-3 h-auto">
                  <SortableHeader
                    label="Slug"
                    column="slug"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-sm text-gray-700 px-4 py-3 h-auto">
                  <SortableHeader
                    label="Status"
                    column="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-sm text-gray-700 px-4 py-3 h-auto">
                  <SortableHeader
                    label="Order"
                    column="display_order"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="text-right px-6 py-3 h-auto font-semibold text-sm text-gray-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-200">
                    <TableCell className="px-6 py-3">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-6 bg-gray-200 rounded-md w-16 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex gap-2 justify-end">
                        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : subjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20">
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm">
                    {editingSubject ? (
                      <Pencil className="w-6 h-6 text-white" />
                    ) : (
                      <Plus className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      <DialogTitle>{editingSubject ? 'Edit Subject' : 'Create Subject'}</DialogTitle>
                    </h2>
                    <DialogDescription className="text-sm text-gray-600 mt-0.5">
                      {editingSubject ? 'Update subject details and settings' : 'Add a new subject to your curriculum'}
                    </DialogDescription>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Title
                          </FormLabel>
                          <FormControl>
                                                          <Input
                              placeholder="e.g. Mathematics"
                              {...field}
                              data-testid="subject-title"
                              className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-normal text-base"
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
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
                              className="h-11 rounded-lg border border-gray-300 bg-white text-teal-700 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-mono text-sm font-normal"
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

                  <div className="grid grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="color_hex"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Color
                          </FormLabel>
                          <div className="flex gap-3">
                            <div
                              className="h-11 w-11 rounded-lg border-2 border-gray-300 shrink-0 flex-shrink-0"
                              style={{ backgroundColor: field.value || '#0D9488' }}
                            />
                            <FormControl>
                              <Input
                              placeholder="#0D9488"
                              {...field}
                              data-testid="subject-color"
                              className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-normal w-full text-sm"
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              data-testid="subject-order"
                              className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-normal text-base"
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-normal text-base">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                              <SelectItem value="draft" className="font-normal">Draft</SelectItem>
                              <SelectItem value="live" className="font-normal">Live</SelectItem>
                              <SelectItem value="published" className="font-normal">Published</SelectItem>
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
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of this subject area"
                            {...field}
                            className="h-11 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-600/10 transition-colors font-normal text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="bg-gray-50 p-6 flex gap-3 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-10 px-6 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSubject.isPending || updateSubject.isPending}
                  className="h-10 px-6 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

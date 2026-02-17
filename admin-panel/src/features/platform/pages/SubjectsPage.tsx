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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Boxes, Layers, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
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
      className="group hover:bg-purple-50/30 transition-colors border-b border-gray-50 last:border-0"
    >
      <TableCell className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
            style={{
              backgroundColor: `${subject.color_hex}15`,
              border: `1px solid ${subject.color_hex}30`,
            }}
          >
            <Layers className="w-6 h-6" style={{ color: subject.color_hex || '#8b5cf6' }} />
          </div>
          <span className="font-black text-gray-900 tracking-tight text-base italic leading-none">
            {subject.title}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-5">
        <code className="px-3 py-1.5 rounded-xl bg-gray-100/50 text-purple-600 font-mono text-2xs font-black tracking-tight border border-gray-100">
          {subject.slug}
        </code>
      </TableCell>
      <TableCell className="py-5 text-center">
        {subject.icon_url ? (
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
            <img src={subject.icon_url} alt="" className="w-6 h-6 object-contain" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto shadow-sm italic text-2xs font-black text-gray-300">
            NONE
          </div>
        )}
      </TableCell>
      <TableCell className="py-5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-black text-gray-600">
            {subject.display_order ?? 0}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-5">
        <div className="flex items-center">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
              subject.status === 'live' && 'bg-emerald-50 text-emerald-600 border-emerald-100',
              subject.status === 'draft' && 'bg-gray-50 text-gray-500 border-gray-200',
              subject.status === 'published' && 'bg-blue-50 text-blue-600 border-blue-100'
            )}
          >
            {subject.status}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-8 py-5 text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(subject)}
            className="h-10 w-10 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subject.subject_id)}
            className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

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
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    color_hex: '',
    display_order: 1,
    status: 'draft' as 'draft' | 'published' | 'live',
  });

  const handleOpenDialog = useCallback(
    (subject?: Subject) => {
      if (subject) {
        setEditingSubject(subject);
        setFormData({
          title: subject.title,
          slug: subject.slug,
          description: subject.description || '',
          color_hex: subject.color_hex || '',
          display_order: subject.display_order ?? 1,
          status: (subject.status || 'draft') as 'draft' | 'published' | 'live',
        });
      } else {
        setEditingSubject(null);
        setFormData({
          title: '',
          slug: '',
          description: '',
          color_hex: '',
          display_order: (subjects?.length ?? 0) + 1,
          status: 'draft' as 'draft' | 'published' | 'live',
        });
      }
      setIsDialogOpen(true);
    },
    [subjects?.length]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normalize text fields: trim whitespace, lowercase the slug
    const normalizedData = normalizeFormData(formData, {
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Subjects"
        description="Manage subjects."
        icon={Boxes}
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-2xs uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5 gap-3"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        }
      />

      {/* Search & Intelligence Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-xl transition-all"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/10 rounded-xl">
            <span className="text-2xs font-black text-purple-500 uppercase tracking-widest mr-2">
              Subjects:
            </span>
            <span className="text-sm font-black text-purple-700 tracking-tight">
              {filteredSubjects.length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 px-8 h-14">
                  <SortableHeader
                    label="Title"
                    column="title"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Slug"
                    column="slug"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14 text-center">
                  Icon
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Order"
                    column="display_order"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Status"
                    column="status"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="text-right px-8 h-14 font-black text-2xs uppercase tracking-widest text-gray-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={5} className="px-8 py-6">
                      <div className="h-10 bg-gray-100/50 rounded-2xl w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : subjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24">
                    <EmptyState
                      icon={Boxes}
                      title="No subjects found"
                      description="Create a subject to get started."
                      action={
                        <Button
                          onClick={() => handleOpenDialog()}
                          className="rounded-full px-8 shadow-md"
                        >
                          Add Subject
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
        <DialogContent className="rounded-[2.5rem] border-none bg-white/90 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                  {editingSubject ? (
                    <Pencil className="w-8 h-8 text-white" />
                  ) : (
                    <Plus className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">
                    <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
                  </h2>
                  <DialogDescription className="text-2xs font-black text-gray-400 uppercase tracking-widest mt-1">
                    {editingSubject ? `Editing subject` : 'Add a new subject'}
                  </DialogDescription>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="name"
                      className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                    >
                      Title
                    </Label>
                    <Input
                      id="name"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Mathematics"
                      required
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold italic"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="slug"
                      className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                    >
                      Slug
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. math"
                      required
                      pattern="[a-z0-9_]+"
                      title="Lowercase letters, numbers, and underscores only"
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-purple-600 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-mono text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="color"
                      className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                    >
                      Color
                    </Label>
                    <div className="flex gap-3">
                      <div
                        className="h-14 w-14 rounded-2xl border-2 border-dashed border-gray-200 shrink-0"
                        style={{ backgroundColor: formData.color_hex }}
                      />
                      <Input
                        id="color"
                        value={formData.color_hex}
                        onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                        placeholder="#8b5cf6"
                        className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="order"
                      className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                    >
                      Order
                    </Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: parseInt(e.target.value) })
                      }
                      required
                      className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="status"
                      className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                    >
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: 'draft' | 'live' | 'published') =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                        <SelectItem value="draft" className="font-bold">
                          Draft
                        </SelectItem>
                        <SelectItem value="live" className="font-bold text-emerald-600">
                          Live
                        </SelectItem>
                        <SelectItem value="published" className="font-bold text-blue-600">
                          Published
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="description"
                    className="text-2xs font-black text-gray-400 uppercase tracking-widest pl-1"
                  >
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief architectural scope of this knowledge domain"
                    className="h-14 rounded-2xl border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50/50 p-8 flex gap-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="h-12 px-8 rounded-2xl font-black text-2xs uppercase tracking-widest text-gray-400 hover:bg-gray-200 italic transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSubject.isPending || updateSubject.isPending}
                className="h-12 px-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-2xs uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5"
              >
                {editingSubject ? 'Save Changes' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

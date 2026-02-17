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
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  AlertTriangle,
  ExternalLink,
  Layers,
  Layout,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
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
      className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0"
    >
      <TableCell className="px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 tracking-tight text-base line-clamp-1">
            {app.display_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-bold text-gray-700">{app.subjects?.title ?? 'Unlinked'}</span>
      </TableCell>
      <TableCell>
        <a
          href={`http://${app.subdomain}.questerix.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group/link hover:opacity-80 transition-opacity"
          title="Launch App"
        >
          <span className="font-mono text-xs font-black text-indigo-500 tracking-tighter decoration-indigo-200 underline-offset-4 group-hover/link:underline">
            {app.subdomain}.questerix.com
          </span>
          <ExternalLink className="w-3 h-3 text-indigo-300 opacity-0 group-hover/link:opacity-100 transition-all -ml-1" />
        </a>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs font-bold text-gray-500">
          questerix-student.pages.dev
        </span>
      </TableCell>
      <TableCell>
        <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 uppercase tracking-widest inline-block border border-gray-200/50">
          {app.grade_level || 'N/A'}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
      </TableCell>
      <TableCell className="px-8 py-5 text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(app)}
            className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
            title="Edit Application"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(app.app_id)}
            className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
            title="Delete Application"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

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
  const [formData, setFormData] = useState({
    subject_id: '',
    display_name: '',
    subdomain: '',
    grade_level: '',
    grade_number: 0,
    is_active: true,
  });

  const handleOpenDialog = useCallback(
    (app?: CompiledApp) => {
      if (app) {
        setEditingApp(app);
        setFormData({
          subject_id: app.subject_id || '',
          display_name: app.display_name,
          subdomain: app.subdomain,
          grade_level: app.grade_level || '',
          grade_number: app.grade_number || 0,
          is_active: app.is_active || false,
        });
      } else {
        setEditingApp(null);
        setFormData({
          subject_id: subjects && subjects.length > 0 ? subjects[0].subject_id : '',
          display_name: '',
          subdomain: '',
          grade_level: '',
          grade_number: 0,
          is_active: true,
        });
      }
      setIsDialogOpen(true);
    },
    [subjects]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) {
      toast({ title: 'Error', description: 'Please select a subject', variant: 'destructive' });
      return;
    }

    // Normalize all text fields to lowercase to prevent case-mismatch issues
    const normalizedData = normalizeFormData(formData, {
      lowercase: ['display_name', 'subdomain', 'grade_level'],
    });

    try {
      if (editingApp) {
        await updateApp.mutateAsync({ id: editingApp.app_id, ...normalizedData });
        toast({ title: 'Success', description: 'App updated successfully' });
      } else {
        await createApp.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'App created successfully' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save app', variant: 'destructive' });
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteApp.mutateAsync(id);
        toast({
          title: 'Deployment Purged',
          description: 'The application cluster and all associated data have been deleted.',
        });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete app', variant: 'destructive' });
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

    // Special handling for nested fields or computed values if needed
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="Applications"
        description="Manage apps and deployments."
        icon={Layout}
        actions={
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-6 shadow-lg shadow-indigo-600/20 font-bold text-sm uppercase tracking-widest gap-2 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> New Application
          </Button>
        }
      />

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search clusters, subjects, or domains..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
            <span className="text-2xs font-black text-indigo-500 uppercase tracking-widest">
              Telemetry:
            </span>
            <span className="text-sm font-black text-indigo-700 tracking-tight">
              {filteredApps.length} ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 px-8 h-14">
                  <SortableHeader
                    label="Application Name"
                    column="display_name"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Cluster Subject"
                    column="subject"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Subdomain / Link"
                    column="subdomain"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  CNAME
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Tier/Grade"
                    column="grade_level"
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    onSort={handleSort}
                    className="text-2xs"
                  />
                </TableHead>
                <TableHead className="font-black text-2xs uppercase tracking-widest text-gray-400 h-14">
                  <SortableHeader
                    label="Status"
                    column="is_active"
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
              {appsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="px-8 py-6">
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24">
                    <EmptyState
                      icon={Layers}
                      title={searchQuery ? 'No matches discovered' : 'Zero Clusters Found'}
                      description={
                        searchQuery
                          ? `No application deployments match your search for "${searchQuery}".`
                          : 'The deployment matrix is currently empty. Initialize a new cluster subject to begin.'
                      }
                      action={
                        searchQuery ? (
                          <Button
                            onClick={() => {
                              setSearchQuery('');
                              setCurrentPage(1);
                            }}
                            className="rounded-full px-8 shadow-md"
                          >
                            Clear Search
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleOpenDialog()}
                            className="rounded-full px-8 shadow-md"
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
        </div>

        {filteredApps.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100">
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-3xl p-0 border-0 shadow-2xl bg-white">
          <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                {editingApp ? 'RECONFIGURE APP' : 'INITIATE DEPLOYMENT'}
              </DialogTitle>
              <DialogDescription className="text-indigo-100 text-[10px] font-bold uppercase tracking-extra-wide mt-0.5 italic">
                Define cluster parameters
              </DialogDescription>
            </div>
            <Layout className="w-8 h-8 text-white/20" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0"
          >
            <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-2xl flex gap-3">
              <div className="p-1.5 h-fit rounded-xl bg-orange-100 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-wide">
                  DNS Configuration Required
                </h4>
                <p className="text-[10px] text-orange-700 leading-tight font-medium">
                  After creating or changing a subdomain, you MUST update Cloudflare Pages DNS. Map{' '}
                  <span className="font-mono font-bold bg-orange-100 px-1 rounded">
                    {formData.subdomain || '...'}.questerix.com
                  </span>{' '}
                  to{' '}
                  <span className="font-mono font-bold bg-orange-100 px-1 rounded">
                    questerix-student.pages.dev
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  Primary Subject
                </Label>
                <Select
                  value={formData.subject_id ?? ''}
                  onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold text-sm">
                    <SelectValue placeholder="Identify Subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    {subjects?.map((s) => (
                      <SelectItem key={s.subject_id} value={s.subject_id} className="font-bold">
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="display_name"
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1"
                >
                  Display Alias
                </Label>
                <Input
                  id="display_name"
                  data-testid="app-display-name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Master Mathematics v7"
                  className="h-10 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="subdomain"
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1"
                  >
                    DNS Subdomain
                  </Label>
                </div>
                <div className="flex items-center gap-0 group">
                  <Input
                    id="subdomain"
                    data-testid="app-subdomain"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                          .slice(0, 63),
                      })
                    }
                    placeholder="m7"
                    className="h-10 rounded-l-xl rounded-r-none border-gray-200 border-r-0 focus:ring-0 focus:border-gray-200 font-mono font-black text-indigo-600 focus:ring-indigo-500/10 text-sm"
                    required
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and dashes only"
                  />
                  <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-r-xl text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    .questerix.com
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="grade_level"
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1"
                >
                  Target Grade/Tier
                </Label>
                <Input
                  id="grade_level"
                  data-testid="app-grade-level"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  placeholder="e.g. Grade 12 Advanced"
                  className="h-10 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 group hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                  <Power
                    className={cn(
                      'w-5 h-5 transition-colors',
                      formData.is_active ? 'text-indigo-600' : 'text-gray-300'
                    )}
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-xs font-black text-indigo-900 uppercase tracking-widest">
                    Active Status
                  </Label>
                  <p className="text-2xs text-indigo-400 font-bold uppercase tracking-tight italic">
                    Public availability toggle
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-col md:flex-row gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl font-black text-2xs uppercase tracking-widest text-gray-400"
              >
                Abort Changes
              </Button>
              <Button
                type="submit"
                disabled={createApp.isPending || updateApp.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-600/20 font-black text-xs uppercase tracking-widest"
              >
                {editingApp ? 'UPDATE CLUSTER' : 'AUTHORIZE DEPLOYMENT'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

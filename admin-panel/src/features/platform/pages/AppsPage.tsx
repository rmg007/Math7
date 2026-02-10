import { useState, useCallback, memo } from 'react';
import { Plus, Layout, Pencil, Trash2, Search, X, Layers, Globe, GraduationCap, Power, Activity } from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { useApps, useCreateApp, useUpdateApp, useDeleteApp, type CompiledApp } from '../hooks/use-apps';
import { useSubjects } from '../hooks/use-subjects';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface AppRowProps {
  app: CompiledApp;
  onEdit: (app: CompiledApp) => void;
  onDelete: (id: string) => void;
}

const AppRow = memo(({ app, onEdit, onDelete }: AppRowProps) => {
  return (
    <TableRow key={app.app_id} className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0">
      <TableCell className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
             <Layout className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-gray-900 tracking-tight text-base">{app.display_name}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {app.app_id.slice(0, 8)}...</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
             <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="font-bold text-gray-700">{app.subjects?.name ?? 'Unlinked'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-gray-300" />
          <span className="font-mono text-xs font-black text-indigo-500 tracking-tighter">{app.subdomain}.questerix.com</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="px-3 py-1 bg-gray-100 rounded-lg text-[11px] font-black text-gray-500 uppercase tracking-widest inline-block border border-gray-200/50">
           {app.grade_level || 'N/A'}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
      </TableCell>
      <TableCell className="px-8 py-5 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => onEdit(app)}
             className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
           >
             <Pencil className="w-4 h-4" />
           </Button>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => onDelete(app.app_id)}
             className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<CompiledApp | null>(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    display_name: '',
    subdomain: '',
    grade_level: '',
    grade_number: 0,
    is_active: true
  });

  const handleOpenDialog = useCallback((app?: CompiledApp) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        subject_id: app.subject_id || '',
        display_name: app.display_name,
        subdomain: app.subdomain,
        grade_level: app.grade_level || '',
        grade_number: app.grade_number || 0,
        is_active: app.is_active || false
      });
    } else {
      setEditingApp(null);
      setFormData({
        subject_id: subjects?.[0]?.subject_id ?? '',
        display_name: '',
        subdomain: '',
        grade_level: '',
        grade_number: 0,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  }, [subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) {
        toast({ title: "Error", description: "Please select a subject", variant: "destructive" });
        return;
    }
    try {
      if (editingApp) {
        await updateApp.mutateAsync({ id: editingApp.app_id, ...formData });
        toast({ title: "Success", description: "App updated successfully" });
      } else {
        await createApp.mutateAsync(formData);
        toast({ title: "Success", description: "App created successfully" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save app", variant: "destructive" });
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      toast({ title: "Deployment Purged", description: "The application cluster and all associated data have been deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete app", variant: "destructive" });
    }
  }, [deleteApp, toast]);

  const filteredApps = apps?.filter(app => 
    app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const paginatedApps = filteredApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Applications"
        description="Manage the multi-tenant subject ecosystem and specialized deployments."
        icon={Layout}
        breadcrumbs={[
          { label: 'Deployment', href: '/platform/apps' },
          { label: 'Applications', href: '/platform/apps' }
        ]}
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
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Telemetry:</span>
             <span className="text-sm font-black text-indigo-700 tracking-tight">{filteredApps.length} ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Deployment Matrix</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Active Application Registry</p>
          </div>
          <Activity className="h-5 w-5 text-gray-200" />
        </div>
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 px-8 h-14">Application Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Cluster Subject</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Subdomain</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Tier/Grade</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-14">Status</TableHead>
                <TableHead className="text-right px-8 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-8 py-6">
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24">
                    <EmptyState
                      icon={Layers}
                      title={searchQuery ? "No matches discovered" : "Zero Clusters Found"}
                      description={searchQuery 
                        ? `No application deployments match your search for "${searchQuery}".` 
                        : "The deployment matrix is currently empty. Initialize a new cluster subject to begin."}
                      action={searchQuery ? {
                        label: "Clear Search",
                        onClick: () => { setSearchQuery(''); setCurrentPage(1); }
                      } : {
                        label: "New Application",
                        onClick: () => handleOpenDialog()
                      }}
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
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl backdrop-blur-3xl bg-white/90">
          <div className="bg-indigo-600 px-8 py-10 flex items-center justify-between">
             <div>
                <DialogTitle className="text-2xl font-black text-white tracking-tight">{editingApp ? 'RECONFIGURE APP' : 'INITIATE DEPLOYMENT'}</DialogTitle>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] mt-1 italic">Define cluster parameters</p>
             </div>
             <Layout className="w-10 h-10 text-white/20" />
          </div>
          
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Subject</Label>
                    <Select 
                        value={formData.subject_id} 
                        onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                    >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold">
                            <SelectValue placeholder="Identify Subject" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200">
                            {subjects?.map(s => (
                                <SelectItem key={s.subject_id} value={s.subject_id} className="font-bold">{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3">
                    <Label htmlFor="display_name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Alias</Label>
                    <Input 
                        id="display_name" 
                        value={formData.display_name} 
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} 
                        placeholder="e.g. Master Mathematics v7"
                        className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <Label htmlFor="subdomain" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">DNS Subdomain</Label>
                    <div className="flex items-center gap-0 group">
                        <Input 
                            id="subdomain" 
                            value={formData.subdomain} 
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })} 
                            placeholder="m7"
                            className="h-12 rounded-l-xl rounded-r-none border-gray-200 border-r-0 focus:ring-0 focus:border-gray-200 font-mono font-black text-indigo-600 focus:ring-indigo-500/10"
                            required
                        />
                        <div className="h-12 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-r-xl text-[10px] font-black text-gray-400 uppercase tracking-tighter">.questerix.com</div>
                    </div>
                </div>
                <div className="space-y-3">
                    <Label htmlFor="grade_level" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Grade/Tier</Label>
                    <Input 
                        id="grade_level" 
                        value={formData.grade_level} 
                        onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} 
                        placeholder="e.g. Grade 12 Advanced"
                        className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500/10 font-bold"
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                        <Power className={cn("w-5 h-5 transition-colors", formData.is_active ? "text-indigo-600" : "text-gray-300")} />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-xs font-black text-indigo-900 uppercase tracking-widest">Active Status</Label>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight italic">Public availability toggle</p>
                    </div>
                </div>
                <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} 
                    className="data-[state=checked]:bg-indigo-600"
                />
            </div>

            <DialogFooter className="pt-4 flex flex-col md:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400">Abort Changes</Button>
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

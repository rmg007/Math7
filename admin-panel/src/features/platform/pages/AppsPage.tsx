import { useState } from 'react';
import { Plus, Layout, Pencil, Trash2, Search, X } from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { useApps, useCreateApp, useUpdateApp, useDeleteApp, type App } from '../hooks/use-apps';
import { useSubjects } from '../hooks/use-subjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';

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
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    display_name: '',
    subdomain: '',
    grade_level: '',
    grade_number: 0,
    is_active: true
  });

  const handleOpenDialog = (app?: App) => {
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
  };

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will delete all content (domains, skills, questions) for this app!')) {
      try {
        await deleteApp.mutateAsync(id);
        toast({ title: "Success", description: "App deleted" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete app", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Applications"
        description="Manage grade-specific subject instances and multi-tenant configurations."
        icon={Layout}
        actions={
          <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4" /> Add Application
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-lg border border-gray-200 bg-white text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors text-base"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center justify-center gap-1 px-4 py-3 min-h-[48px] text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-500" />
            Platform Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : apps?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No applications found</TableCell></TableRow>
              ) : apps?.filter(app => 
                  app.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  app.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  app.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice((currentPage - 1) * pageSize, currentPage * pageSize).map((app) => (
                <TableRow key={app.app_id}>
                  <TableCell className="font-medium">{app.display_name}</TableCell>
                  <TableCell>{app.subjects?.name ?? 'Unknown'}</TableCell>
                  <TableCell className="font-mono text-xs">{app.subdomain}.questerix.com</TableCell>
                  <TableCell>{app.grade_level}</TableCell>
                  <TableCell>
                    <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => handleOpenDialog(app)}
                         className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                       >
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => handleDelete(app.app_id)}
                         className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {apps && apps.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil((apps?.length ?? 0) / pageSize)}
              totalCount={apps?.length ?? 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApp ? 'Edit Application' : 'Add Application'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select 
                        value={formData.subject_id} 
                        onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1b4b] border-white/10 text-white">
                            {subjects?.map(s => (
                                <SelectItem key={s.subject_id} value={s.subject_id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input 
                        id="display_name" 
                        value={formData.display_name} 
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} 
                        placeholder="e.g. Math 7th Grade"
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="subdomain" 
                            value={formData.subdomain} 
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })} 
                            placeholder="e.g. m7"
                            required
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">.questerix.com</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="grade_level">Grade Level</Label>
                    <Input 
                        id="grade_level" 
                        value={formData.grade_level} 
                        onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} 
                        placeholder="e.g. 7th Grade"
                        required
                    />
                </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-[10px] text-muted-foreground">App is visible for students</p>
                </div>
                <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} 
                />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createApp.isPending || updateApp.isPending}>
                {editingApp ? 'Save Changes' : 'Create Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

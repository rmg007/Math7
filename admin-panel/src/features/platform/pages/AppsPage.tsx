import { useState } from 'react';
import { Plus, Layout } from 'lucide-react';
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

export function AppsPage() {
  const { data: apps, isLoading: appsLoading } = useApps();
  const { data: subjects } = useSubjects();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const { toast } = useToast();

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">Manage grade-specific subject instances</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Application
        </Button>
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
              ) : apps?.map((app) => (
                <TableRow key={app.app_id}>
                  <TableCell className="font-medium">{app.display_name}</TableCell>
                  <TableCell>{app.subjects?.name ?? 'Unknown'}</TableCell>
                  <TableCell className="font-mono text-xs">{app.subdomain}.questerix.com</TableCell>
                  <TableCell>{app.grade_level}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      app.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                    }`}>
                      {app.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => handleOpenDialog(app)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(app.app_id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

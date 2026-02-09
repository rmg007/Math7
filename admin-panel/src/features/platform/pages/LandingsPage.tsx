import { useState } from 'react';
import { Globe, Pencil, Save, ChevronLeft, Plus } from 'lucide-react';
import { useLandingPages, useUpdateLandingPage, useCreateLandingPage, type LandingPage } from '../hooks/use-landings';
import { useApps } from '../hooks/use-apps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export function LandingsPage() {
  const { data: landings, isLoading } = useLandingPages();
  const { data: apps } = useApps();
  const updateLanding = useUpdateLandingPage();
  const createLanding = useCreateLandingPage();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const [editingLanding, setEditingLanding] = useState<LandingPage | null>(null);
  const [formData, setFormData] = useState({
    hero_headline: '',
    hero_subheadline: '',
    meta_title: '',
    meta_description: ''
  });

  const handleEdit = (landing: LandingPage) => {
    setEditingLanding(landing);
    setFormData({
      hero_headline: landing.hero_headline || '',
      hero_subheadline: landing.hero_subheadline || '',
      meta_title: landing.meta_title || '',
      meta_description: landing.meta_description || ''
    });
  };

  const handleSave = async () => {
    if (!editingLanding) return;
    try {
      await updateLanding.mutateAsync({ 
        id: editingLanding.landing_page_id, 
        ...formData 
      });
      toast({ title: "Success", description: "Landing page updated" });
      setEditingLanding(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update landing page", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!selectedAppId) {
      toast({ title: "Error", description: "Please select an app", variant: "destructive" });
      return;
    }
    
    // Check if app already has a landing page
    const existing = landings?.find(l => l.app_id === selectedAppId);
    if (existing) {
      toast({ title: "Notice", description: "This app already has a landing page. Editing existing one." });
      handleEdit(existing);
      setIsCreateDialogOpen(false);
      return;
    }

    try {
      const newLanding = await createLanding.mutateAsync({
        app_id: selectedAppId,
        hero_headline: 'Welcome to our platform',
        hero_subheadline: 'Learn something new today with our curated curriculum.',
        slug: apps?.find(a => a.app_id === selectedAppId)?.subdomain || '',
        meta_title: apps?.find(a => a.app_id === selectedAppId)?.display_name || 'Landing Page',
        meta_description: 'Discover the best learning experience.'
      });
      toast({ title: "Success", description: "Landing page created" });
      setIsCreateDialogOpen(false);
      handleEdit(newLanding);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create landing page", variant: "destructive" });
    }
  };

  if (editingLanding) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setEditingLanding(null)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Edit Landing Page</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Headline</Label>
                <Input 
                  value={formData.hero_headline} 
                  onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hero Subtext</Label>
                <Textarea 
                  rows={4}
                  value={formData.hero_subheadline} 
                  onChange={(e) => setFormData({ ...formData, hero_subheadline: e.target.value })} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input 
                  value={formData.meta_title} 
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  rows={4}
                  value={formData.meta_description} 
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setEditingLanding(null)}>Cancel</Button>
          <Button onClick={handleSave} className="gap-2" disabled={updateLanding.isPending}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Landing Pages</h2>
          <p className="text-muted-foreground">Manage SEO and marketing content for each application</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Landing Page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Active Landing Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Headline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : landings?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">No landing pages found</TableCell></TableRow>
              ) : landings?.map((l) => (
                <TableRow key={l.landing_page_id}>
                  <TableCell className="font-medium">{l.apps?.display_name}</TableCell>
                  <TableCell className="font-mono text-xs">{l.apps?.subdomain}.questerix.com</TableCell>
                  <TableCell className="max-w-md truncate">{l.hero_headline || 'No headline'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(l)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Landing Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Application</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select App" />
                </SelectTrigger>
                <SelectContent>
                  {apps?.filter(app => !landings?.some(l => l.app_id === app.app_id)).map(app => (
                    <SelectItem key={app.app_id} value={app.app_id}>{app.display_name}</SelectItem>
                  ))}
                  {apps?.filter(app => !landings?.some(l => l.app_id === app.app_id)).length === 0 && (
                     <div className="p-2 text-xs text-center text-muted-foreground">No apps without landing pages available.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLanding.isPending}>
              {createLanding.isPending ? 'Creating...' : 'Create Landing Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

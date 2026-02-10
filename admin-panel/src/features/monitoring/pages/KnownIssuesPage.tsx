import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Shield,
  LifeBuoy,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Bug,
  X
} from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { useKnownIssues, type KnownIssue } from '../hooks/use-known-issues';
import { useCreateKnownIssue, useUpdateKnownIssue, useDeleteKnownIssue } from '../hooks/use-known-issues-mutations';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/database.types';

type KnownIssueInsert = Database['public']['Tables']['known_issues']['Insert'];
type KnownIssueUpdate = Database['public']['Tables']['known_issues']['Update'];

export function KnownIssuesPage() {
  const { data: issues, isLoading } = useKnownIssues();
  const createIssue = useCreateKnownIssue();
  const updateIssue = useUpdateKnownIssue();
  const deleteIssue = useDeleteKnownIssue();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<KnownIssue | null>(null);
  const [formData, setFormData] = useState<KnownIssueInsert>({
    title: '',
    description: '',
    status: 'open',
    severity: 'medium',
    root_cause: '',
    resolution: '',
    sentry_link: ''
  });

  const filteredIssues = issues?.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (issue.root_cause?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (issue?: KnownIssue) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData({
        title: issue.title,
        description: issue.description || '',
        status: issue.status || 'open',
        severity: issue.severity || 'medium',
        root_cause: issue.root_cause || '',
        resolution: issue.resolution || '',
        sentry_link: issue.sentry_link || ''
      });
    } else {
      setEditingIssue(null);
      setFormData({
        title: '',
        description: '',
        status: 'open',
        severity: 'medium',
        root_cause: '',
        resolution: '',
        sentry_link: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIssue) {
        const updates: KnownIssueUpdate = {};
        if (formData.title !== undefined) updates.title = formData.title;
        if (formData.description !== undefined) updates.description = formData.description;
        if (formData.status !== undefined) updates.status = formData.status;
        if (formData.severity !== undefined) updates.severity = formData.severity;
        if (formData.root_cause !== undefined) updates.root_cause = formData.root_cause;
        if (formData.resolution !== undefined) updates.resolution = formData.resolution;
        if (formData.sentry_link !== undefined) updates.sentry_link = formData.sentry_link;

        await updateIssue.mutateAsync({ 
          id: editingIssue.id, 
          updates
        });
        toast({ title: "Success", description: "Issue updated successfully" });
      } else {
        await createIssue.mutateAsync(formData);
        toast({ title: "Success", description: "Issue created successfully" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save issue", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteIssue.mutateAsync(id);
      toast({ title: "Issue Vaporized", description: "The vulnerability has been purged from history." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete issue", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <StatusBadge status="inactive" label="Unknown" />;
    
    const icon = status === 'open' ? <AlertCircle className="w-3 h-3" /> : 
                 status === 'recurring' ? <Clock className="w-3 h-3" /> :
                 status === 'closed' ? <CheckCircle2 className="w-3 h-3" /> : undefined;

    const statusType: StatusType = status === 'closed' ? 'resolved' : (status as StatusType);
    const label = status === 'closed' ? 'Resolved' : undefined;

    return <StatusBadge status={statusType} label={label} icon={icon} />;
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    return <StatusBadge status={severity as StatusType} className="font-semibold" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader 
        title="Stability Matrix"
        description="Tracked vulnerabilities, root causes, and documented resolutions."
        icon={Bug}
        breadcrumbs={[
          { label: 'Platform', href: '/apps' },
          { label: 'Stability', href: '/known-issues' },
          { label: 'Matrix', href: '/known-issues' }
        ]}
        actions={
          <Button 
            onClick={() => handleOpenDialog()}
            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-105 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> Record Issue
          </Button>
        }
      />

      {/* Stability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Tracked</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">{issues?.length ?? 0}</h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[100%]" />
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-widest">Global Stability Archive</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Active Bugs</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {issues?.filter(i => i.status === 'open' || i.status === 'recurring').length ?? 0}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500" 
              style={{ width: `${(issues?.filter(i => i.status === 'open' || i.status === 'recurring').length ?? 0) / (issues?.length || 1) * 100}%` }} 
            />
          </div>
          <p className="text-[10px] text-amber-600 mt-3 font-bold uppercase tracking-widest font-mono">Requires Attention</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Resolved</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">{issues?.filter(i => i.status === 'closed').length ?? 0}</h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${(issues?.filter(i => i.status === 'closed').length ?? 0) / (issues?.length || 1) * 100}%` }} 
            />
          </div>
          <p className="text-[10px] text-emerald-600 mt-3 font-bold uppercase tracking-widest">Archived & Documented</p>
        </div>
      </div>

      {/* Stability Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search vulnerabilities by title or root cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter:</span>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto min-w-[120px] h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-gray-700 hover:text-indigo-600 transition-colors uppercase italic tracking-tight">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                  <SelectItem value="all" className="rounded-xl py-2 font-bold text-xs italic">ALL VULNERABILITIES</SelectItem>
                  <SelectItem value="open" className="rounded-xl py-2 font-bold text-xs italic">ACTIVE BUGS</SelectItem>
                  <SelectItem value="recurring" className="rounded-xl py-2 font-bold text-xs italic">RECURRING EVENTS</SelectItem>
                  <SelectItem value="closed" className="rounded-xl py-2 font-bold text-xs italic">RESOLVED ISSUES</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/10 rounded-xl flex items-center gap-2">
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Archive:</span>
             <span className="text-sm font-black text-indigo-700 tracking-tight">{filteredIssues?.length || 0} ITEMS</span>
          </div>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden border-indigo-100/50">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div>
            <CardTitle className="text-lg">Issue Library</CardTitle>
            <CardDescription>Click an issue to view details and technical root causes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="w-[40%]">Issue Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading issues...</TableCell>
                </TableRow>
              ) : filteredIssues?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No issues found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues?.map((issue) => (
                  <TableRow 
                    key={issue.id} 
                    className="group cursor-pointer hover:bg-indigo-50/20"
                    onClick={() => handleOpenDialog(issue)}
                  >
                    <TableCell>
                      <div className="font-medium group-hover:text-indigo-600 transition-colors">{issue.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{issue.description || 'No description provided'}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {issue.sentry_link && (
                          <Button variant="ghost" size="icon" asChild title="View on Sentry" className="h-8 w-8">
                            <a href={issue.sentry_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-indigo-400 hover:text-indigo-600" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(issue);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDelete(issue.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIssue ? 'Edit Known Issue' : 'Record New Issue'}</DialogTitle>
            <DialogDescription>
              {editingIssue ? 'Update the details and status of this issue.' : 'Document a new bug or system limitation.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="e.g. Authentication loop on iOS 17"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status ?? 'open'} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="closed">Resolved (Closed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={formData.severity ?? 'medium'} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, severity: val }))}
                >
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Cosmetic)</SelectItem>
                    <SelectItem value="medium">Medium (User Impact)</SelectItem>
                    <SelectItem value="high">High (Feature Broken)</SelectItem>
                    <SelectItem value="critical">Critical (System Down)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue, steps to reproduce, or observed behavior..."
                className="min-h-[100px]"
                value={formData.description ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="root_cause">Root Cause (Technical)</Label>
              <Textarea
                id="root_cause"
                placeholder="Why is this happening? (Optional)"
                className="min-h-[80px] font-mono text-sm bg-slate-50"
                value={formData.root_cause ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, root_cause: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution / Workaround</Label>
              <Textarea
                id="resolution"
                placeholder="How was it fixed, or how can users avoid it? (Optional)"
                className="min-h-[80px]"
                value={formData.resolution ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentry_link">Sentry Issue Link</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-10 bg-slate-100 rounded border border-slate-200">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
                <Input
                  id="sentry_link"
                  placeholder="https://sentry.io/organizations/..."
                  value={formData.sentry_link ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sentry_link: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingIssue ? 'Save Changes' : 'Record Issue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

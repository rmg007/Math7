import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Shield,
  LifeBuoy,
  Plus,
  Pencil,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useKnownIssues, type KnownIssue } from '../hooks/use-known-issues';
import { useCreateKnownIssue, useUpdateKnownIssue, useDeleteKnownIssue } from '../hooks/use-known-issues-mutations';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    if (window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) {
      try {
        await deleteIssue.mutateAsync(id);
        toast({ title: "Success", description: "Issue deleted" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete issue", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Open</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1 border-none"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      case 'recurring':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Recurring</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'text-gray-600';
    switch (severity) {
      case 'critical': return 'text-red-600 font-bold';
      case 'high': return 'text-orange-600 font-semibold';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Known Issues
          </h2>
          <p className="text-muted-foreground mt-1">
            Tracked bugs, their root causes, and resolutions.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" /> Record Issue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Total Tracked</p>
                <p className="text-2xl font-bold text-indigo-700">{issues?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Active Bugs</p>
                <p className="text-2xl font-bold text-amber-700">
                  {issues?.filter(i => i.status === 'open' || i.status === 'recurring').length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">Fixed & Documented</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {issues?.filter(i => i.status === 'closed').length ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden border-indigo-100/50">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Issue Library</CardTitle>
              <CardDescription>Click an issue to view details. Search by title, description, or root cause.</CardDescription>
            </div>
            <div className="flex items-center gap-2 max-w-md w-full">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="closed">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <TableCell>
                      <span className={`text-xs uppercase tracking-wider ${getSeverityColor(issue.severity)}`}>
                        {issue.severity || 'Unknown'}
                      </span>
                    </TableCell>
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

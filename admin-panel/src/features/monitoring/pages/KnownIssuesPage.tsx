import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/lib/database.types';
import type { OracleResult } from '@/services/OracleService';
import DOMPurify from 'dompurify';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useKnownIssues, type KnownIssue } from '../hooks/use-known-issues';
import {
  useCreateKnownIssue,
  useDeleteKnownIssue,
  useUpdateKnownIssue,
} from '../hooks/use-known-issues-mutations';

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
  const [isOracleDialogOpen, setIsOracleDialogOpen] = useState(false);
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleResults, setOracleResults] = useState<OracleResult[]>([]);
  const [isOracleSearching, setIsOracleSearching] = useState(false);
  const [editingIssue, setEditingIssue] = useState<KnownIssue | null>(null);

  const [formData, setFormData] = useState<KnownIssueInsert>({
    title: '',
    description: '',
    status: 'open',
    severity: 'medium',
    root_cause: '',
    resolution: '',
    sentry_link: '',
  });

  const filteredIssues = issues?.filter((issue) => {
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
        sentry_link: issue.sentry_link || '',
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
        sentry_link: '',
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
          updates,
        });
        toast({ title: 'Success', description: 'Issue updated successfully' });
      } else {
        await createIssue.mutateAsync(formData);
        toast({ title: 'Success', description: 'Issue created successfully' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to save issue', variant: 'destructive' });
    }
  };

  const handleOracleSearch = async () => {
    if (!oracleQuery.trim()) return;
    setIsOracleSearching(true);
    try {
      const { OracleService } = await import('@/services/OracleService');
      const results = await OracleService.search(oracleQuery);
      setOracleResults(results);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Oracle Offline',
        description: 'Failed to query Project Oracle base.',
        variant: 'destructive',
      });
    } finally {
      setIsOracleSearching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteIssue.mutateAsync(id);
      toast({ title: 'Issue Purged', description: 'Stability has been restored.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete issue', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <StatusBadge status="inactive" label="Unknown" />;

    const icon =
      status === 'open' ? (
        <AlertCircle className="w-3 h-3" />
      ) : status === 'recurring' ? (
        <Clock className="w-3 h-3" />
      ) : status === 'closed' ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : undefined;

    const statusType: StatusType = status === 'closed' ? 'resolved' : (status as StatusType);
    const label = status === 'closed' ? 'Resolved' : undefined;

    return <StatusBadge status={statusType} label={label} icon={icon} />;
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    return <StatusBadge status={severity as StatusType} className="font-semibold" />;
  };

  const sanitizeHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8 pb-20">
      <AdminHeader
        title="Stability Matrix"
        description="Tracked issues and fixes."
        icon={Shield}
        actions={
          <div className="flex gap-3">
            <Button
              onClick={() => setIsOracleDialogOpen(true)}
              variant="outline"
              className="h-12 px-6 rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold uppercase tracking-widest text-2xs gap-2 hidden md:flex"
            >
              <LifeBuoy className="w-4 h-4" /> Consult Oracle
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-bold uppercase tracking-widest text-2xs gap-2 shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Record Issue
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xs font-black text-gray-400 uppercase tracking-widest leading-none">
                Total Tracked
              </p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {issues?.length ?? 0}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[100%]" />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xs font-black text-gray-400 uppercase tracking-widest leading-none">
                Active Bugs
              </p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {issues?.filter((i) => i.status === 'open' || i.status === 'recurring').length ?? 0}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{
                width: `${((issues?.filter((i) => i.status === 'open' || i.status === 'recurring').length ?? 0) / (issues?.length || 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/20 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xs font-black text-gray-400 uppercase tracking-widest leading-none">
                Resolved
              </p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                {issues?.filter((i) => i.status === 'closed').length ?? 0}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${((issues?.filter((i) => i.status === 'closed').length ?? 0) / (issues?.length || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search vulnerabilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm font-medium"
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

        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
            <span className="text-2xs font-black text-gray-400 uppercase tracking-widest">
              Filter:
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[120px] h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-gray-700 hover:text-indigo-600 transition-colors uppercase italic tracking-tight">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                <SelectItem value="all" className="rounded-xl py-2 font-bold text-xs italic">
                  ALL VULNERABILITIES
                </SelectItem>
                <SelectItem value="open" className="rounded-xl py-2 font-bold text-xs italic">
                  ACTIVE BUGS
                </SelectItem>
                <SelectItem value="recurring" className="rounded-xl py-2 font-bold text-xs italic">
                  RECURRING EVENTS
                </SelectItem>
                <SelectItem value="closed" className="rounded-xl py-2 font-bold text-xs italic">
                  RESOLVED ISSUES
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden border-indigo-100/50">
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading issues...
                  </TableCell>
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
                      <div className="font-medium group-hover:text-indigo-600 transition-colors">
                        {issue.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {sanitizeHtml(issue.description) || 'No description provided'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{getSeverityBadge(issue.severity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
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

      <Dialog open={isOracleDialogOpen} onOpenChange={setIsOracleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2rem] border-0 shadow-2xl p-0 overflow-hidden text-left">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <LifeBuoy className="w-32 h-32" />
            </div>
            <DialogHeader className="relative text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                </div>
                <span className="text-2xs font-black uppercase tracking-[0.3em] text-white/60">
                  Project Oracle Plus
                </span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-white mb-2">
                Knowledge Sync
              </DialogTitle>
              <DialogDescription className="text-indigo-100 opacity-80 text-sm max-w-md">
                Query the semantic knowledge base for architectural patterns and recovery protocols.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-white transition-colors" />
              <input
                placeholder="Enter technical query or error signature..."
                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl py-4 pl-12 pr-32 text-white placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all text-sm font-medium"
                value={oracleQuery}
                onChange={(e) => setOracleQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOracleSearch()}
              />
              <Button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl px-4 py-2 font-black text-2xs uppercase tracking-widest gap-2 h-10 shadow-lg"
                onClick={handleOracleSearch}
                disabled={isOracleSearching}
              >
                {isOracleSearching ? (
                  <div className="w-3 h-3 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Execute
              </Button>
            </div>
          </div>

          <div className="p-8 bg-white min-h-[300px]">
            {isOracleSearching ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                  Scanning Semantic Space...
                </p>
              </div>
            ) : oracleResults.length > 0 ? (
              <div className="space-y-6">
                <h4 className="text-2xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  Intelligence matches FOUND ({oracleResults.length})
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {oracleResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all"
                    >
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>FILE: {res.file_path.split('\\').pop()}</span>
                        <span className="text-indigo-500">
                          MATCH: {Math.round(res.similarity * 100)}%
                        </span>
                      </div>
                      <div className="text-xs leading-relaxed text-gray-700 font-medium italic line-clamp-4">
                        \"{res.content}\"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <LifeBuoy className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-sm font-bold text-gray-400">
                  Enter a query to begin synchronization.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle>{editingIssue ? 'Edit Known Issue' : 'Record New Issue'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-left block">
                Issue Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-left block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Issue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

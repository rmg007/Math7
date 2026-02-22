import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
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
import { DataColumn } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import type { OracleResult } from '@/services/OracleService';
import DOMPurify from 'dompurify';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  LifeBuoy,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useKnownIssues, type KnownIssue } from '../hooks/use-known-issues';
import {
  useBulkDeleteKnownIssues,
  useBulkUpdateKnownIssueStatus,
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
  const bulkUpdateStatus = useBulkUpdateKnownIssueStatus();
  const bulkDeleteIssues = useBulkDeleteKnownIssues();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOracleDialogOpen, setIsOracleDialogOpen] = useState(false);
  const [oracleQuery, setOracleQuery] = useState('');
  const [oracleResults, setOracleResults] = useState<OracleResult[]>([]);
  const [isOracleSearching, setIsOracleSearching] = useState(false);
  const [editingIssue, setEditingIssue] = useState<KnownIssue | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        toast({ title: 'Success', description: 'Issue updated' });
      } else {
        await createIssue.mutateAsync(formData);
        toast({ title: 'Success', description: 'Issue created' });
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
        title: 'Search Failed',
        description: 'Failed to query knowledge base.',
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
      toast({ title: 'Deleted', description: 'Issue has been removed.' });
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
    return <StatusBadge status={severity as StatusType} />;
  };

  const sanitizeHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  };

  const openCount =
    issues?.filter((i) => i.status === 'open' || i.status === 'recurring').length ?? 0;
  const resolvedCount = issues?.filter((i) => i.status === 'closed').length ?? 0;

  const columns: DataColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status' },
    { key: 'severity', header: 'Severity' },
    { key: 'root_cause', header: 'Root Cause' },
    { key: 'resolution', header: 'Resolution' },
    { key: 'created_at', header: 'Date' },
  ];

  const handleSelectAll = () => {
    if (!filteredIssues) return;
    if (selectedIds.size === filteredIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIssues.map((i) => i.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status });
      setSelectedIds(new Set());
      toast({
        title: 'Batch Updated',
        description: `Updated ${selectedIds.size} issues to ${status}.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update issues', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} issues?`)) return;
    try {
      await bulkDeleteIssues.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({ title: 'Batch Deleted', description: `Deleted ${selectedIds.size} issues.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete issues', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Known Issues"
        description="Tracked issues and fixes."
        icon={Shield}
        className="mb-2"
        actions={
          <div className="flex gap-2">
            <DataToolbar
              data={filteredIssues || []}
              columns={columns}
              entityName="Known Issues"
              importDisabled
            />
            <Button
              onClick={() => setIsOracleDialogOpen(true)}
              variant="outline"
              className="h-9 px-3 rounded border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 text-xs font-semibold gap-1.5 hidden md:flex"
            >
              <LifeBuoy className="w-3.5 h-3.5" /> Oracle
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Issue
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Total
            </span>
            <Shield className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{issues?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Open
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{openCount}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Resolved
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{resolvedCount}</p>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-teal-900 rounded-lg shadow-md animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 pl-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-semibold">
              {selectedIds.size}
            </span>
            <span className="text-xs text-teal-200 font-medium">selected</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('open')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              Reopen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('recurring')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
            >
              <Clock className="h-3 w-3" />
              Mark Recurring
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('closed')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-emerald-600 gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="h-7 px-3 rounded text-xs text-red-300 hover:text-white hover:bg-red-600 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
            <div className="w-px h-4 bg-teal-800 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 px-2 rounded text-xs text-teal-300 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Card Header: Search + Filter + Count */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
                title="Clear"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="recurring">Recurring</option>
              <option value="closed">Resolved</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {filteredIssues?.length || 0} {(filteredIssues?.length || 0) === 1 ? 'issue' : 'issues'}
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))
          ) : filteredIssues?.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No issues found.</div>
          ) : (
            filteredIssues?.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleOpenDialog(issue)}
                className={cn(
                  'p-4 space-y-3 active:bg-gray-50 transition-colors relative',
                  selectedIds.has(issue.id) && 'bg-teal-50/50'
                )}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="p-1.5 rounded-lg bg-gray-100/50 text-gray-400 shrink-0 border border-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOne(issue.id);
                      }}
                    >
                      {selectedIds.has(issue.id) ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {issue.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                        {sanitizeHtml(issue.description) || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {getStatusBadge(issue.status)}
                    {getSeverityBadge(issue.severity)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(issue);
                      }}
                      className="h-8 w-8 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(issue.id, e)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <Table className="w-full hidden md:table">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-3 w-8">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-300 hover:text-gray-500"
                  title="Select all"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredIssues?.length ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="px-4">Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Severity</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right px-4 border-l border-gray-100">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="even:bg-gray-50/40">
                  <TableCell className="px-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="space-y-1">
                      <div className="h-3.5 bg-gray-200 rounded w-40 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-56 animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-16 animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-20 animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex gap-0.5 justify-end">
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredIssues?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20">
                  <EmptyState
                    icon={Shield}
                    title={
                      searchTerm || statusFilter !== 'all' ? 'No matches found' : 'No known issues'
                    }
                    description={
                      searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'No issues have been recorded yet.'
                    }
                    action={
                      searchTerm || statusFilter !== 'all' ? (
                        <Button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleOpenDialog()}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          New Issue
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredIssues?.map((issue) => (
                <TableRow
                  key={issue.id}
                  className={cn(
                    'even:bg-gray-50/40 cursor-pointer transition-colors',
                    selectedIds.has(issue.id) && 'bg-teal-50'
                  )}
                  onClick={() => handleOpenDialog(issue)}
                >
                  <TableCell
                    className="px-3 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOne(issue.id);
                    }}
                  >
                    <button className="text-gray-300 hover:text-gray-500">
                      {selectedIds.has(issue.id) ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-4">
                    <div>
                      <span className="font-medium text-gray-900 text-xs">{issue.title}</span>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {sanitizeHtml(issue.description) || 'No description'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(issue.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getSeverityBadge(issue.severity)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-gray-500">
                      {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-right border-l border-gray-100">
                    <div
                      className="flex items-center justify-end gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(issue);
                        }}
                        className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={(e) => handleDelete(issue.id, e)}
                        className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Oracle Dialog */}
      <Dialog open={isOracleDialogOpen} onOpenChange={setIsOracleDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-2xl max-h-[85vh] overflow-y-auto">
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50 border border-teal-100">
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900">
                  Knowledge Search
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Query the knowledge base for patterns and fixes.
                </DialogDescription>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                placeholder="Enter query..."
                className="w-full pl-9 pr-24 py-2 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
                value={oracleQuery}
                onChange={(e) => setOracleQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOracleSearch()}
              />
              <Button
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1"
                onClick={handleOracleSearch}
                disabled={isOracleSearching}
              >
                {isOracleSearching ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )}
                Search
              </Button>
            </div>
          </div>

          <div className="px-6 pb-6 min-h-[200px]">
            {isOracleSearching ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Searching...</p>
              </div>
            ) : oracleResults.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[11px] text-gray-500">
                  {oracleResults.length} result(s) found
                </span>
                {oracleResults.map((res, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {res.file_path.split('\\').pop()}
                      </span>
                      <span className="text-[10px] text-teal-600 font-medium">
                        {Math.round(res.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-4">{res.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LifeBuoy className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-xs text-gray-400">Enter a query to search.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Issue Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-4 space-y-4">
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900">
                  {editingIssue ? 'Edit Issue' : 'New Issue'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  {editingIssue
                    ? 'Update the issue details below.'
                    : 'Fill in the details to record a new issue.'}
                </DialogDescription>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={formData.description ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Status</Label>
                    <Select
                      value={formData.status ?? 'open'}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                        <SelectItem value="open" className="text-sm">
                          Open
                        </SelectItem>
                        <SelectItem value="recurring" className="text-sm">
                          Recurring
                        </SelectItem>
                        <SelectItem value="closed" className="text-sm">
                          Resolved
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Severity</Label>
                    <Select
                      value={formData.severity ?? 'medium'}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, severity: v }))}
                    >
                      <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                        <SelectItem value="low" className="text-sm">
                          Low
                        </SelectItem>
                        <SelectItem value="medium" className="text-sm">
                          Medium
                        </SelectItem>
                        <SelectItem value="high" className="text-sm">
                          High
                        </SelectItem>
                        <SelectItem value="critical" className="text-sm">
                          Critical
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Root Cause <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={formData.root_cause ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, root_cause: e.target.value }))
                    }
                    placeholder="Why did this happen?"
                    className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Resolution <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={formData.resolution ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, resolution: e.target.value }))
                    }
                    placeholder="How was it fixed?"
                    className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                    rows={2}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">
                    Reference Link <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    value={formData.sentry_link ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sentry_link: e.target.value }))
                    }
                    placeholder="https://..."
                    className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createIssue.isPending || updateIssue.isPending}
                className="h-9 px-5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50"
              >
                {editingIssue ? 'Save Changes' : 'Create Issue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

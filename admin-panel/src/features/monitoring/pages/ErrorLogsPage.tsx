import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { DataColumn } from '@/lib/data-utils';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Info,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  ErrorLog,
  useBulkDeleteErrorLogs,
  useBulkUpdateErrorStatus,
  useDeleteErrorLog,
  useErrorLogs,
  useErrorLogStats,
  usePromoteToIssue,
  useUpdateErrorStatus,
} from '../hooks/use-error-logs';

export function ErrorLogsPage() {
  const { toast } = useToast();
  const { currentApp, isSuperAdmin } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteData, setPromoteData] = useState({ title: '', rootCause: '', resolution: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: errors,
    isLoading,
    refetch,
    isFetching,
  } = useErrorLogs(statusFilter, isSuperAdmin ? undefined : currentApp?.app_id);
  const { data: stats } = useErrorLogStats();
  const updateStatus = useUpdateErrorStatus();
  const deleteError = useDeleteErrorLog();
  const promoteToIssue = usePromoteToIssue();
  const bulkUpdateStatus = useBulkUpdateErrorStatus();
  const bulkDeleteErrors = useBulkDeleteErrorLogs();

  const filteredErrors = errors?.filter(
    (error) =>
      error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web':
        return <Globe className="w-3.5 h-3.5" />;
      case 'android':
      case 'ios':
        return <Smartphone className="w-3.5 h-3.5" />;
      default:
        return <Monitor className="w-3.5 h-3.5" />;
    }
  };

  const handlePromote = (error: ErrorLog) => {
    setPromoteData({
      title: `[${error.error_type}] ${error.error_message.slice(0, 60)}`,
      rootCause: '',
      resolution: '',
    });
    setSelectedError(error);
    setPromoteDialogOpen(true);
  };

  const submitPromote = async () => {
    if (!selectedError) return;

    await promoteToIssue.mutateAsync({
      errorId: selectedError.id,
      title: promoteData.title,
      rootCause: promoteData.rootCause,
      resolution: promoteData.resolution,
    });

    setPromoteDialogOpen(false);
    setSelectedError(null);
  };

  const handleDelete = async (error: ErrorLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await deleteError.mutateAsync(error.id);
      setSelectedError(null);
      toast({
        title: 'Error Log Deleted',
        description: 'The error log has been permanently removed.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete error log', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const statItems = [
    {
      label: 'New',
      value: stats?.new ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      label: 'Seen',
      value: stats?.seen ?? 0,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Ignored',
      value: stats?.ignored ?? 0,
      icon: EyeOff,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Resolved',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Issues',
      value: stats?.promoted ?? 0,
      icon: ArrowUpRight,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ];

  const columns: DataColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'error_message', header: 'Message' },
    { key: 'error_type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'platform', header: 'Platform' },
    { key: 'created_at', header: 'Date' },
  ];

  const handleSelectAll = () => {
    if (!filteredErrors) return;
    if (selectedIds.size === filteredErrors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredErrors.map((e) => e.id)));
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
        description: `Updated ${selectedIds.size} logs to ${status}.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update logs', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} logs?`)) return;
    try {
      await bulkDeleteErrors.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({ title: 'Batch Deleted', description: `Deleted ${selectedIds.size} logs.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete logs', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <AdminHeader
        title="Error Logs"
        description="View and manage application errors."
        icon={Bug}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={filteredErrors || []}
              columns={columns}
              entityName="Error Logs"
              importDisabled
            />
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-3 rounded border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Health Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={cn('rounded-lg border p-4 shadow-sm', item.bg, item.border)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                {item.label}
              </span>
              <item.icon className={cn('w-3.5 h-3.5', item.color)} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', item.color)}>{item.value}</p>
          </div>
        ))}
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
              onClick={() => handleBulkStatusUpdate('seen')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
            >
              <Eye className="h-3 w-3" />
              Mark Seen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('ignored')}
              className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
            >
              <EyeOff className="h-3 w-3" />
              Ignore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusUpdate('resolved')}
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
              placeholder="Search error logs..."
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
              <option value="new">New</option>
              <option value="seen">Seen</option>
              <option value="ignored">Ignored</option>
              <option value="resolved">Resolved</option>
              <option value="promoted">Issues</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            {filteredErrors?.length || 0} {(filteredErrors?.length || 0) === 1 ? 'error' : 'errors'}
          </span>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-3 w-8">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-300 hover:text-gray-500"
                  title="Select all"
                  aria-label={
                    selectedIds.size > 0 && selectedIds.size === filteredErrors?.length
                      ? 'Deselect all'
                      : 'Select all'
                  }
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredErrors?.length ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="w-10 text-center">Platform</TableHead>
              <TableHead className="px-4">Error</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
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
                  <TableCell className="text-center">
                    <div className="w-7 h-7 bg-gray-200 rounded mx-auto animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="space-y-1">
                      <div className="h-3.5 bg-gray-200 rounded w-32 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded-full w-14 animate-pulse" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-3.5 bg-gray-200 rounded w-28 animate-pulse" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex gap-0.5 justify-end">
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                      <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredErrors?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20">
                  <EmptyState
                    icon={CheckCircle2}
                    title={searchTerm ? 'No matches found' : 'No errors found'}
                    description={
                      searchTerm
                        ? `No errors match "${searchTerm}".`
                        : 'Your app is running smoothly.'
                    }
                    action={
                      searchTerm ? (
                        <Button
                          onClick={() => setSearchTerm('')}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
                        >
                          Clear Search
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredErrors?.map((error) => (
                <TableRow
                  key={error.id}
                  onClick={() => setSelectedError(error)}
                  className={cn(
                    'even:bg-gray-50/40 cursor-pointer transition-colors',
                    selectedIds.has(error.id) && 'bg-teal-50'
                  )}
                >
                  <TableCell
                    className="px-3 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOne(error.id);
                    }}
                  >
                    <button
                      className="text-gray-300 hover:text-gray-500"
                      aria-label={selectedIds.has(error.id) ? 'Deselect error' : 'Select error'}
                    >
                      {selectedIds.has(error.id) ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-500 mx-auto">
                      {getPlatformIcon(error.platform)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="max-w-md">
                      <p className="font-mono text-xs font-medium text-red-600 truncate">
                        {error.error_type}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{error.error_message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={error.status as StatusType} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {error.created_at ? new Date(error.created_at).toLocaleString() : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-right border-l border-gray-100">
                    <div className="flex items-center justify-end gap-0.5">
                      {error.status === 'new' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Mark as seen"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({ id: error.id, status: 'seen' });
                          }}
                          className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {error.status !== 'promoted' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Create issue"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromote(error);
                          }}
                          className="h-7 w-7 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={(e) => handleDelete(error, e)}
                        className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Error Detail Dialog */}
      <Dialog
        open={Boolean(selectedError) && !promoteDialogOpen}
        onOpenChange={() => setSelectedError(null)}
      >
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm text-red-600">
                {selectedError?.error_type}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 break-words">
                {selectedError?.error_message}
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedError && (
            <div className="px-6 pb-4 space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-gray-400">Platform</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getPlatformIcon(selectedError.platform)}
                    <span className="font-medium text-gray-700 capitalize">
                      {selectedError.platform}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">App Version</span>
                  <p className="font-medium text-gray-700 mt-0.5">
                    {selectedError.app_version || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">User ID</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="font-mono text-[11px] text-gray-600">
                      {selectedError.user_id || 'Anonymous'}
                    </p>
                    {selectedError.user_id && (
                      <button
                        className="text-gray-400 hover:text-teal-600"
                        onClick={() => copyToClipboard(selectedError.user_id ?? '')}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedError.status as StatusType} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">Occurred At</span>
                  <p className="text-gray-600 mt-0.5">
                    {selectedError.occurred_at || selectedError.created_at
                      ? new Date(
                          selectedError.occurred_at || selectedError.created_at || ''
                        ).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">Logged At</span>
                  <p className="text-gray-600 mt-0.5">
                    {selectedError.created_at
                      ? new Date(selectedError.created_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>

              {/* URL */}
              {selectedError.url && (
                <div>
                  <span className="text-[11px] text-gray-400">URL</span>
                  <p className="font-mono text-[11px] bg-gray-50 p-2 rounded mt-1 break-all text-gray-600 border border-gray-100">
                    {selectedError.url}
                  </p>
                </div>
              )}

              {/* User Agent */}
              {selectedError.user_agent && (
                <div>
                  <span className="text-[11px] text-gray-400">User Agent</span>
                  <p className="font-mono text-[11px] bg-gray-50 p-2 rounded mt-1 break-all text-gray-600 border border-gray-100">
                    {selectedError.user_agent}
                  </p>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Stack Trace</span>
                    <button
                      className="text-[11px] text-gray-400 hover:text-teal-600 flex items-center gap-1"
                      onClick={() => copyToClipboard(selectedError.stack_trace ?? '')}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-[11px] overflow-auto max-h-60 border border-gray-800">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {/* Extra Context */}
              {selectedError.extra_context &&
                Object.keys(selectedError.extra_context).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Extra Context
                      </span>
                      <button
                        className="text-[11px] text-gray-400 hover:text-teal-600 flex items-center gap-1"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(selectedError.extra_context, null, 2))
                        }
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="mt-1 p-3 bg-gray-900 text-emerald-300 rounded-lg text-[11px] overflow-auto max-h-40 border border-gray-800">
                      {JSON.stringify(selectedError.extra_context, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => selectedError && handleDelete(selectedError)}
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => {
                if (selectedError) {
                  updateStatus.mutate({ id: selectedError.id, status: 'ignored' });
                }
                setSelectedError(null);
              }}
            >
              <EyeOff className="w-3 h-3 mr-1.5" />
              Ignore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                if (selectedError) {
                  updateStatus.mutate({ id: selectedError.id, status: 'resolved' });
                }
                setSelectedError(null);
              }}
            >
              <CheckCircle2 className="w-3 h-3 mr-1.5" />
              Resolve
            </Button>
            {selectedError?.status !== 'promoted' && (
              <Button
                size="sm"
                className="h-8 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm"
                onClick={() => selectedError && handlePromote(selectedError)}
              >
                <ArrowUpRight className="w-3 h-3 mr-1.5" />
                Create Issue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Create Known Issue
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Document this error as a known issue for tracking.
              </DialogDescription>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Title</Label>
                <Input
                  value={promoteData.title}
                  onChange={(e) => setPromoteData((p) => ({ ...p, title: e.target.value }))}
                  className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">
                  Root Cause <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Why did this happen?"
                  value={promoteData.rootCause}
                  onChange={(e) => setPromoteData((p) => ({ ...p, rootCause: e.target.value }))}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">
                  Resolution <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="How was it fixed?"
                  value={promoteData.resolution}
                  onChange={(e) => setPromoteData((p) => ({ ...p, resolution: e.target.value }))}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setPromoteDialogOpen(false)}
              className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              className="h-9 px-5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm"
              onClick={submitPromote}
              disabled={promoteToIssue.isPending}
            >
              {promoteToIssue.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

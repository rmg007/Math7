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
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Info,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  ErrorLog,
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

  const filteredErrors = errors?.filter(
    (error) =>
      error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web':
        return <Globe className="w-4 h-4" />;
      case 'android':
      case 'ios':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status as StatusType} />;
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
        title: 'Trace Extinguished',
        description: 'The diagnostic residue has been purged from the archive.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete error log', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8">
      <AdminHeader
        title="System Diagnostics"
        description="Monitor application errors."
        icon={Bug}
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-12 px-6 rounded-2xl border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold uppercase tracking-widest text-2xs gap-2 shadow-sm"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            {isFetching ? 'Refreshing Archive...' : 'Refresh Archive'}
          </Button>
        }
      />

      {/* Health Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          className={cn(
            'bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-red-500/10 hover:border-red-500/20 transition-all group'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs font-black text-red-900/40 uppercase tracking-widest">Unseen</p>
            <AlertTriangle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-red-600 tracking-tighter">{stats?.new ?? 0}</p>
        </div>

        <div
          className={cn(
            'bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-blue-500/10 hover:border-blue-500/20 transition-all group'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs font-black text-blue-900/40 uppercase tracking-widest">
              Acknowledged
            </p>
            <Eye className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-blue-600 tracking-tighter">{stats?.seen ?? 0}</p>
        </div>

        <div
          className={cn(
            'bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-gray-500/10 hover:border-gray-500/20 transition-all group'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs font-black text-gray-900/40 uppercase tracking-widest">
              Suppressed
            </p>
            <EyeOff className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-gray-600 tracking-tighter">
            {stats?.ignored ?? 0}
          </p>
        </div>

        <div
          className={cn(
            'bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-emerald-500/10 hover:border-emerald-500/20 transition-all group'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs font-black text-emerald-900/40 uppercase tracking-widest">
              Resolved
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-emerald-600 tracking-tighter">
            {stats?.resolved ?? 0}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-purple-500/10 hover:border-purple-500/20 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xs font-black text-purple-900/40 uppercase tracking-widest">
              Promoted
            </p>
            <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-purple-600 tracking-tighter">
            {stats?.promoted ?? 0}
          </p>
        </div>
      </div>

      {/* Diagnostic Intelligence Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Search diagnostic traces by type or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
            <span className="text-2xs font-black text-gray-400 uppercase tracking-widest">
              Filter:
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[120px] h-6 border-none bg-transparent p-0 focus:ring-0 shadow-none text-xs font-black text-gray-700 hover:text-red-600 transition-colors uppercase italic tracking-tight">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-100 shadow-xl p-2">
                <SelectItem value="all" className="rounded-xl py-2 font-bold text-xs">
                  ALL DIAGNOSTICS
                </SelectItem>
                <SelectItem value="new" className="rounded-xl py-2 font-bold text-xs">
                  NEW TRACES
                </SelectItem>
                <SelectItem value="seen" className="rounded-xl py-2 font-bold text-xs">
                  ACKNOWLEDGED
                </SelectItem>
                <SelectItem value="ignored" className="rounded-xl py-2 font-bold text-xs">
                  SUPPRESSED
                </SelectItem>
                <SelectItem value="resolved" className="rounded-xl py-2 font-bold text-xs">
                  RESOLVED
                </SelectItem>
                <SelectItem value="promoted" className="rounded-xl py-2 font-bold text-xs">
                  PROMOTED ISSUES
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="px-4 py-2 bg-red-500/10 border border-red-500/10 rounded-xl flex items-center gap-2">
            <span className="text-2xs font-black text-red-500 uppercase tracking-widest">
              Traces:
            </span>
            <span className="text-sm font-black text-red-700 tracking-tight">
              {filteredErrors?.length || 0}
            </span>
          </div>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="w-12">Platform</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading errors...
                  </TableCell>
                </TableRow>
              ) : filteredErrors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No errors found. Your app is running smoothly! 🎉
                  </TableCell>
                </TableRow>
              ) : (
                filteredErrors?.map((error) => (
                  <TableRow
                    key={error.id}
                    className="group cursor-pointer hover:bg-red-50/20"
                    onClick={() => setSelectedError(error)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
                        {getPlatformIcon(error.platform)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-mono text-sm font-medium text-red-600 truncate">
                          {error.error_type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {error.error_message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(error.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {error.created_at ? new Date(error.created_at).toLocaleString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {error.status === 'new' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Mark as seen"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus.mutate({ id: error.id, status: 'seen' });
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {error.status !== 'promoted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600"
                            title="Create issue"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromote(error);
                            }}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete error"
                          onClick={(e) => handleDelete(error, e)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Error Detail Dialog */}
      <Dialog
        open={Boolean(selectedError) && !promoteDialogOpen}
        onOpenChange={() => setSelectedError(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-red-600">
              {selectedError?.error_type}
            </DialogTitle>
            <DialogDescription className="break-words">
              {selectedError?.error_message}
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Platform</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getPlatformIcon(selectedError.platform)}
                    <span className="font-medium capitalize">{selectedError.platform}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">App Version</Label>
                  <p className="font-medium">{selectedError.app_version || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="flex items-center gap-1">
                    <p className="font-mono text-xs">{selectedError.user_id || 'Anonymous'}</p>
                    {selectedError.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(selectedError.user_id ?? '')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedError.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Occurred At</Label>
                  <p className="text-xs">
                    {selectedError.occurred_at || selectedError.created_at
                      ? new Date(
                          selectedError.occurred_at || selectedError.created_at || ''
                        ).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Logged At</Label>
                  <p className="text-xs">
                    {selectedError.created_at
                      ? new Date(selectedError.created_at).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* URL */}
              {selectedError.url && (
                <div>
                  <Label className="text-muted-foreground">URL</Label>
                  <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">
                    {selectedError.url}
                  </p>
                </div>
              )}

              {/* User Agent */}
              {selectedError.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">
                    {selectedError.user_agent}
                  </p>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Stack Trace</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => copyToClipboard(selectedError.stack_trace ?? '')}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto max-h-60">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {/* Extra Context */}
              {selectedError.extra_context &&
                Object.keys(selectedError.extra_context).length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" /> Extra Context
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(selectedError.extra_context, null, 2))
                        }
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="mt-1 p-3 bg-slate-800 text-emerald-300 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedError.extra_context, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => selectedError && handleDelete(selectedError)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedError) {
                  updateStatus.mutate({ id: selectedError.id, status: 'ignored' });
                }
                setSelectedError(null);
              }}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Ignore
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedError) {
                  updateStatus.mutate({ id: selectedError.id, status: 'resolved' });
                }
                setSelectedError(null);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Resolved
            </Button>
            {selectedError?.status !== 'promoted' && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => selectedError && handlePromote(selectedError)}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Known Issue</DialogTitle>
            <DialogDescription>
              Document this error as a Known Issue for tracking and resolution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={promoteData.title}
                onChange={(e) => setPromoteData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rootCause">Root Cause (optional)</Label>
              <Textarea
                id="rootCause"
                placeholder="Why did this happen?"
                value={promoteData.rootCause}
                onChange={(e) => setPromoteData((p) => ({ ...p, rootCause: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="resolution">Resolution (optional)</Label>
              <Textarea
                id="resolution"
                placeholder="How was it fixed?"
                value={promoteData.resolution}
                onChange={(e) => setPromoteData((p) => ({ ...p, resolution: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={submitPromote}
              disabled={promoteToIssue.isPending}
            >
              {promoteToIssue.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">💚</span>
          </div>
          <div>
            <h4 className="font-semibold">Zero-Cost Error Tracking</h4>
            <p className="text-sm text-emerald-100">
              Powered by your existing Supabase database. No external subscriptions.
            </p>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-2xl font-bold">$0</p>
          <p className="text-xs text-emerald-200">/month</p>
        </div>
      </div>
    </div>
  );
}

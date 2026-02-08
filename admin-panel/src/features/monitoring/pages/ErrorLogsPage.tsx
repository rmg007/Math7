import { useState } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  Trash2,
  Info,
  Copy
} from 'lucide-react';
import { 
  useErrorLogs, 
  useErrorLogStats, 
  useUpdateErrorStatus,
  useDeleteErrorLog,
  usePromoteToIssue,
  ErrorLog 
} from '../hooks/use-error-logs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export function ErrorLogsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteData, setPromoteData] = useState({ title: '', rootCause: '', resolution: '' });

  const { data: errors, isLoading, refetch } = useErrorLogs(statusFilter);
  const { data: stats } = useErrorLogStats();
  const updateStatus = useUpdateErrorStatus();
  const deleteError = useDeleteErrorLog();
  const promoteToIssue = usePromoteToIssue();

  const filteredErrors = errors?.filter(error => 
    error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.error_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Globe className="w-4 h-4" />;
      case 'android':
      case 'ios': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive" className="text-xs">New</Badge>;
      case 'seen':
        return <Badge variant="secondary" className="text-xs">Seen</Badge>;
      case 'ignored':
        return <Badge variant="outline" className="text-xs">Ignored</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 text-xs border-none">Resolved</Badge>;
      case 'promoted':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs border-none">Issue Created</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  const handleDelete = (error: ErrorLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Delete this error log? This cannot be undone.')) {
      deleteError.mutate(error.id);
      setSelectedError(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Error Logs
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and triage application errors in real-time. Zero external dependencies.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-900">New</p>
                <p className="text-2xl font-bold text-red-700">{stats?.new ?? 0}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-900">Seen</p>
                <p className="text-2xl font-bold text-blue-700">{stats?.seen ?? 0}</p>
              </div>
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50 border-gray-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900">Ignored</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.ignored ?? 0}</p>
              </div>
              <EyeOff className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-900">Resolved</p>
                <p className="text-2xl font-bold text-green-700">{stats?.resolved ?? 0}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-900">Issues</p>
                <p className="text-2xl font-bold text-purple-700">{stats?.promoted ?? 0}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent Errors</CardTitle>
              <CardDescription>Click an error to view full details.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search errors..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="seen">Seen</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="promoted">Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
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
                  <TableCell colSpan={5} className="h-24 text-center">Loading errors...</TableCell>
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
                        {new Date(error.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <Dialog open={Boolean(selectedError) && !promoteDialogOpen} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-red-600">{selectedError?.error_type}</DialogTitle>
            <DialogDescription className="break-words">{selectedError?.error_message}</DialogDescription>
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
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(selectedError.user_id ?? '')}>
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
                  <p className="text-xs">{new Date(selectedError.occurred_at || selectedError.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Logged At</Label>
                  <p className="text-xs">{new Date(selectedError.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* URL */}
              {selectedError.url && (
                <div>
                  <Label className="text-muted-foreground">URL</Label>
                  <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">{selectedError.url}</p>
                </div>
              )}

              {/* User Agent */}
              {selectedError.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">{selectedError.user_agent}</p>
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
              {selectedError.extra_context && Object.keys(selectedError.extra_context).length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" /> Extra Context
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => copyToClipboard(JSON.stringify(selectedError.extra_context, null, 2))}
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
                onChange={(e) => setPromoteData(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rootCause">Root Cause (optional)</Label>
              <Textarea 
                id="rootCause"
                placeholder="Why did this happen?"
                value={promoteData.rootCause}
                onChange={(e) => setPromoteData(p => ({ ...p, rootCause: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="resolution">Resolution (optional)</Label>
              <Textarea 
                id="resolution"
                placeholder="How was it fixed?"
                value={promoteData.resolution}
                onChange={(e) => setPromoteData(p => ({ ...p, resolution: e.target.value }))}
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
            <p className="text-sm text-emerald-100">Powered by your existing Supabase database. No external subscriptions.</p>
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

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Shield,
  LifeBuoy,
  Trash2,
  X
} from 'lucide-react';
import { useKnownIssues, useDeleteKnownIssue, KnownIssue } from '../hooks/use-known-issues';
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

export function KnownIssuesPage() {
  const { data: issues, isLoading } = useKnownIssues();
  const deleteIssue = useDeleteKnownIssue();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<KnownIssue | null>(null);

  const filteredIssues = issues?.filter(issue =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (issue.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (issue.root_cause?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = (issue: KnownIssue, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm(`Delete issue "${issue.title}"? This cannot be undone.`)) {
      deleteIssue.mutate(issue.id);
      setSelectedIssue(null);
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
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading issues...</TableCell>
                </TableRow>
              ) : filteredIssues?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No issues found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues?.map((issue) => (
                  <TableRow 
                    key={issue.id} 
                    className="group cursor-pointer hover:bg-indigo-50/20"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <TableCell>
                      <div className="font-medium group-hover:text-indigo-600 transition-colors">{issue.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{issue.description || issue.root_cause || 'No description'}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>
                      <span className={`text-xs uppercase tracking-wider ${getSeverityColor(issue.severity)}`}>
                        {issue.severity || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">
                        {issue.category || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete issue"
                        onClick={(e) => handleDelete(issue, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Issue Detail Dialog */}
      <Dialog open={Boolean(selectedIssue)} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-indigo-700">{selectedIssue?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-3 pt-1">
              {selectedIssue && getStatusBadge(selectedIssue.status)}
              {selectedIssue?.severity && (
                <span className={`text-xs uppercase tracking-wider ${getSeverityColor(selectedIssue.severity)}`}>
                  {selectedIssue.severity}
                </span>
              )}
              {selectedIssue?.category && (
                <Badge variant="outline" className="text-xs capitalize">{selectedIssue.category}</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              {/* Description */}
              {selectedIssue.description && (
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm mt-1">{selectedIssue.description}</p>
                </div>
              )}

              {/* Root Cause */}
              {selectedIssue.root_cause && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Label className="text-xs text-amber-700 font-semibold">Root Cause</Label>
                  <p className="text-sm text-amber-900 mt-1">{selectedIssue.root_cause}</p>
                </div>
              )}

              {/* Resolution */}
              {selectedIssue.resolution && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Label className="text-xs text-emerald-700 font-semibold">Resolution</Label>
                  <p className="text-sm text-emerald-900 mt-1">{selectedIssue.resolution}</p>
                </div>
              )}

              {/* No root cause or resolution */}
              {!selectedIssue.root_cause && !selectedIssue.resolution && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-center text-sm text-muted-foreground">
                  No root cause or resolution documented yet.
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{selectedIssue.created_at ? new Date(selectedIssue.created_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p>{selectedIssue.updated_at ? new Date(selectedIssue.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => selectedIssue && handleDelete(selectedIssue)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setSelectedIssue(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

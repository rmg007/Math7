import { useState } from 'react';
import { Shield, Plus, LifeBuoy } from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import { DataColumn } from '@/lib/data-utils';
import { useKnownIssues, type KnownIssue } from '../hooks/use-known-issues';
import {
  useBulkDeleteKnownIssues,
  useBulkUpdateKnownIssueStatus,
  useDeleteKnownIssue,
} from '../hooks/use-known-issues-mutations';

// Modular Components
import { KnownIssueStats } from '../components/known-issues/KnownIssueStats';
import { KnownIssueBulkActions } from '../components/known-issues/KnownIssueBulkActions';
import { KnownIssueToolbar } from '../components/known-issues/KnownIssueToolbar';
import { KnownIssueTable } from '../components/known-issues/KnownIssueTable';
import { KnownIssueDialog } from '../components/known-issues/KnownIssueDialog';
import { KnownIssueOracleDialog } from '../components/known-issues/KnownIssueOracleDialog';

export function KnownIssuesPage() {
  const { data: issues, isLoading } = useKnownIssues();
  const deleteIssue = useDeleteKnownIssue();
  const bulkUpdateStatus = useBulkUpdateKnownIssueStatus();
  const bulkDeleteIssues = useBulkDeleteKnownIssues();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOracleDialogOpen, setIsOracleDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<KnownIssue | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredIssues = issues?.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (issue.root_cause?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (issue?: KnownIssue) => {
    setEditingIssue(issue || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteIssue.mutateAsync(id);
      toast({ title: 'Deleted', description: 'Issue has been removed.' });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'KnownIssuesPage', method: 'handleDelete' },
        extra: { id },
      });
      toast({ title: 'Error', description: 'Failed to delete issue', variant: 'destructive' });
    }
  };

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
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'KnownIssuesPage', method: 'handleBulkStatusUpdate' },
        extra: { status, idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to update issues', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} issues?`)) return;
    try {
      await bulkDeleteIssues.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({ title: 'Batch Deleted', description: `Deleted ${selectedIds.size} issues.` });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'KnownIssuesPage', method: 'handleBulkDelete' },
        extra: { idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to delete issues', variant: 'destructive' });
    }
  };

  const columns: DataColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status' },
    { key: 'severity', header: 'Severity' },
    { key: 'root_cause', header: 'Root Cause' },
    { key: 'resolution', header: 'Resolution' },
    { key: 'created_at', header: 'Date' },
  ];

  const openCount =
    issues?.filter((i) => i.status === 'open' || i.status === 'recurring').length ?? 0;
  const resolvedCount = issues?.filter((i) => i.status === 'closed').length ?? 0;

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
              data-testid="new-issue-button"
              className="h-9 px-3 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Issue
            </Button>
          </div>
        }
      />

      <KnownIssueStats total={issues?.length ?? 0} open={openCount} resolved={resolvedCount} />

      <KnownIssueBulkActions
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onBulkStatusUpdate={(status) => handleBulkStatusUpdate(status)}
        onBulkDelete={handleBulkDelete}
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <KnownIssueToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filteredCount={filteredIssues?.length ?? 0}
        />

        <KnownIssueTable
          issues={filteredIssues || []}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onCreateNew={() => handleOpenDialog()}
        />
      </div>

      <KnownIssueDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingIssue={editingIssue}
      />

      <KnownIssueOracleDialog open={isOracleDialogOpen} onOpenChange={setIsOracleDialogOpen} />
    </div>
  );
}

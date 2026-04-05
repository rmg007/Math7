import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { Pagination } from '@/components/ui/pagination';
import { useApp } from '@/contexts/AppContext';
import { captureException } from '@/lib/error-tracker';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { useUrlState } from '@/hooks/use-url-state';
import { DataColumn } from '@/lib/data-utils';
import { cn } from '@/lib/utils';
import { Bug, Filter, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useBulkDeleteErrorLogs,
  useBulkUpdateErrorStatus,
  useDeleteErrorLog,
  useErrorLogs,
  useErrorLogStats,
  usePromoteToIssue,
  useUpdateErrorStatus,
} from '../hooks/use-error-logs';

import { BulkActionBar } from '../components/error-logs/bulk-action-bar';
import { ErrorDetailDialog } from '../components/error-logs/error-detail-dialog';
import { ErrorLogTable, type ErrorLog } from '../components/error-logs/error-log-table';
import { ErrorStats } from '../components/error-logs/error-stats';
import { PromoteIssueDialog } from '../components/error-logs/promote-issue-dialog';

export function ErrorLogsPage() {
  const { toast } = useToast();
  const { currentApp, isSuperAdmin } = useApp();
  const [statusFilter, setStatusFilter] = useUrlState('status', 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [pageStr, setPage] = useUrlState('page', '1');
  const [pageSizeStr, setPageSize] = useUrlState('pageSize', '50');

  const page = parseInt(pageStr, 10);
  const pageSize = parseInt(pageSizeStr, 10);

  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteData, setPromoteData] = useState({ title: '', rootCause: '', resolution: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: errorData,
    isLoading,
    refetch,
    isFetching,
  } = useErrorLogs({
    status: statusFilter,
    appId: isSuperAdmin ? undefined : currentApp?.app_id,
    page,
    pageSize,
    search: debouncedSearch,
  });

  const errors = useMemo(() => errorData?.data || [], [errorData?.data]);
  const totalCount = errorData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { data: stats } = useErrorLogStats();
  const updateStatus = useUpdateErrorStatus();
  const deleteError = useDeleteErrorLog();
  const promoteToIssue = usePromoteToIssue();
  const bulkUpdateStatus = useBulkUpdateErrorStatus();
  const bulkDeleteErrors = useBulkDeleteErrorLogs();

  // Reset page when filters change
  useEffect(() => {
    setPage('1');
  }, [statusFilter, debouncedSearch, setPage]);

  const handlePromote = useCallback((error: ErrorLog) => {
    setPromoteData({
      title: `[${error.error_type}] ${error.error_message.slice(0, 60)}`,
      rootCause: '',
      resolution: '',
    });
    setSelectedError(error);
    setPromoteDialogOpen(true);
  }, []);

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

  const handleDelete = useCallback(
    async (error: ErrorLog, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await deleteError.mutateAsync(error.id);
        setSelectedError(null);
        toast({
          title: 'Error Log Deleted',
          description: 'The error log has been permanently removed.',
        });
      } catch (err) {
        captureException(err as Error, {
          tags: { component: 'ErrorLogsPage', method: 'handleDelete' },
          extra: { errorId: error.id },
        });
        toast({
          title: 'Error',
          description: 'Failed to delete error log',
          variant: 'destructive',
        });
      }
    },
    [deleteError, toast]
  );

  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Value copied to clipboard.' });
    },
    [toast]
  );

  const columns: DataColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'error_message', header: 'Message' },
    { key: 'error_type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'platform', header: 'Platform' },
    { key: 'created_at', header: 'Date' },
  ];

  const handleSelectAll = useCallback(() => {
    if (!errors) return;
    if (selectedIds.size === errors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(errors.map((e) => e.id)));
    }
  }, [errors, selectedIds.size]);

  const handleSelectOne = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: Array.from(selectedIds), status });
      setSelectedIds(new Set());
      toast({
        title: 'Batch Updated',
        description: `Updated ${selectedIds.size} logs to ${status}.`,
      });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'ErrorLogsPage', method: 'handleBulkStatusUpdate' },
        extra: { status, idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to update logs', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} logs?`)) return;
    try {
      await bulkDeleteErrors.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({ title: 'Batch Deleted', description: `Deleted ${selectedIds.size} logs.` });
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'ErrorLogsPage', method: 'handleBulkDelete' },
        extra: { idsCount: selectedIds.size },
      });
      toast({ title: 'Error', description: 'Failed to delete logs', variant: 'destructive' });
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto space-y-4 p-4 md:p-6"
      role="main"
      aria-label="Error Monitoring Dashboard"
    >
      <AdminHeader
        title="Error Logs"
        description="View and manage application errors."
        icon={Bug}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={errors || []}
              columns={columns}
              entityName="Error Logs"
              importDisabled
            />
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh error logs"
              className="h-9 px-3 rounded border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {stats && <ErrorStats stats={stats} />}

      <BulkActionBar
        selectedCount={selectedIds.size}
        onUpdateStatus={handleBulkStatusUpdate}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

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
            {totalCount} {totalCount === 1 ? 'error' : 'errors'}
          </span>
        </div>

        <ErrorLogTable
          errors={errors}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onRowClick={setSelectedError}
          onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
          onPromote={handlePromote}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          onClearSearch={() => setSearchTerm('')}
        />

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(p) => setPage(String(p))}
              onPageSizeChange={(s) => {
                setPageSize(String(s));
                setPage('1');
              }}
            />
          </div>
        )}
      </div>

      <ErrorDetailDialog
        error={selectedError}
        open={Boolean(selectedError) && !promoteDialogOpen}
        onOpenChange={(open) => !open && setSelectedError(null)}
        onCopyId={copyToClipboard}
      />

      <PromoteIssueDialog
        open={promoteDialogOpen}
        onOpenChange={setPromoteDialogOpen}
        title={promoteData.title}
        rootCause={promoteData.rootCause}
        resolution={promoteData.resolution}
        onDataChange={setPromoteData}
        onSubmit={submitPromote}
        isPending={promoteToIssue.isPending}
      />
    </div>
  );
}

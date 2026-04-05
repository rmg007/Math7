import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { CheckCircle2, CheckSquare, Clock, Eye, Square, Trash2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Json } from '@/lib/database.types.utf8';
import { memo } from 'react';
import { getPlatformIcon } from './utils';

export interface ErrorLog {
  id: string;
  error_message: string;
  error_type: string;
  status: string;
  platform: string;
  created_at: string | null;
  occurred_at?: string | null;
  app_version?: string | null;
  user_id?: string | null;
  stack_trace?: string | null;
  metadata?: Json;
  url?: string | null;
  user_agent?: string | null;
  extra_context?: Json;
}

interface ErrorLogTableProps {
  errors: ErrorLog[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onSelectOne: (id: string, e?: React.MouseEvent) => void;
  onRowClick: (error: ErrorLog) => void;
  onUpdateStatus: (id: string, status: string, e?: React.MouseEvent) => void;
  onPromote: (error: ErrorLog, e?: React.MouseEvent) => void;
  onDelete: (error: ErrorLog, e?: React.MouseEvent) => void;
  searchTerm: string;
  onClearSearch: () => void;
}

export const ErrorLogTable = memo(
  ({
    errors,
    isLoading,
    selectedIds,
    onSelectAll,
    onSelectOne,
    onRowClick,
    onUpdateStatus,
    onPromote,
    onDelete,
    searchTerm,
    onClearSearch,
  }: ErrorLogTableProps) => {
    const allSelected = (errors?.length ?? 0) > 0 && selectedIds.size === errors.length;

    return (
      <>
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-8 bg-gray-100 rounded w-full" />
                <div className="flex justify-end gap-2 pt-2">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          ) : errors?.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No errors found.</div>
          ) : (
            errors?.map((error) => (
              <div
                key={error.id}
                onClick={() => onRowClick(error)}
                className={cn(
                  'p-4 space-y-3 active:bg-gray-50 transition-colors relative',
                  selectedIds.has(error.id) && 'bg-teal-50/50'
                )}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="p-1.5 rounded-lg bg-gray-100/50 text-gray-400 shrink-0 border border-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOne(error.id, e);
                      }}
                    >
                      {selectedIds.has(error.id) ? (
                        <CheckSquare className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-black text-red-600 truncate uppercase tracking-tighter">
                        {error.error_type}
                      </p>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mt-0.5">
                        {error.error_message}
                      </h4>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <StatusBadge status={error.status as StatusType} />
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {getPlatformIcon(error.platform)}
                      <span>{error.platform}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {error.created_at ? new Date(error.created_at).toLocaleDateString() : '—'}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {error.status === 'new' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(error.id, 'seen', e);
                        }}
                        className="h-8 w-8 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => onDelete(error, e)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
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
                  onClick={onSelectAll}
                  className="text-gray-300 hover:text-gray-500"
                  title="Select all"
                  aria-label={allSelected ? 'Deselect all' : 'Select all'}
                >
                  {allSelected ? (
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
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="w-7 h-7 rounded mx-auto" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex gap-0.5 justify-end">
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : errors?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20">
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
                          onClick={onClearSearch}
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
              errors?.map((error) => (
                <TableRow
                  key={error.id}
                  onClick={() => onRowClick(error)}
                  className={cn(
                    'even:bg-gray-50/40 cursor-pointer transition-colors',
                    selectedIds.has(error.id) && 'bg-teal-50'
                  )}
                >
                  <TableCell
                    className="px-3 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOne(error.id, e);
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
                          onClick={(e) => onUpdateStatus(error.id, 'seen', e)}
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
                          onClick={(e) => onPromote(error, e)}
                          className="h-7 w-7 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={(e) => onDelete(error, e)}
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
      </>
    );
  }
);
ErrorLogTable.displayName = 'ErrorLogTable';

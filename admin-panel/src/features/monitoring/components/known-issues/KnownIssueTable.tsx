import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import type { KnownIssue } from '../../hooks/use-known-issues';

interface KnownIssueTableProps {
  issues: KnownIssue[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectOne: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (issue: KnownIssue) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  searchTerm: string;
  statusFilter: string;
  onClearFilters: () => void;
  onCreateNew: () => void;
}

export function KnownIssueTable({
  issues,
  isLoading,
  selectedIds,
  onSelectOne,
  onSelectAll,
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
  onClearFilters,
  onCreateNew,
}: KnownIssueTableProps) {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        {/* Desktop Skeleton */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-3 w-8" />
              <TableHead className="px-4">Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Severity</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-3">
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                </TableCell>
                <TableCell className="px-4">
                  <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="h-4 bg-gray-100 rounded w-12 animate-pulse" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                </TableCell>
                <TableCell className="px-4">
                  <div className="h-4 bg-gray-100 rounded w-8 ml-auto animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Mobile Skeleton */}
        <div className="md:hidden divide-y divide-gray-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-4 bg-gray-100 rounded w-12" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-12">
        <EmptyState
          icon={Shield}
          title={searchTerm || statusFilter !== 'all' ? 'No matches found' : 'No known issues'}
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No issues have been recorded yet.'
          }
          action={
            searchTerm || statusFilter !== 'all' ? (
              <Button
                onClick={onClearFilters}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={onCreateNew}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold text-sm shadow-sm"
              >
                New Issue
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-100">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => onEdit(issue)}
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
                    onSelectOne(issue.id);
                  }}
                >
                  {selectedIds.has(issue.id) ? (
                    <CheckSquare className="h-4 w-4 text-teal-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{issue.title}</h4>
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
                  className="h-8 w-8 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(issue);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => onDelete(issue.id, e)}
                  className="h-8 w-8 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <Table className="w-full hidden md:table">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="px-3 w-8">
              <button
                onClick={onSelectAll}
                className="text-gray-300 hover:text-gray-500"
                title="Select all"
              >
                {selectedIds.size > 0 && selectedIds.size === issues.length ? (
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
          {issues.map((issue) => (
            <TableRow
              key={issue.id}
              className={cn(
                'even:bg-gray-50/40 cursor-pointer transition-colors',
                selectedIds.has(issue.id) && 'bg-teal-50'
              )}
              onClick={() => onEdit(issue)}
            >
              <TableCell
                className="px-3 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOne(issue.id);
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
                      onEdit(issue);
                    }}
                    className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={(e) => onDelete(issue.id, e)}
                    className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

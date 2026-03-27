import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CheckSquare, ExternalLink, Pencil, Square, Trash2 } from 'lucide-react';
import { memo } from 'react';
import type { AppRowProps } from './types';

export const AppRow = memo(
  ({ app, isSelected, onSelect, onEdit, onDelete, visibleColumns }: AppRowProps) => {
    return (
      <TableRow
        key={app.app_id}
        data-testid="app-row"
        className={cn('group/row even:bg-gray-50/40', isSelected && 'bg-teal-50/50')}
      >
        <TableCell className="w-8 px-2">
          <button
            onClick={() => onSelect(app.app_id)}
            className="text-gray-300 hover:text-gray-500"
            aria-label={isSelected ? 'Deselect application' : 'Select application'}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        {visibleColumns.has('display_name') && (
          <TableCell className="px-4 whitespace-nowrap">
            <span className="font-medium text-gray-900 text-xs truncate">{app.display_name}</span>
          </TableCell>
        )}
        {visibleColumns.has('subject') && (
          <TableCell className="whitespace-nowrap">
            <span className="text-xs text-gray-600 truncate">{app.subjects?.title ?? '—'}</span>
          </TableCell>
        )}
        {visibleColumns.has('subdomain') && (
          <TableCell className="whitespace-nowrap">
            <a
              href={`http://${app.subdomain}.questerix.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 group/link"
              title="Launch App"
            >
              <code className="text-xs text-teal-600 font-mono">{app.subdomain}</code>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover/link:text-teal-500" />
            </a>
          </TableCell>
        )}
        {visibleColumns.has('grade_level') && (
          <TableCell className="hidden md:table-cell">
            <span className="text-xs text-gray-500">{app.grade_level || '—'}</span>
          </TableCell>
        )}
        {visibleColumns.has('is_active') && (
          <TableCell className="whitespace-nowrap">
            <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(app)}
              className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(app.app_id)}
              className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-600 focus:ring-offset-1"
              title="Delete"
              data-testid="app-delete-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);
AppRow.displayName = 'AppRow';

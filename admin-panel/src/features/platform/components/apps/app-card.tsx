import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { CheckSquare, ExternalLink, Pencil, Square, Trash2 } from 'lucide-react';
import { memo } from 'react';
import type { AppRowProps } from './types';

export const AppCard = memo(
  ({ app, isSelected, onSelect, onEdit, onDelete, visibleColumns }: AppRowProps) => {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border p-3 space-y-3 relative transition-all',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => onSelect(app.app_id)}
              className="mt-0.5 shrink-0 text-gray-300 hover:text-teal-600 transition-colors"
              title={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected ? (
                <CheckSquare className="h-4.5 w-4.5 text-teal-600" />
              ) : (
                <Square className="h-4.5 w-4.5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
                {app.display_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {visibleColumns.has('subject') && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200/50">
                    {app.subjects?.title ?? 'Unlinked'}
                  </span>
                )}
                {visibleColumns.has('grade_level') && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    Grade {app.grade_level || 'N/A'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {visibleColumns.has('is_active') && (
            <StatusBadge status={app.is_active ? 'active' : 'inactive'} />
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-2 bg-gray-50/50 rounded-md border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Subdomain
            </span>
            <a
              href={`http://${app.subdomain}.questerix.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 group/link hover:opacity-80 transition-opacity"
            >
              <code className="text-[11px] text-teal-600 font-mono font-medium">
                {app.subdomain}
              </code>
              <ExternalLink className="w-2.5 h-2.5 text-teal-400 group-hover/link:text-teal-600" />
            </a>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              DNS Target
            </span>
            <code className="text-[10px] text-gray-500 font-mono">pages.dev</code>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(app)}
            className="h-8 px-3 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 gap-1.5 font-medium text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(app.app_id)}
            className="h-8 px-3 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5 font-medium text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </div>
    );
  }
);
AppCard.displayName = 'AppCard';

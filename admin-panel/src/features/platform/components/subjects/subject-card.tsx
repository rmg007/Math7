import { memo } from 'react';
import { cn } from '@/lib/utils';
import { CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubjectRowProps } from './subject-row';
import { statusConfig } from './subject-row-status';

export const SubjectCard = memo(
  ({ subject, isSelected, onSelect, onEdit, onDelete, visibleColumns }: SubjectRowProps) => {
    const status = statusConfig[subject.status as keyof typeof statusConfig] ?? statusConfig.draft;

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
              onClick={() => onSelect(subject.subject_id)}
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
              <div className="flex items-center gap-2">
                {subject.color_hex && (
                  <span
                    ref={(node) => {
                      if (node) {
                        node.style.setProperty('--subject-color', subject.color_hex || '');
                      }
                    }}
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 bg-[var(--subject-color)]"
                    title={`Color: ${subject.color_hex}`}
                    aria-label={`Subject color: ${subject.color_hex}`}
                  />
                )}
                <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
                  {subject.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {visibleColumns.has('slug') && (
                  <code className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 rounded">
                    {subject.slug}
                  </code>
                )}
                {visibleColumns.has('display_order') && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    Order: {subject.display_order ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>
          {visibleColumns.has('status') && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                status.bgColor,
                status.textColor
              )}
            >
              <span className={cn('w-1 h-1 rounded-full', status.dotColor)} />
              {status.label}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/50 rounded-md border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Icon
            </span>
            {subject.icon_url ? (
              <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center">
                <img src={subject.icon_url} alt="" className="w-4 h-4 object-contain" />
              </div>
            ) : (
              <span className="text-gray-300 text-xs">&mdash;</span>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(subject)}
              className="h-8 px-3 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 gap-1.5 font-medium text-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(subject.subject_id)}
              className="h-8 px-3 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5 font-medium text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
SubjectCard.displayName = 'SubjectCard';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Subject } from '../../hooks/use-subjects';

export interface SubjectRowProps {
  subject: Subject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  visibleColumns: Set<string>;
}

export const statusConfig = {
  live: {
    label: 'Live',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  draft: {
    label: 'Draft',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
} as const;

export const SubjectRow = memo(
  ({ subject, isSelected, onSelect, onEdit, onDelete, visibleColumns }: SubjectRowProps) => {
    const status = statusConfig[subject.status as keyof typeof statusConfig] ?? statusConfig.draft;

    return (
      <TableRow
        key={subject.subject_id}
        data-testid="subject-row"
        className={cn('group/row even:bg-gray-50/40', isSelected && 'bg-teal-50/50')}
      >
        <TableCell className="w-8 px-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(subject.subject_id);
            }}
            className="p-1 hover:bg-white rounded transition-colors group"
            aria-label={isSelected ? 'Deselect subject' : 'Select subject'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        {visibleColumns.has('title') && (
          <TableCell className="px-4 whitespace-nowrap">
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
              <span className="font-medium text-gray-900 text-xs truncate">{subject.title}</span>
            </div>
          </TableCell>
        )}
        {visibleColumns.has('slug') && (
          <TableCell className="hidden md:table-cell whitespace-nowrap">
            <code className="text-xs text-gray-500 font-mono">{subject.slug}</code>
          </TableCell>
        )}
        {visibleColumns.has('icon_url') && (
          <TableCell className="px-2 text-center hidden sm:table-cell w-12">
            {subject.icon_url ? (
              <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center mx-auto">
                <img src={subject.icon_url} alt="" className="w-4 h-4 object-contain" />
              </div>
            ) : (
              <span className="text-gray-300 text-xs">&mdash;</span>
            )}
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                status.bgColor,
                status.textColor
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('display_order') && (
          <TableCell className="hidden lg:table-cell text-center whitespace-nowrap">
            <span className="text-xs text-gray-500 tabular-nums">{subject.display_order ?? 0}</span>
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(subject)}
              title="Edit subject"
              className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subject.subject_id)}
              title="Delete subject"
              className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-600 focus:ring-offset-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);
SubjectRow.displayName = 'SubjectRow';

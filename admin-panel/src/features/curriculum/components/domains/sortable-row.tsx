import { memo, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export interface Domain {
  domain_id: string;
  title: string;
  slug: string;
  sort_order: number | null;
  status: 'draft' | 'published' | 'live' | null;
  updated_at: string;
  app_id: string;
  apps?: { display_name: string } | null;
  color_hex?: string | null;
}

export interface SortableRowProps {
  domain: Domain;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDragDisabled: boolean;
  visibleColumns: Set<string>;
}

export const SortableRow = memo(
  ({
    domain,
    isSelected,
    onSelect,
    onDelete,
    isDragDisabled,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: domain.domain_id,
      disabled: isDragDisabled,
    });

    const rowRef = useRef<HTMLTableRowElement>(null);

    useLayoutEffect(() => {
      if (rowRef.current) {
        rowRef.current.style.transform = CSS.Transform.toString(transform) || '';
        rowRef.current.style.transition = transition || '';
      }
    }, [transform, transition]);

    return (
      <TableRow
        data-testid="domain-row"
        ref={(node) => {
          setNodeRef(node);
          if (rowRef.current !== node) {
            (rowRef as MutableRefObject<HTMLTableRowElement | null>).current = node;
          }
        }}
        className={cn(
          'group/row even:bg-gray-50/40',
          isSelected && 'bg-teal-50/50',
          isDragging && 'bg-gray-50 shadow-md opacity-50 z-10'
        )}
      >
        <TableCell className="w-8 px-2">
          {!isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="p-1 text-gray-200">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
        </TableCell>
        <TableCell className="w-8 px-2">
          <button
            onClick={() => onSelect(domain.domain_id)}
            className="text-gray-300 hover:text-gray-500"
            aria-label={isSelected ? 'Deselect domain' : 'Select domain'}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        {visibleColumns.has('sort_order') && (
          <TableCell className="text-center w-12">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
              {domain.sort_order ?? 0}
            </span>
          </TableCell>
        )}
        <TableCell className="px-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 text-xs">{domain.title}</span>
            {domain.apps?.display_name && (
              <span className="text-[11px] text-gray-500 mt-0.5">{domain.apps.display_name}</span>
            )}
          </div>
        </TableCell>
        {visibleColumns.has('updated_at') && (
          <TableCell className="hidden lg:table-cell whitespace-nowrap">
            <span className="text-xs text-gray-500">
              {new Date(domain.updated_at).toLocaleDateString()}{' '}
              <span className="text-gray-500">
                {new Date(domain.updated_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            <StatusBadge status={(domain.status as StatusType) || 'draft'} />
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Link
              to={`/domains/${domain.domain_id}/edit`}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
              title="Edit"
              aria-label="Edit domain"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDelete(domain.domain_id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
              aria-label="Delete domain"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);
SortableRow.displayName = 'SortableRow';

import { memo, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { SortableRowProps } from './sortable-row';

export const SortableCard = memo(
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

    const cardRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = CSS.Transform.toString(transform) || '';
        cardRef.current.style.transition = transition || '';
      }
    }, [transform, transition]);

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (cardRef.current !== node) {
            (cardRef as MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn(
          'bg-white rounded-lg border p-3 space-y-2 relative',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200',
          isDragging && 'opacity-50 z-10'
        )}
      >
        <div className="flex items-start gap-2">
          {!isDragDisabled ? (
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : (
            <div className="p-1 text-gray-200 shrink-0">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <button
            onClick={() => onSelect(domain.domain_id)}
            className="p-1 text-gray-300 hover:text-gray-500 shrink-0"
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs shrink-0">
                {domain.sort_order ?? 0}
              </span>
              <div className="flex flex-col min-w-0">
                <h3 className="font-medium text-gray-900 text-xs truncate">{domain.title}</h3>
                {domain.apps?.display_name && (
                  <span className="text-[11px] text-gray-500 leading-none mt-0.5">
                    {domain.apps.display_name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-gray-500">
              {visibleColumns.has('updated_at') &&
                `Modified: ${new Date(domain.updated_at).toLocaleDateString()}`}
            </div>
          </div>
          {visibleColumns.has('status') && (
            <div className="shrink-0">
              <StatusBadge status={(domain.status as StatusType) || 'draft'} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
          <Link
            to={`/domains/${domain.domain_id}/edit`}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDelete(domain.domain_id)}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
);
SortableCard.displayName = 'SortableCard';

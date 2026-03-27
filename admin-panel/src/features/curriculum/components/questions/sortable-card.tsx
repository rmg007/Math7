import { memo, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckSquare, Square, Pencil, Copy, Trash2 } from 'lucide-react';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn, formatIdentifier } from '@/lib/utils';
import { SortableRowProps } from './sortable-row';

export const SortableCard = memo(
  ({
    question,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    isDragDisabled,
    isDuplicating,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: question.question_id,
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
          'bg-white rounded-lg border p-3 space-y-3 relative',
          isSelected ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200',
          isDragging ? 'opacity-50 z-10 shadow-lg' : 'hover:border-gray-300'
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
            onClick={() => onSelect(question.question_id)}
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
            <div
              className="font-medium text-gray-900 text-xs line-clamp-2 prose-sm mb-1"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  typeof question.content === 'string'
                    ? question.content
                    : JSON.stringify(question.content)
                ),
              }}
            />
            {question.apps?.display_name && (
              <span className="text-[10px] text-gray-400 leading-none">
                {question.apps.display_name}
              </span>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {visibleColumns.has('type') && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {formatIdentifier(question.type)}
                </span>
              )}
              {visibleColumns.has('skill') && question.skills?.title && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {question.skills.title}
                </span>
              )}
              {visibleColumns.has('points') && (
                <span className="text-[11px] text-gray-500">{question.points} pts</span>
              )}
            </div>
          </div>
          {visibleColumns.has('status') && (
            <div className="shrink-0">
              <StatusBadge status={(question.status?.toLowerCase() as StatusType) || 'draft'} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
          <Link
            to={`/questions/${question.question_id}/edit`}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDuplicate(question.question_id)}
            disabled={isDuplicating}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(question.question_id)}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
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

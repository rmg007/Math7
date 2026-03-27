import { memo, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckSquare, Square, Pencil, Copy, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn, formatIdentifier } from '@/lib/utils';
import type { QuestionListItem } from '@/types';

export interface SortableRowProps {
  question: QuestionListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDragDisabled: boolean;
  isDuplicating: boolean;
  visibleColumns: Set<string>;
}

export const SortableRow = memo(
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

    const rowRef = useRef<HTMLTableRowElement>(null);

    useLayoutEffect(() => {
      if (rowRef.current) {
        rowRef.current.style.transform = CSS.Transform.toString(transform) || '';
        rowRef.current.style.transition = transition || '';
      }
    }, [transform, transition]);

    return (
      <TableRow
        data-testid="question-row"
        ref={(node) => {
          setNodeRef(node);
          if (rowRef.current !== node) {
            (rowRef as MutableRefObject<HTMLTableRowElement | null>).current = node;
          }
        }}
        className={cn(
          'even:bg-gray-50/40 relative',
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
            onClick={() => onSelect(question.question_id)}
            className="text-gray-300 hover:text-gray-500"
            aria-label={isSelected ? 'Deselect question' : 'Select question'}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4 max-w-[350px]">
          <div className="flex flex-col min-w-0">
            <div
              className="font-medium text-gray-900 text-xs line-clamp-1 prose-sm"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  typeof question.content === 'string'
                    ? question.content
                    : JSON.stringify(question.content)
                ),
              }}
            />
            {question.apps?.display_name && (
              <span className="text-[11px] text-gray-500 mt-0.5">{question.apps.display_name}</span>
            )}
          </div>
        </TableCell>
        {visibleColumns.has('type') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {formatIdentifier(question.type)}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('skill') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {question.skills?.title || 'No Skill'}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('points') && (
          <TableCell className="text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
              {question.points}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            <StatusBadge status={(question.status?.toLowerCase() as StatusType) || 'draft'} />
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Link
              to={`/questions/${question.question_id}/edit`}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
              title="Edit"
              aria-label="Edit question"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDuplicate(question.question_id)}
              disabled={isDuplicating}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
              title="Duplicate"
              aria-label="Duplicate question"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(question.question_id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
              aria-label="Delete question"
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

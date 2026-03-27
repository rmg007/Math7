import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CheckSquare, Copy, GripVertical, Pencil, Square, Trash2 } from 'lucide-react';
import { memo, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tables } from '@questerix/core/types/database';

type SkillListItem = Tables<'skills'> & {
  domains?: { title: string } | null;
  apps?: { display_name: string } | null;
};

interface SortableRowProps {
  skill: SkillListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  renderStatusBadge: (status: string) => JSX.Element;
  isDragDisabled: boolean;
  isDuplicating: boolean;
  visibleColumns: Set<string>;
}

export const SortableRow = memo(
  ({
    skill,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    renderStatusBadge,
    isDragDisabled,
    isDuplicating,
    visibleColumns,
  }: SortableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: skill.skill_id,
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
        data-testid="skill-row"
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
            onClick={() => onSelect(skill.skill_id)}
            className="text-gray-300 hover:text-gray-500"
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-teal-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </TableCell>
        <TableCell className="px-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 text-xs">{skill.title}</span>
            {skill.apps?.display_name && (
              <span className="text-[11px] text-gray-500 mt-0.5">{skill.apps.display_name}</span>
            )}
          </div>
        </TableCell>
        {visibleColumns.has('domain') && (
          <TableCell className="whitespace-nowrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200/50">
              {skill.domains?.title || 'No Domain'}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('difficulty') && (
          <TableCell className="text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 font-semibold text-xs tabular-nums">
              {skill.difficulty_level}
            </span>
          </TableCell>
        )}
        {visibleColumns.has('status') && (
          <TableCell className="whitespace-nowrap">
            {renderStatusBadge(skill.status || 'draft')}
          </TableCell>
        )}
        <TableCell className="px-4 text-right border-l border-gray-100">
          <div className="flex items-center justify-end gap-0.5">
            <Link
              to={`/skills/${skill.skill_id}/edit`}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDuplicate(skill.skill_id)}
              disabled={isDuplicating}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-50"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(skill.skill_id)}
              className="inline-flex items-center justify-center h-7 w-7 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

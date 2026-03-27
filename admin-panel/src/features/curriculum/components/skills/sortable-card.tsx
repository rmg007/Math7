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

export const SortableCard = memo(
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
            onClick={() => onSelect(skill.skill_id)}
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
            <div className="flex flex-col min-w-0 mb-1">
              <h3 className="font-medium text-gray-900 text-xs truncate">{skill.title}</h3>
              {skill.apps?.display_name && (
                <span className="text-[11px] text-gray-500 leading-none mt-0.5">
                  {skill.apps.display_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {visibleColumns.has('domain') && (
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                  {skill.domains?.title || 'No Domain'}
                </span>
              )}
              {visibleColumns.has('difficulty') && (
                <span className="text-[11px] text-gray-500">Lvl {skill.difficulty_level}</span>
              )}
            </div>
          </div>
          {visibleColumns.has('status') && (
            <div className="shrink-0">{renderStatusBadge(skill.status || 'draft')}</div>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
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
      </div>
    );
  }
);

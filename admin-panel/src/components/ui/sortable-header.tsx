import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  column: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  column,
  currentSortBy,
  currentSortOrder,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSortBy === column;

  return (
    <button
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      {label}
      {isActive ? (
        currentSortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4 text-purple-600" />
        ) : (
          <ArrowDown className="h-4 w-4 text-purple-600" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );
}

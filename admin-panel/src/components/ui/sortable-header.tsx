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
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-600 focus:ring-offset-1 rounded ${
        isActive ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
      } ${className}`}
      aria-sort={isActive ? (currentSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {isActive ? (
        currentSortOrder === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-teal-600" />
        ) : (
          <ArrowDown className="h-3 w-3 text-teal-600" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-gray-300" />
      )}
    </button>
  );
}

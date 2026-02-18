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
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 rounded px-0.5 py-0.5 ${
        isActive ? 'text-teal-600' : 'text-gray-700 hover:text-teal-600'
      } ${className}`}
      aria-sort={isActive ? (currentSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {isActive ? (
        currentSortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4 text-teal-600" />
        ) : (
          <ArrowDown className="h-4 w-4 text-teal-600" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 text-gray-300" />
      )}
    </button>
  );
}

import { Filter, Search, X } from 'lucide-react';
import { CurriculumStatus } from '../types';

interface CurriculumFilterBarProps {
  searchPlaceholder: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | CurriculumStatus;
  setStatusFilter: (status: 'all' | CurriculumStatus) => void;
  extraFilters?: React.ReactNode;
  count?: number;
  countLabel?: string;
}

export function CurriculumFilterBar({
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  extraFilters,
  count,
  countLabel,
}: CurriculumFilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
            title="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {extraFilters}
        <div className="relative">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CurriculumStatus)}
            className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="live">Live</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {count !== undefined && (
        <span className="text-[11px] text-gray-500 whitespace-nowrap">
          {count} {countLabel || 'items'}
        </span>
      )}
    </div>
  );
}

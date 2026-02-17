import { Filter, Search } from 'lucide-react';
import { CurriculumStatus } from '../types';

interface CurriculumFilterBarProps {
  searchPlaceholder: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | CurriculumStatus;
  setStatusFilter: (status: 'all' | CurriculumStatus) => void;
  extraFilters?: React.ReactNode;
}

export function CurriculumFilterBar({
  searchPlaceholder,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  extraFilters,
}: CurriculumFilterBarProps) {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm flex flex-col xl:flex-row gap-4 items-center min-w-0 overflow-hidden">
      <div className="relative flex-1 w-full group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-14 pr-4 py-2 text-sm rounded-[1.25rem] border border-gray-200 bg-gray-50/50 text-gray-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        {extraFilters}
        <div className="relative w-full md:w-56">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CurriculumStatus)}
            className="w-full h-14 appearance-none pl-6 pr-12 text-sm font-black uppercase tracking-widest rounded-[1.25rem] border border-gray-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">ALL STATUSES</option>
            <option value="draft">DRAFT</option>
            <option value="published">PUBLISHED</option>
            <option value="live">LIVE</option>
          </select>
          <Filter className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

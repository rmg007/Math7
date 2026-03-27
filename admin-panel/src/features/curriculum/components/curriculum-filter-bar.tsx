import { Search, X } from 'lucide-react';
import { CurriculumStatus } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusFilter } from '@/features/platform/components/platform-toolbar';

interface CurriculumFilterBarProps {
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | CurriculumStatus;
  onStatusChange: (status: 'all' | CurriculumStatus) => void;
  selectedSkillId?: string;
  onSkillChange?: (id: string) => void;
  appFilter?: string;
  onAppChange?: (appId: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  extraFilters?: React.ReactNode;
  count?: number;
  countLabel?: string;
  className?: string;
}

export function CurriculumFilterBar({
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedSkillId: _selectedSkillId,
  onSkillChange: _onSkillChange,
  appFilter: _appFilter,
  onAppChange: _onAppChange,
  hasActiveFilters,
  onClearFilters,
  extraFilters,
  count,
  countLabel,
  className,
}: CurriculumFilterBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap bg-white',
        className
      )}
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {extraFilters}

        <StatusFilter
          value={statusFilter}
          onChange={onStatusChange}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'live', label: 'Live' },
          ]}
        />

        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {count !== undefined && (
        <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">
            {countLabel || 'Pool'}
          </span>
          <span className="text-xs font-bold text-teal-600 tabular-nums">{count}</span>
        </div>
      )}
    </div>
  );
}

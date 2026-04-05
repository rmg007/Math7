import { Search, X, Filter } from 'lucide-react';

interface KnownIssueToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredCount: number;
}

export function KnownIssueToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
}: KnownIssueToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none focus-visible:outline-none text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded"
            title="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-8 appearance-none pl-3 pr-8 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="recurring">Recurring</option>
          <option value="closed">Resolved</option>
        </select>
        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
      </div>

      <span className="text-[11px] text-gray-500 whitespace-nowrap">
        {filteredCount} {filteredCount === 1 ? 'issue' : 'issues'}
      </span>
    </div>
  );
}

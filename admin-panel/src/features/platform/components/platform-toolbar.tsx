import { Filter, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchToolbarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  count?: number;
  countLabel?: string;
  className?: string;
}

export function SearchToolbar({
  placeholder = 'Search...',
  value,
  onChange,
  count,
  countLabel = 'Count',
  className,
}: SearchToolbarProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all text-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {count !== undefined && (
        <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-xl shadow-sm h-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">
            {countLabel}
          </span>
          <span className="text-xs font-bold text-teal-600 tabular-nums">{count}</span>
        </div>
      )}
    </div>
  );
}

interface FilterToolbarProps {
  children?: React.ReactNode;
  className?: string;
}

export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

interface StatusFilterProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  className?: string;
}

export function StatusFilter<T extends string>({
  value,
  onChange,
  options,
  className,
}: StatusFilterProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl h-10',
        className
      )}
    >
      <Filter className="h-3.5 w-3.5 text-gray-400" />
      <select
        aria-label="Filter status"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-gray-600 focus:ring-0 outline-none cursor-pointer p-0 h-auto"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

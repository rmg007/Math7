import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'ghost' | 'default' | 'outline';
    className?: string;
    disabled?: boolean;
    loading?: boolean;
  }[];
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onDelete,
  actions,
  isDeleting,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-500/20">
          {selectedCount}
        </span>
        <span className="text-xs text-slate-400 font-black uppercase tracking-widest whitespace-nowrap">
          Selected
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {actions?.map((action, i) => (
          <Button
            key={i}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={cn(
              'h-8 px-3 rounded-full text-xs font-bold transition-all active:scale-95',
              action.variant === 'ghost'
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : '',
              action.className
            )}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-8 px-4 rounded-full text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600 gap-1.5 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete All
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-8 w-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 active:scale-95"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

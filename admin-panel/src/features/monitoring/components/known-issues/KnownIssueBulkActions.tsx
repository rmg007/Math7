import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle2, Trash2, X } from 'lucide-react';

interface KnownIssueBulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  onBulkStatusUpdate: (status: 'open' | 'recurring' | 'closed') => void | Promise<void>;
  onBulkDelete: () => void | Promise<void>;
}

export function KnownIssueBulkActions({
  selectedCount,
  onClear,
  onBulkStatusUpdate,
  onBulkDelete,
}: KnownIssueBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-teal-900 rounded-lg shadow-md animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 pl-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-semibold">
          {selectedCount}
        </span>
        <span className="text-xs text-teal-200 font-medium">selected</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkStatusUpdate('open')}
          className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          Reopen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkStatusUpdate('recurring')}
          className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-white/10 gap-1"
        >
          <Clock className="h-3 w-3" />
          Mark Recurring
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkStatusUpdate('closed')}
          className="h-7 px-3 rounded text-xs text-teal-200 hover:text-white hover:bg-emerald-600 gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          Resolve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBulkDelete}
          className="h-7 px-3 rounded text-xs text-red-300 hover:text-white hover:bg-red-600 gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
        <div className="w-px h-4 bg-teal-800 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2 rounded text-xs text-teal-300 hover:text-white hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

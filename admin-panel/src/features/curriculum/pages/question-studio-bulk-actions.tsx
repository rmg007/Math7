import { Button } from '@/components/ui/button';
import { CheckSquare2, Trash2, X } from 'lucide-react';

interface QuestionStudioBulkActionsProps {
  keptCount: number;
  removedCount: number;
  editedCount: number;
  onKeepAll: () => void;
  onRemoveAll: () => void;
  onClear: () => void;
}

export function QuestionStudioBulkActions({
  keptCount,
  removedCount,
  editedCount,
  onKeepAll,
  onRemoveAll,
  onClear,
}: QuestionStudioBulkActionsProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onKeepAll}
          className="h-7 text-xs gap-1 text-emerald-600 hover:bg-emerald-50"
        >
          <CheckSquare2 className="h-3.5 w-3.5" /> Keep All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveAll}
          className="h-7 text-xs gap-1 text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs gap-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>
      <span className="text-xs text-gray-400 font-medium">
        {keptCount} kept · {removedCount} removed
        {editedCount > 0 && ` · ${editedCount} edited`}
      </span>
    </div>
  );
}

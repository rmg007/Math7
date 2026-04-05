import { TableCell } from '@/components/ui/table';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { memo } from 'react';

interface ProgressCellProps {
  status: string;
}

export const ProgressCell = memo(({ status }: ProgressCellProps) => {
  return (
    <TableCell className="text-center py-4">
      {status === 'mastered' ? (
        <div className="flex justify-center">
          <div className="p-1 bg-emerald-500/10 rounded-lg">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      ) : status === 'in_progress' ? (
        <div className="flex justify-center">
          <div className="p-1 bg-amber-500/10 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Circle className="h-4 w-4 text-gray-100" />
        </div>
      )}
    </TableCell>
  );
});
ProgressCell.displayName = 'ProgressCell';

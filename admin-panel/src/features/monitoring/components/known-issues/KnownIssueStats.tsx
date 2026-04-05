import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnownIssueStatsProps {
  total: number;
  open: number;
  resolved: number;
  className?: string;
}

export function KnownIssueStats({ total, open, resolved, className }: KnownIssueStatsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Total
          </span>
          <Shield className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
      </div>
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Open
          </span>
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <p className="text-2xl font-bold text-amber-600 tabular-nums">{open}</p>
      </div>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Resolved
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <p className="text-2xl font-bold text-emerald-600 tabular-nums">{resolved}</p>
      </div>
    </div>
  );
}

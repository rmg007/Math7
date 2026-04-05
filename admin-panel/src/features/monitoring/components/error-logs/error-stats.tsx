import { AlertTriangle, Eye, EyeOff, CheckCircle2, ArrowUpRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface ErrorStatsProps {
  stats: {
    new: number;
    seen: number;
    ignored: number;
    resolved: number;
    promoted: number;
  };
}

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const ErrorStats = memo(({ stats }: ErrorStatsProps) => {
  const statItems: StatItem[] = [
    {
      label: 'New',
      value: stats?.new ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      label: 'Seen',
      value: stats?.seen ?? 0,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Ignored',
      value: stats?.ignored ?? 0,
      icon: EyeOff,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Resolved',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Issues',
      value: stats?.promoted ?? 0,
      icon: ArrowUpRight,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={cn('rounded-lg border p-4 shadow-sm', item.bg, item.border)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {item.label}
            </span>
            <item.icon className={cn('w-3.5 h-3.5', item.color)} />
          </div>
          <p className={cn('text-2xl font-bold tabular-nums', item.color)}>{item.value}</p>
        </div>
      ))}
    </div>
  );
});
ErrorStats.displayName = 'ErrorStats';

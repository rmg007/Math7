import { cn } from '@/lib/utils';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'published'
  | 'exhausted'
  | 'resolved'
  | 'pending'
  | 'throttled'
  | 'error'
  | 'used'
  | 'live'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'open'
  | 'recurring'
  | 'seen'
  | 'ignored'
  | 'promoted'
  | 'new'
  | 'critical'
  | 'high'
  | 'low';

const STATUS_CONFIG: Record<
  StatusType,
  { bg: string; text: string; dot: string; label: string }
> = {
  active: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    label: 'Inactive',
  },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Draft' },
  published: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Published' },
  exhausted: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Exhausted' },
  resolved: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Resolved' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  throttled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Throttled' },
  error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Error' },
  used: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Used' },
  live: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Live' },
  easy: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Easy' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Medium' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Hard' },
  open: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Open' },
  recurring: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Recurring' },
  seen: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Seen' },
  ignored: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Ignored' },
  promoted: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Promoted' },
  new: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'New' },
  critical: { bg: 'bg-red-200', text: 'text-red-900', dot: 'bg-red-600', label: 'Critical' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'High' },
  low: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Low' },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusBadge({ status, label, className, icon }: StatusBadgeProps) {
  const fallback = {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
    label: status || 'Unknown',
  };
  const config = (status && STATUS_CONFIG[status]) || fallback;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {icon}
      {label || config.label}
    </span>
  );
}

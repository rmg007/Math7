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
  | 'critical'
  | 'high'
  | 'low';

const STATUS_CONFIG: Record<
  StatusType,
  { bg: string; text: string; border: string; label: string }
> = {
  active: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    label: 'Inactive',
  },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Draft' },
  published: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Published',
  },
  exhausted: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Exhausted',
  },
  resolved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Resolved',
  },
  pending: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Pending',
  },
  throttled: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Throttled',
  },
  error: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Error' },
  used: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', label: 'Used' },
  live: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Live' },
  easy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Easy' },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    label: 'Medium',
  },
  hard: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Hard' },
  open: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Open' },
  recurring: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Recurring',
  },
  seen: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Seen' },
  ignored: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Ignored',
  },
  promoted: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Promoted',
  },
  critical: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300', label: 'Critical' },
  high: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'High',
  },
  low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Low' },
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
    text: 'text-gray-600',
    border: 'border-gray-200',
    label: status || 'Unknown',
  };
  const config = (status && STATUS_CONFIG[status]) || fallback;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {icon}
      {label || config.label}
    </span>
  );
}

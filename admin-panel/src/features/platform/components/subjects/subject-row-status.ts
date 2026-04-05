export const statusConfig = {
  live: {
    label: 'Live',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
  },
  published: {
    label: 'Published',
    dotColor: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  draft: {
    label: 'Draft',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
} as const;

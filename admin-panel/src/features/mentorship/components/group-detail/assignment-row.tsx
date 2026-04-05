import { ClipboardList, Clock } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface Assignment {
  id: string;
  completion_trigger?: unknown;
  created_at: string;
  due_date: string | null;
  group_id: string | null;
  scope: 'mandatory' | 'suggested' | null;
  status: 'pending' | 'completed' | 'late' | null;
  student_id: string | null;
  target_id: string;
  type: 'skill_mastery' | 'time_goal' | 'custom';
  updated_at: string;
}

interface AssignmentRowProps {
  assignment: Assignment;
}

export const AssignmentRow = memo(({ assignment }: AssignmentRowProps) => {
  return (
    <div
      key={assignment.id}
      className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-2.5 rounded-xl border',
            assignment.type === 'skill_mastery'
              ? 'bg-blue-500/10 border-blue-500/10 text-blue-600'
              : 'bg-purple-500/10 border-purple-500/10 text-purple-600'
          )}
        >
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight capitalize">
            {assignment.type.replace('_', ' ')}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {assignment.scope}
            </span>
            {assignment.due_date && (
              <div className="flex items-center gap-1">
                <span className="text-2xs text-gray-300">•</span>
                <Clock className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-400 font-semibold">
                  {new Date(assignment.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'px-3 py-1 rounded-full text-2xs font-black uppercase tracking-[0.1em] border',
          assignment.status === 'pending'
            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        )}
      >
        {assignment.status}
      </div>
    </div>
  );
});
AssignmentRow.displayName = 'AssignmentRow';

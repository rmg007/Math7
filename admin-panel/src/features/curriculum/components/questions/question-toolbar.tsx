import { Link } from 'react-router-dom';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { QuestionListItem } from '@/types';

const QUESTION_COLUMNS = [
  { key: 'content', header: 'content' },
  { key: 'type', header: 'type' },
  { key: 'points', header: 'points' },
  { key: 'status', header: 'status' },
  { key: 'options', header: 'options' },
  { key: 'solution', header: 'solution' },
  { key: 'explanation', header: 'explanation' },
];

interface QuestionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: 'draft' | 'published' | 'live') => void | Promise<void>;
  questions: QuestionListItem[];
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function QuestionToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  questions,
  onImport,
  isDeleting,
  isUpdating,
}: QuestionToolbarProps) {
  return (
    <>
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={onClearSelection}
        onDelete={onBulkDelete}
        isDeleting={isDeleting}
        actions={[
          {
            label: 'Mark Live',
            onClick: () => onBulkStatusUpdate('live'),
            className: 'text-emerald-600 hover:bg-emerald-50',
            disabled: isUpdating,
          },
          {
            label: 'Mark Draft',
            onClick: () => onBulkStatusUpdate('draft'),
            className: 'text-gray-600 hover:bg-gray-50',
            disabled: isUpdating,
          },
          {
            label: 'Publish',
            onClick: () => onBulkStatusUpdate('published'),
            className: 'text-indigo-600 hover:bg-indigo-50',
            disabled: isUpdating,
          },
        ]}
      />

      <AdminHeader
        title="Question Bank"
        description="Registry of all pedagogical assessment units"
        icon={FileText}
        backTo="/dashboard"
        actions={
          <div
            className="flex items-center gap-2"
            role="toolbar"
            aria-label="Question management actions"
          >
            <Link to="/ai-questions">
              <Button
                variant="outline"
                aria-label="Launch AI Question Studio"
                className="h-10 px-4 rounded-xl border-indigo-100 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                AI Generate
              </Button>
            </Link>
            <Link to="/ai-import">
              <Button
                variant="outline"
                aria-label="Launch Bulk Import Nexus"
                className="h-10 px-4 rounded-xl border-emerald-100 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <DataToolbar
              data={questions}
              columns={QUESTION_COLUMNS}
              entityName="Questions"
              onImport={onImport}
              importDisabled={false}
            />
            <Link to={`/questions/new`}>
              <Button
                aria-label="Create new question unit"
                className="h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-widest gap-1 shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> New Unit
              </Button>
            </Link>
          </div>
        }
      />
    </>
  );
}

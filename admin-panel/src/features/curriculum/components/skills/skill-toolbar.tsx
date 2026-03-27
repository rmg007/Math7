import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { Layers, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Loader2 } from 'lucide-react';
import type { DataColumn } from '@/lib/data-utils';

const SKILL_COLUMNS: DataColumn[] = [
  { key: 'title', header: 'title' },
  { key: 'slug', header: 'slug' },
  {
    key: 'domains',
    header: 'domain_title',
    transform: (v: unknown) => (v as { title?: string } | null)?.title ?? '',
  },
  { key: 'difficulty_level', header: 'difficulty_level' },
  { key: 'sort_order', header: 'sort_order' },
  { key: 'status', header: 'status' },
  { key: 'description', header: 'description' },
];

interface SkillToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: 'draft' | 'published' | 'live') => Promise<void>;
  skills: Record<string, unknown>[];
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function SkillToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  skills,
  onImport,
  isDeleting,
  isUpdating,
}: SkillToolbarProps) {
  return (
    <>
      <AdminHeader
        title="Skills"
        description="Manage learning skills."
        icon={Layers}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={skills as Record<string, unknown>[]}
              columns={SKILL_COLUMNS}
              entityName="Skills"
              onImport={onImport}
              importDisabled={false}
            />
            <Link to="/skills/new" aria-label="New Skill">
              <Button className="h-9 px-3 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> New Skill
              </Button>
            </Link>
          </div>
        }
      />

      <BulkActionBar
        selectedCount={selectedCount}
        onClear={onClearSelection}
        onDelete={onBulkDelete}
        isDeleting={isDeleting}
        actions={[
          {
            label: 'Publish',
            onClick: () => onBulkStatusUpdate('published'),
            icon: isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null,
          },
          {
            label: 'Go Live',
            onClick: () => onBulkStatusUpdate('live'),
            icon: isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null,
          },
          {
            label: 'Draft',
            onClick: () => onBulkStatusUpdate('draft'),
            icon: isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null,
          },
        ]}
      />
    </>
  );
}

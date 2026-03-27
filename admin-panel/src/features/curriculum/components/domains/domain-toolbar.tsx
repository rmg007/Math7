import { Link } from 'react-router-dom';
import { Book, Plus, Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/ui/admin-header';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { CurriculumStatus } from '../../types';
import type { Domain } from './sortable-row';

const DOMAIN_COLUMNS = [
  { key: 'title', header: 'title' },
  { key: 'slug', header: 'slug' },
  { key: 'description', header: 'description' },
  { key: 'sort_order', header: 'sort_order' },
  { key: 'status', header: 'status' },
];

interface DomainToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: CurriculumStatus) => void;
  domains: Domain[];
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  isDeleting: boolean;
  isUpdating: boolean;
}

export function DomainToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  domains,
  onImport,
  isDeleting,
  isUpdating,
}: DomainToolbarProps) {
  return (
    <>
      <AdminHeader
        title="Domains"
        description="Organize domain categories."
        icon={Book}
        className="mb-2"
        actions={
          <div className="flex items-center gap-2">
            <DataToolbar
              data={domains as unknown as Record<string, unknown>[]}
              columns={DOMAIN_COLUMNS}
              entityName="Domains"
              onImport={onImport}
              importDisabled={false}
            />
            <Link to="/domains/new">
              <Button className="h-9 px-3 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> New Domain
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { memo } from 'react';
import { getPlatformIcon } from './utils';
import type { ErrorLog } from './error-log-table';

interface ErrorDetailDialogProps {
  error: ErrorLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyId: (id: string) => void;
}

export const ErrorDetailDialog = memo(
  ({ error, open, onOpenChange, onCopyId }: ErrorDetailDialogProps) => {
    if (!error) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm text-red-600">
                {error.error_type}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 break-words">
                {error.error_message}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-4 space-y-4">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-gray-400">Platform</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getPlatformIcon(error.platform)}
                  <span className="font-medium text-gray-700 capitalize">{error.platform}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">App Version</span>
                <p className="font-medium text-gray-700 mt-0.5">{error.app_version || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">User ID</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="font-mono text-[11px] text-gray-600">
                    {error.user_id || 'Anonymous'}
                  </p>
                  {error.user_id && (
                    <button
                      className="text-gray-400 hover:text-teal-600"
                      title="Copy User ID"
                      onClick={() => onCopyId(error.user_id ?? '')}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={error.status as StatusType} />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">Occurred At</span>
                <p className="text-gray-600 mt-0.5">
                  {error.occurred_at || error.created_at
                    ? new Date(error.occurred_at || error.created_at || '').toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">Logged At</span>
                <p className="text-gray-600 mt-0.5">
                  {error.created_at ? new Date(error.created_at).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            {/* Stack Trace / Metadata */}
            {error.stack_trace && (
              <div className="space-y-2">
                <span className="text-[11px] text-gray-400 uppercase font-black tracking-widest">
                  Stack Trace
                </span>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
                  <pre className="text-[10px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {error.stack_trace}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
ErrorDetailDialog.displayName = 'ErrorDetailDialog';

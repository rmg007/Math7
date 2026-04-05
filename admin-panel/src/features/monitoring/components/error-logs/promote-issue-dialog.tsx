import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { memo } from 'react';

interface PromoteIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  rootCause: string;
  resolution: string;
  onDataChange: (data: { title: string; rootCause: string; resolution: string }) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const PromoteIssueDialog = memo(
  ({
    open,
    onOpenChange,
    title,
    rootCause,
    resolution,
    onDataChange,
    onSubmit,
    isPending,
  }: PromoteIssueDialogProps) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-gray-900">
                  Create Known Issue
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Document this error as a known issue for tracking.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => onDataChange({ title: e.target.value, rootCause, resolution })}
                  className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">
                  Root Cause <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Why did this happen?"
                  value={rootCause}
                  onChange={(e) => onDataChange({ title, rootCause: e.target.value, resolution })}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">
                  Resolution <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="How was it fixed?"
                  value={resolution}
                  onChange={(e) => onDataChange({ title, rootCause, resolution: e.target.value })}
                  className="rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm p-3"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              className="h-9 px-5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm"
              onClick={onSubmit}
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
PromoteIssueDialog.displayName = 'PromoteIssueDialog';

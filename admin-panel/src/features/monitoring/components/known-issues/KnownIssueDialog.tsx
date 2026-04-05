import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/error-tracker';
import type { Database } from '@questerix/core/types/database';
import { type KnownIssue } from '../../hooks/use-known-issues';
import { useCreateKnownIssue, useUpdateKnownIssue } from '../../hooks/use-known-issues-mutations';

type KnownIssueInsert = Database['public']['Tables']['known_issues']['Insert'];
type KnownIssueUpdate = Database['public']['Tables']['known_issues']['Update'];

interface KnownIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIssue: KnownIssue | null;
}

const DEFAULT_FORM_DATA: KnownIssueInsert = {
  title: '',
  description: '',
  status: 'open',
  severity: 'medium',
  root_cause: '',
  resolution: '',
  sentry_link: '',
};

export function KnownIssueDialog({ open, onOpenChange, editingIssue }: KnownIssueDialogProps) {
  const { toast } = useToast();
  const createIssue = useCreateKnownIssue();
  const updateIssue = useUpdateKnownIssue();

  const [formData, setFormData] = useState<KnownIssueInsert>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (editingIssue) {
      setFormData({
        title: editingIssue.title,
        description: editingIssue.description || '',
        status: editingIssue.status || 'open',
        severity: editingIssue.severity || 'medium',
        root_cause: editingIssue.root_cause || '',
        resolution: editingIssue.resolution || '',
        sentry_link: editingIssue.sentry_link || '',
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [editingIssue, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIssue) {
        const updates: KnownIssueUpdate = {};
        if (formData.title !== undefined) updates.title = formData.title;
        if (formData.description !== undefined) updates.description = formData.description;
        if (formData.status !== undefined) updates.status = formData.status;
        if (formData.severity !== undefined) updates.severity = formData.severity;
        if (formData.root_cause !== undefined) updates.root_cause = formData.root_cause;
        if (formData.resolution !== undefined) updates.resolution = formData.resolution;
        if (formData.sentry_link !== undefined) updates.sentry_link = formData.sentry_link;

        await updateIssue.mutateAsync({
          id: editingIssue.id,
          updates,
        });
        toast({ title: 'Success', description: 'Issue updated' });
      } else {
        await createIssue.mutateAsync(formData);
        toast({ title: 'Success', description: 'Issue created' });
      }
      onOpenChange(false);
    } catch (err) {
      captureException(err as Error, {
        tags: { component: 'KnownIssueDialog', method: 'handleSubmit' },
        extra: { isEditing: Boolean(editingIssue) },
      });
      toast({ title: 'Error', description: 'Failed to save issue', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <DialogTitle className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              {editingIssue ? 'Edit Known Issue' : 'Create New Issue'}
            </DialogTitle>

            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-gray-700">
                  Issue Title
                </Label>
                <Input
                  id="title"
                  placeholder="Summarize the core failure..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-600/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-bold text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={formData.status || 'open'}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="closed">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity" className="text-xs font-bold text-gray-700">
                    Severity
                  </Label>
                  <Select
                    value={formData.severity || 'medium'}
                    onValueChange={(val) => setFormData({ ...formData, severity: val })}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detailed failure description..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[80px] rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-600/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="root_cause" className="text-xs font-bold text-gray-700">
                  Potential Root Cause
                </Label>
                <Textarea
                  id="root_cause"
                  placeholder="Suspected source of failure..."
                  value={formData.root_cause || ''}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  className="h-20 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-600/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution" className="text-xs font-bold text-gray-700">
                  Resolution / Fix
                </Label>
                <Textarea
                  id="resolution"
                  placeholder="Steps taken to resolve or permanent fix logic..."
                  value={formData.resolution || ''}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  className="h-20 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-600/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sentry_link" className="text-xs font-bold text-gray-700">
                  Sentry / External Link
                </Label>
                <Input
                  id="sentry_link"
                  placeholder="Link to crash logs or monitoring URL..."
                  value={formData.sentry_link || ''}
                  onChange={(e) => setFormData({ ...formData, sentry_link: e.target.value })}
                  className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-600/20"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50/80 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createIssue.isPending || updateIssue.isPending}
              className="px-8 bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] uppercase tracking-[0.15em] shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all"
            >
              {createIssue.isPending || updateIssue.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : editingIssue ? (
                'Commit Updates'
              ) : (
                'Create Issue'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

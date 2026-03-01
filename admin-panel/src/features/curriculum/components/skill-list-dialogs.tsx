import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface SkillDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteType: 'single' | 'bulk';
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function SkillDeleteDialog({
  open,
  onOpenChange,
  deleteType,
  selectedCount,
  isDeleting,
  onConfirm,
}: SkillDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg border border-gray-200 bg-white shadow-lg max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-gray-900">
            Delete {deleteType === 'bulk' ? `${selectedCount} skills` : 'skill'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            {deleteType === 'bulk'
              ? `This will permanently delete ${selectedCount} selected skill(s) and their associated questions.`
              : 'This action cannot be undone. This will permanently delete the skill and all associated questions.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="h-9 px-4 rounded text-sm font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

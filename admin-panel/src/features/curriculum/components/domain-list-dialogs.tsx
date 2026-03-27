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

interface DomainDeleteImpact {
  loading: boolean;
  skillCount: number;
  questionCount: number;
}

interface DomainDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
  impact: DomainDeleteImpact;
}

export function DomainDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
  impact,
}: DomainDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-lg border border-gray-200 bg-white shadow-lg max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            Are you sure you want to delete these domains? This action cannot be undone.
            {impact.loading ? (
              <span className="block mt-2 text-gray-400 text-xs italic">
                Scanning for dependent units and skills...
              </span>
            ) : impact.skillCount > 0 || impact.questionCount > 0 ? (
              <span className="block mt-2 font-bold text-red-600 text-xs bg-red-50 p-2 rounded border border-red-100">
                CRITICAL: This will also delete {impact.skillCount} skill(s) and{' '}
                {impact.questionCount} question(s).
              </span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose} className="h-9 px-4 rounded text-sm font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid="confirm-delete-button"
            disabled={isDeleting}
            className="h-9 px-5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Confirm Deletion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

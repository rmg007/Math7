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

interface QuestionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deleteType: 'single' | 'bulk';
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function QuestionDeleteDialog({
  isOpen,
  onClose,
  deleteType,
  selectedCount,
  isDeleting,
  onConfirm,
}: QuestionDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-lg border border-gray-200 bg-white shadow-lg max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold text-gray-900">
            Delete {deleteType === 'bulk' ? `${selectedCount} units` : 'unit'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            {deleteType === 'bulk'
              ? `This will permanently delete ${selectedCount} selected unit(s).`
              : 'Are you sure you want to delete this unit? This action is permanent.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose} className="h-9 px-4 rounded text-sm font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

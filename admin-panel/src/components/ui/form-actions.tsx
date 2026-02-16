import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from './button';

interface FormActionsProps {
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  className?: string;
}

export function FormActions({
  isSubmitting,
  submitLabel = 'Save',
  submittingLabel = 'Saving...',
  cancelLabel = 'Cancel',
  onCancel,
  className,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6 border-t border-border mt-8',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto h-14 px-12 rounded-2xl font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}

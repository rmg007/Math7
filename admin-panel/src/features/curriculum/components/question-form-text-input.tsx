import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from './question-form-types';

interface TextInputSubFormProps {
  form: UseFormReturn<QuestionFormData>;
}

export function TextInputSubForm({ form }: TextInputSubFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
          Master Key (Exact Match)
        </label>
        <Input
          value={form.watch('solution') as string}
          onChange={(e) => form.setValue('solution', e.target.value)}
          placeholder="Enter the authoritative response..."
          data-testid="question-text-input-answer"
          className="h-14 rounded-2xl bg-white/50 border-gray-100 text-lg font-black tracking-tight focus:ring-8 focus:ring-emerald-500/5 transition-all"
          required
        />
      </div>
    </div>
  );
}

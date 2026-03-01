import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from './question-form-types';

interface BooleanSubFormProps {
  form: UseFormReturn<QuestionFormData>;
}

export function BooleanSubForm({ form }: BooleanSubFormProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-12 p-10 bg-gray-50/50 rounded-3xl border border-gray-100">
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Truth Value
          </span>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-bold ${!(form.watch('solution') as boolean) ? 'text-gray-400' : 'text-emerald-600'}`}
            >
              False
            </span>
            <Switch
              checked={(form.watch('solution') as boolean) ?? false}
              onCheckedChange={(val) => form.setValue('solution', val)}
              data-testid="question-boolean-switch"
              className="data-[state=checked]:bg-emerald-500"
            />
            <span
              className={`text-sm font-bold ${(form.watch('solution') as boolean) ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              True
            </span>
          </div>
        </div>

        <div className="h-12 w-px bg-gray-200" />

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-2xs font-black uppercase tracking-widest text-gray-400">
              True Label
            </label>
            <Input
              value={(form.watch('options') as Record<string, string>)?.true_label || 'True'}
              onChange={(e) => {
                const opt = (form.watch('options') as Record<string, string>) || {};
                form.setValue('options', { ...opt, true_label: e.target.value });
              }}
              className="h-10 rounded-xl bg-white border-gray-100 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-2xs font-black uppercase tracking-widest text-gray-400">
              False Label
            </label>
            <Input
              value={(form.watch('options') as Record<string, string>)?.false_label || 'False'}
              onChange={(e) => {
                const opt = (form.watch('options') as Record<string, string>) || {};
                form.setValue('options', { ...opt, false_label: e.target.value });
              }}
              className="h-10 rounded-xl bg-white border-gray-100 font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from './question-form-types';

interface ReorderSubFormProps {
  form: UseFormReturn<QuestionFormData>;
}

export function ReorderSubForm({ form }: ReorderSubFormProps) {
  const steps =
    (form.watch('options') as { steps: Array<{ id: string; text: string }> })?.steps || [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {steps.map((step, index, all) => (
          <div key={step.id} className="flex items-center gap-4 group">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => {
                  const newSteps = [...all];
                  [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
                  form.setValue('options', { steps: newSteps });
                  form.setValue(
                    'solution',
                    newSteps.map((s) => s.id)
                  );
                }}
                className="h-6 w-6 text-gray-400 hover:text-indigo-600"
              >
                ▴
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === all.length - 1}
                onClick={() => {
                  const newSteps = [...all];
                  [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
                  form.setValue('options', { steps: newSteps });
                  form.setValue(
                    'solution',
                    newSteps.map((s) => s.id)
                  );
                }}
                className="h-6 w-6 text-gray-400 hover:text-indigo-600"
              >
                ▾
              </Button>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
              {index + 1}
            </div>
            <div className="flex-1 relative">
              <Input
                value={step.text}
                onChange={(e) => {
                  const newSteps = [...all];
                  newSteps[index].text = e.target.value;
                  form.setValue('options', { steps: newSteps });
                }}
                placeholder={`Step ${index + 1} content...`}
                className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold"
                required
                maxLength={200}
              />
              <span
                className={`text-[10px] absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold transition-colors ${step.text.length > 180 ? 'text-rose-500' : 'text-gray-300'}`}
              >
                {step.text.length}/200
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newSteps = [...all];
                newSteps.splice(index, 1);
                form.setValue('options', { steps: newSteps });
                form.setValue(
                  'solution',
                  newSteps.map((s) => s.id)
                );
              }}
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const nextId = String(steps.length + 1);
          const newSteps = [...steps, { id: nextId, text: '' }];
          form.setValue('options', { steps: newSteps });
          form.setValue(
            'solution',
            newSteps.map((s) => s.id)
          );
        }}
        className="rounded-xl border-dashed border-2 border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-2xs uppercase tracking-widest"
      >
        <Plus className="mr-2 h-3 w-3" /> Append Step
      </Button>
    </div>
  );
}

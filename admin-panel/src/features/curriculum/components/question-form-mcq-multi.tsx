import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from './question-form-types';

interface McqMultiSubFormProps {
  form: UseFormReturn<QuestionFormData>;
}

export function McqMultiSubForm({ form }: McqMultiSubFormProps) {
  const currentOptions =
    (form.watch('options') as { options: Array<{ id: string; text: string }> })?.options || [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {currentOptions.map((opt: { id: string; text: string }, index: number) => {
          const currentCorrect = (form.watch('solution') as string[]) || [];
          const isChecked = currentCorrect.includes(opt.id);

          return (
            <div key={index} className="flex items-center gap-4 group">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...currentCorrect, opt.id]
                    : currentCorrect.filter((id) => id !== opt.id);
                  form.setValue('solution', updated);
                }}
                className="w-6 h-6 rounded-md border-2 border-gray-200 text-indigo-600 focus:ring-indigo-500/20"
              />
              <div className="flex-1 flex gap-3">
                <Input
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...currentOptions];
                    newOpts[index].text = e.target.value;
                    form.setValue('options', { options: newOpts });
                  }}
                  placeholder={`Option ${opt.id.toUpperCase()}`}
                  data-testid={`question-multi-option-${index}`}
                  className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                  maxLength={200}
                />
                <span
                  className={`text-[10px] absolute right-16 top-1/2 -translate-y-1/2 font-mono font-bold transition-colors ${opt.text.length > 180 ? 'text-rose-500' : 'text-gray-300'}`}
                >
                  {opt.text.length}/200
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newOpts = [...currentOptions];
                  newOpts.splice(index, 1);
                  form.setValue('options', { options: newOpts });
                  form.setValue(
                    'solution',
                    currentCorrect.filter((id) => id !== opt.id)
                  );
                }}
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="question-form-append-option-multi"
        onClick={() => {
          const nextId = String.fromCharCode(97 + currentOptions.length);
          form.setValue('options', {
            options: [...currentOptions, { id: nextId, text: '' }],
          });
        }}
        className="rounded-xl border-dashed border-2 border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all font-bold text-2xs uppercase tracking-widest"
      >
        <Plus className="mr-2 h-3 w-3" /> Append Option
      </Button>
    </div>
  );
}

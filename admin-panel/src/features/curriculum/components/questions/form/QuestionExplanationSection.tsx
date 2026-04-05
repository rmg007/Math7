import { FormItem, FormControl, FormField, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { HelpCircle } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from '../../question-form-types';

interface QuestionExplanationSectionProps {
  form: UseFormReturn<QuestionFormData>;
}

export function QuestionExplanationSection({ form }: QuestionExplanationSectionProps) {
  return (
    <Card className="glass-card border-0 shadow-2xl shadow-amber-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-amber-500/20">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <CardContent className="relative p-12 space-y-10">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.25rem] bg-amber-600 text-white shadow-xl shadow-amber-600/30 transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Pedagogical Anchor</h3>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] font-mono italic">
              Cognitive Justification
            </p>
          </div>
        </div>
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Anchor the correct logic here..."
                    className="min-h-[120px]"
                  />
                  <div
                    className={`absolute bottom-4 right-4 text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border transition-all ${
                      (field.value?.length || 0) > 1100
                        ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-lg shadow-amber-500/10'
                        : 'bg-white/40 text-gray-400 border-gray-100'
                    }`}
                  >
                    {field.value?.length || 0}/1200
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-xs font-bold text-red-500 italic" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

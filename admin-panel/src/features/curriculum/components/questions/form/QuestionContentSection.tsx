import { FormItem, FormControl, FormField, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileText } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from '../../question-form-types';

interface QuestionContentSectionProps {
  form: UseFormReturn<QuestionFormData>;
}

export function QuestionContentSection({ form }: QuestionContentSectionProps) {
  return (
    <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-indigo-500/20 relative z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <CardContent className="relative p-12 space-y-10">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.25rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Assessment Matrix</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono italic">
              Primary Instruction Prompt
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormControl>
                <div className="relative">
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Formulate the assessment prompt..."
                    className="min-h-[200px]"
                  />
                  <div
                    className={`absolute bottom-4 right-4 text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border transition-all ${
                      field.value.length > 750
                        ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-lg shadow-rose-500/10'
                        : 'bg-white/40 text-gray-400 border-gray-100'
                    }`}
                  >
                    {field.value.length}/800
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

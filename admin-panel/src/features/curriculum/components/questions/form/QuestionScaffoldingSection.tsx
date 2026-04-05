import { FormItem, FormControl, FormField, FormMessage, FormLabel } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
import { Sparkles, Zap, Layers, HelpCircle } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from '../../question-form-types';

interface QuestionScaffoldingSectionProps {
  form: UseFormReturn<QuestionFormData>;
}

export function QuestionScaffoldingSection({ form }: QuestionScaffoldingSectionProps) {
  return (
    <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-indigo-500/20">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <CardContent className="relative p-12 space-y-12">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[1.25rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              Pedagogical Scaffolding
            </h3>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] font-mono italic">
              Hints & Simplified Explanations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
          <FormField
            control={form.control}
            name="hint_text"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Progressive Hint
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value || ''}
                      maxLength={400}
                      placeholder="Give a subtle nudge without giving it away..."
                      className="h-14 rounded-2xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-gray-300 placeholder:italic pr-20"
                    />
                    <div
                      className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-md border transition-all ${
                        (field.value?.length || 0) > 350
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-gray-50/50 text-gray-400 border-gray-100'
                      }`}
                    >
                      {field.value?.length || 0}/400
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rule_text"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
                  <Layers className="w-3 h-3 text-blue-500" />
                  Fundamental Rule / Formula
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value || ''}
                      maxLength={400}
                      placeholder="State the core theorem or rule (e.g. Pythagoras Theorem)..."
                      className="h-14 rounded-2xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300 placeholder:italic pr-20"
                    />
                    <div
                      className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-md border transition-all ${
                        (field.value?.length || 0) > 350
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-gray-50/50 text-gray-400 border-gray-100'
                      }`}
                    >
                      {field.value?.length || 0}/400
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eli10_text"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500">
                  <HelpCircle className="w-3 h-3 text-emerald-500" />
                  ELI10 Explanation
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Explain like I'm 10 - simplify the complex..."
                      className="min-h-[100px]"
                    />
                    <div
                      className={`absolute bottom-4 right-4 text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md border transition-all ${
                        (field.value?.length || 0) > 350
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-white/40 text-gray-400 border-gray-100'
                      }`}
                    >
                      {field.value?.length || 0}/400
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

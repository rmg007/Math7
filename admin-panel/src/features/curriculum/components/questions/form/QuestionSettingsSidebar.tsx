import { FormItem, FormControl, FormField, FormMessage, FormLabel } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Layers, Sparkles, Loader2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from '../../question-form-types';
import { QUESTION_TYPES, STATUS_OPTIONS } from '../../question-form-types';

interface QuestionSettingsSidebarProps {
  form: UseFormReturn<QuestionFormData>;
  skills?: { skill_id: string; title: string }[];
  isSubmitting: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

export function QuestionSettingsSidebar({
  form,
  skills,
  isSubmitting,
  isEdit,
  onCancel,
}: QuestionSettingsSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Protocol Settings */}
      <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/10 rounded-[2rem] group/card relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardContent className="relative p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <Settings className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none pt-1">
              Protocol Matrix
            </h3>
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                  Interaction Model
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-slate-500/10 transition-all"
                      data-testid="question-type-select"
                    >
                      <SelectValue placeholder="Protocol type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="font-bold py-2"
                        data-testid={`question-form-type-select-item-${t}`}
                      >
                        {t.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                  Visibility state
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger
                      data-testid="status-select"
                      className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    >
                      <SelectValue placeholder="Deployment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2">
                        <span className="font-bold text-gray-900">{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                  Weightage (Valuation)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    className="h-12 rounded-xl bg-white/50 border-gray-100 font-black text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  />
                </FormControl>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Categorization */}
      <Card className="glass-card border-0 shadow-2xl shadow-purple-500/10 rounded-[2rem] group/card relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <CardContent className="relative p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none pt-1">
              Ontology Link
            </h3>
          </div>

          <FormField
            control={form.control}
            name="skill_id"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                  Target Skill Segment
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger
                      className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-purple-500/10 transition-all"
                      data-testid="question-skill-select"
                    >
                      <SelectValue placeholder="Link to ontology" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {skills?.map((skill) => (
                      <SelectItem
                        key={skill.skill_id}
                        value={skill.skill_id}
                        className="font-bold py-2"
                      >
                        {skill.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-2xs font-bold text-red-500 italic" />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Actions Footer */}
      <div className="flex flex-col gap-6 pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="question-submit-btn"
          className="w-full h-20 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.4em] bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-2 active:scale-[0.98] gap-4 group/submit"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin h-6 w-6" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-indigo-200 transition-transform group-hover/submit:rotate-12 group-hover/submit:scale-125" />
              {isEdit ? 'COMMIT ARTIFACT' : 'DEPLOY QUESTION'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.6em] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300"
        >
          Abort Execution
        </Button>
      </div>
    </div>
  );
}

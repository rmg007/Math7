import { CheckCircle2, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { UseFormReturn } from 'react-hook-form';
import type { QuestionFormData } from '../../question-form-types';
import { QUESTION_TYPES } from '../../question-form-types';

// SubForms
import { BooleanSubForm } from '../../question-form-boolean';
import { McqSubForm } from '../../question-form-mcq';
import { McqMultiSubForm } from '../../question-form-mcq-multi';
import { ReorderSubForm } from '../../question-form-reorder';
import { TextInputSubForm } from '../../question-form-text-input';

interface QuestionLogicSectionProps {
  form: UseFormReturn<QuestionFormData>;
}

export function QuestionLogicSection({ form }: QuestionLogicSectionProps) {
  const questionType = form.watch('type');

  return (
    <Card className="glass-card border-0 shadow-2xl shadow-emerald-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-emerald-500/20">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <CardContent className="relative p-12 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-[1.25rem] bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 transform group-hover/card:scale-110 group-hover/card:-rotate-3 transition-transform duration-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                Verification Logic
              </h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] font-mono italic">
                Validation Schema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
            <Zap className="w-4 h-4 text-indigo-300 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">
              {questionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {questionType === 'multiple_choice' && <McqSubForm form={form} />}
        {questionType === 'mcq_multi' && <McqMultiSubForm form={form} />}
        {questionType === 'boolean' && <BooleanSubForm form={form} />}
        {questionType === 'text_input' && <TextInputSubForm form={form} />}
        {questionType === 'reorder_steps' && <ReorderSubForm form={form} />}

        {/* Placeholder for other complex types to maintain UI consistency */}
        {!(QUESTION_TYPES as readonly string[]).includes(questionType) && (
          <div className="p-12 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-black text-xs uppercase tracking-widest italic scale-90 opacity-50">
              Dynamic configuration for {questionType.replace('_', ' ')} protocol active
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

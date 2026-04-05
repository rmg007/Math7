import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Loader2 } from 'lucide-react';

import { AdminHeader } from '@/components/ui/admin-header';
import { Form } from '@/components/ui/form';
import { useApp } from '@/hooks/use-app';
import { normalizeFormData } from '@/lib/normalization';
import { castJson } from '@/lib/type-utils';
import type { Json } from '@questerix/core/types/database';
import { Database } from '@questerix/core/types/database';

import { useCreateQuestion, useUpdateQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import {
  BooleanSolution,
  McqMultiSolution,
  McqSolution,
  QuestionOptions,
  ReorderStepsSolution,
  TextInputSolution,
} from '../types';
import { QuestionFormData, questionSchema } from './question-form-types';

// Modular Sections
import { QuestionContentSection } from './questions/form/QuestionContentSection';
import { QuestionLogicSection } from './questions/form/QuestionLogicSection';
import { QuestionExplanationSection } from './questions/form/QuestionExplanationSection';
import { QuestionScaffoldingSection } from './questions/form/QuestionScaffoldingSection';
import { QuestionSettingsSidebar } from './questions/form/QuestionSettingsSidebar';

type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionFormProps {
  initialData?: Question;
}

export function QuestionForm({ initialData }: QuestionFormProps) {
  const navigate = useNavigate();
  const { currentApp } = useApp();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const { data: skills, isLoading: isLoadingSkills } = useSkills();

  const parseOptions = (data: Question | undefined, type: string): QuestionOptions => {
    if (!data?.options) {
      switch (type) {
        case 'multiple_choice':
        case 'mcq_multi':
          return {
            options: [
              { id: 'a', text: '' },
              { id: 'b', text: '' },
            ],
          };
        case 'boolean':
          return { true_label: 'True', false_label: 'False' };
        case 'text_input':
          return { placeholder: '' };
        case 'reorder_steps':
          return {
            steps: [
              { id: '1', text: '' },
              { id: '2', text: '' },
            ],
          };
        default:
          return {
            options: [
              { id: 'a', text: '' },
              { id: 'b', text: '' },
            ],
          };
      }
    }
    return castJson<QuestionOptions>(data.options);
  };

  const parseSolution = (data: Question | undefined, type: string) => {
    if (!data?.solution) {
      switch (type) {
        case 'multiple_choice':
          return '';
        case 'mcq_multi':
          return [];
        case 'boolean':
          return false;
        case 'text_input':
          return '';
        case 'reorder_steps':
          return [];
        default:
          return '';
      }
    }
    const sol = castJson<Record<string, unknown>>(data.solution);
    switch (type) {
      case 'multiple_choice':
        return castJson<McqSolution>(sol).correct_option_id || '';
      case 'mcq_multi':
        return castJson<McqMultiSolution>(sol).correct_ids || [];
      case 'boolean':
        return castJson<BooleanSolution>(sol).correct_value ?? null;
      case 'text_input':
        return castJson<TextInputSolution>(sol).exact_match || '';
      case 'reorder_steps':
        return castJson<ReorderStepsSolution>(sol).correct_order || [];
      default:
        return castJson<McqSolution>(sol).correct_option_id || '';
    }
  };

  const initialType = initialData?.type || 'multiple_choice';

  const form = useForm<QuestionFormData>({
    mode: 'onBlur',
    resolver: zodResolver(questionSchema),
    defaultValues: {
      skill_id: initialData?.skill_id || '',
      type: initialType as QuestionFormData['type'],
      content: initialData?.content ? String(initialData.content) : '',
      explanation: initialData?.explanation || '',
      hint_text: initialData?.hint_text || '',
      rule_text: initialData?.rule_text || '',
      eli10_text: initialData?.eli10_text || '',
      points: initialData?.points || 1,
      status: (initialData?.status as 'draft' | 'live') || 'draft',
      options: parseOptions(initialData, initialType),
      solution: parseSolution(initialData, initialType),
    },
  });

  const questionType = form.watch('type');
  const prevTypeRef = useRef(questionType);

  useEffect(() => {
    if (prevTypeRef.current !== questionType && !initialData) {
      form.setValue('options', parseOptions(undefined, questionType));
      form.setValue('solution', parseSolution(undefined, questionType));
      form.clearErrors();
    }
    prevTypeRef.current = questionType;
  }, [questionType, form, initialData]);

  const onSubmit = async (data: QuestionFormData) => {
    const normalized = normalizeFormData(data, {
      trim: ['content', 'explanation', 'hint_text', 'rule_text', 'eli10_text'],
    });

    try {
      const submissionData: Database['public']['Tables']['questions']['Insert'] = {
        ...normalized,
        type: data.type as Database['public']['Enums']['question_type'],
        app_id: currentApp?.app_id || '',
        solution: data.solution as Json,
        options: data.options as Json,
      };

      // Custom transformation based on type
      if (data.type === 'multiple_choice') {
        if (!data.solution) {
          form.setError('solution', { message: 'Required' });
          return;
        }
        submissionData.solution = castJson<Json>({ correct_option_id: data.solution });
      } else if (data.type === 'mcq_multi') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Select at least one correct option' });
          return;
        }
        submissionData.solution = castJson<Json>({ correct_ids: data.solution });
      } else if (data.type === 'text_input') {
        if (!data.solution) {
          form.setError('solution', { message: 'Required' });
          return;
        }
        submissionData.solution = castJson<Json>({ exact_match: data.solution });
      } else if (data.type === 'boolean') {
        if (data.solution === null || data.solution === undefined) {
          form.setError('solution', { message: 'Specify truth value' });
          return;
        }
        submissionData.solution = castJson<Json>({ correct_value: data.solution });
      } else if (data.type === 'reorder_steps') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Order sequence required' });
          return;
        }
        submissionData.solution = castJson<Json>({ correct_order: data.solution });
      }

      if (initialData) {
        await updateQuestion.mutateAsync({
          question_id: initialData.question_id,
          ...submissionData,
        });
      } else {
        await createQuestion.mutateAsync(submissionData);
      }
      navigate('/questions');
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  if (isLoadingSkills)
    return (
      <div className="flex h-[50vh] justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <AdminHeader
        title={initialData ? 'Question Architect' : 'Question Genesis'}
        description={
          initialData
            ? 'Modifying existing pedagogical assessment artifact'
            : 'Synthesizing new assessment unit for the curriculum'
        }
        icon={HelpCircle}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-10 pb-20"
          data-testid="question-form"
        >
          <fieldset disabled={isSubmitting} className="space-y-10 disabled:opacity-60">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <QuestionContentSection form={form} />
                <QuestionLogicSection form={form} />
                <QuestionExplanationSection form={form} />
                <QuestionScaffoldingSection form={form} />
              </div>

              <div className="lg:col-span-1">
                <QuestionSettingsSidebar
                  form={form}
                  skills={skills}
                  isSubmitting={isSubmitting}
                  isEdit={Boolean(initialData)}
                  onCancel={() => navigate('/questions')}
                />
              </div>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}

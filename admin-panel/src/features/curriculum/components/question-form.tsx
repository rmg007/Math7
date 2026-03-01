import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/hooks/use-app';
import type { Json } from '@/lib/database.types';
import { Database } from '@/lib/database.types';
import { normalizeFormData } from '@/lib/normalization';
import { castJson } from '@/lib/type-utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { BooleanSubForm } from './question-form-boolean';
import { McqMultiSubForm } from './question-form-mcq-multi';
import { McqSubForm } from './question-form-mcq';
import { ReorderSubForm } from './question-form-reorder';
import { TextInputSubForm } from './question-form-text-input';
import {
  QUESTION_TYPES,
  QuestionFormData,
  STATUS_OPTIONS,
  questionSchema,
} from './question-form-types';

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
      trim: ['content', 'explanation'],
    });

    try {
      const submissionData: Database['public']['Tables']['questions']['Insert'] = {
        ...normalized,
        type: data.type as Database['public']['Enums']['question_type'],
        app_id: currentApp?.app_id || '',
        solution: data.solution as Json,
        options: data.options as Json,
      };

      if (data.type === 'multiple_choice') {
        if (!data.solution) {
          form.setError('solution', { message: 'Required' });
          return;
        }
        submissionData.solution = castJson<Json>({
          correct_option_id: data.solution,
        });
      } else if (data.type === 'mcq_multi') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Select at least one correct option' });
          return;
        }
        submissionData.solution = castJson<Json>({
          correct_ids: data.solution,
        });
      } else if (data.type === 'text_input') {
        if (!data.solution) {
          form.setError('solution', { message: 'Required' });
          return;
        }
        submissionData.solution = castJson<Json>({
          exact_match: data.solution,
        });
      } else if (data.type === 'boolean') {
        if (data.solution === null || data.solution === undefined) {
          form.setError('solution', { message: 'Specify truth value' });
          return;
        }
        submissionData.solution = castJson<Json>({
          correct_value: data.solution,
        });
      } else if (data.type === 'reorder_steps') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Order sequence required' });
          return;
        }
        submissionData.solution = castJson<Json>({
          correct_order: data.solution,
        });
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
          <fieldset
            disabled={form.formState.isSubmitting}
            className="space-y-10 disabled:opacity-60"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Content Area */}
                <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-indigo-500/20 relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <CardContent className="relative p-12 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-[1.25rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          Assessment Matrix
                        </h3>
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
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Formulate the assessment prompt..."
                              className="min-h-[200px]"
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-bold text-red-500 italic" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Answer Logic */}
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

                {/* Rationalization */}
                <Card className="glass-card border-0 shadow-2xl shadow-amber-500/10 rounded-[2.5rem] group/card transition-all duration-500 hover:shadow-amber-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <CardContent className="relative p-12 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-[1.25rem] bg-amber-600 text-white shadow-xl shadow-amber-600/30 transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-500">
                        <HelpCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          Pedagogical Anchor
                        </h3>
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
                            <RichTextEditor
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Anchor the correct logic here..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-bold text-red-500 italic" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

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
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="py-2"
                                >
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
                        {initialData ? 'COMMIT ARTIFACT' : 'DEPLOY QUESTION'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/questions')}
                    className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.6em] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300"
                  >
                    Abort Execution
                  </Button>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}

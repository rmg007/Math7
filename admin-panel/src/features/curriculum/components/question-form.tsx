import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/hooks/use-app';
import type { Json } from '@/lib/database.types';
import { Database } from '@/lib/database.types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  Settings,
  Trash,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useCreateQuestion, useUpdateQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import {
  BooleanSolution,
  McqMultiSolution,
  McqSolution,
  QuestionOptions,
  ReorderStepsSolution,
  TextInputSolution,
} from '../types/question-types';

type Question = Database['public']['Tables']['questions']['Row'];

const QUESTION_TYPES = [
  'multiple_choice',
  'mcq_multi',
  'text_input',
  'boolean',
  'reorder_steps',
] as const;

const STATUS_OPTIONS: { value: 'draft' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const questionSchema = z.object({
  skill_id: z.string().uuid('Please select a target skill'),
  type: z.enum(QUESTION_TYPES),
  content: z.string().min(1, 'Question text is required'),
  options: z.unknown(),
  solution: z.unknown(),
  explanation: z.string().optional(),
  points: z.coerce.number().min(1),
  status: z.enum(['draft', 'live']).default('draft'),
});

type QuestionFormData = z.infer<typeof questionSchema>;

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
    return data.options as unknown as QuestionOptions;
  };

  const parseSolution = (data: Question | undefined, type: string) => {
    if (!data?.solution) {
      switch (type) {
        case 'multiple_choice':
          return '';
        case 'mcq_multi':
          return [];
        case 'boolean':
          return null;
        case 'text_input':
          return '';
        case 'reorder_steps':
          return [];
        default:
          return '';
      }
    }
    const sol = data.solution as Record<string, unknown>;
    switch (type) {
      case 'multiple_choice':
        return (sol as unknown as McqSolution).correct_option_id || '';
      case 'mcq_multi':
        return (sol as unknown as McqMultiSolution).correct_ids || [];
      case 'boolean':
        return (sol as unknown as BooleanSolution).correct_value ?? null;
      case 'text_input':
        return (sol as unknown as TextInputSolution).exact_match || '';
      case 'reorder_steps':
        return (sol as unknown as ReorderStepsSolution).correct_order || [];
      default:
        return (sol as unknown as McqSolution).correct_option_id || '';
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
  const currentOptions =
    (form.watch('options') as { options: Array<{ id: string; text: string }> })?.options || [];
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
    try {
      const submissionData: Database['public']['Tables']['questions']['Insert'] = {
        ...data,
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
        submissionData.solution = {
          correct_option_id: data.solution,
        } as unknown as Json;
      } else if (data.type === 'mcq_multi') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Select at least one correct option' });
          return;
        }
        submissionData.solution = {
          correct_ids: data.solution,
        } as unknown as Json;
      } else if (data.type === 'text_input') {
        if (!data.solution) {
          form.setError('solution', { message: 'Required' });
          return;
        }
        submissionData.solution = {
          exact_match: data.solution,
        } as unknown as Json;
      } else if (data.type === 'boolean') {
        if (data.solution === null || data.solution === undefined) {
          form.setError('solution', { message: 'Specify truth value' });
          return;
        }
        submissionData.solution = {
          correct_value: data.solution,
        } as unknown as Json;
      } else if (data.type === 'reorder_steps') {
        if (!Array.isArray(data.solution) || data.solution.length === 0) {
          form.setError('solution', { message: 'Order sequence required' });
          return;
        }
        submissionData.solution = {
          correct_order: data.solution,
        } as unknown as Json;
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title={initialData ? 'Edit Question' : 'Add Question'}
        description="Question details"
        icon={HelpCircle}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-20">
          <fieldset
            disabled={form.formState.isSubmitting}
            className="space-y-10 disabled:opacity-60"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Content Area */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/10">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                          Question Core
                        </h3>
                        <p className="text-2xs font-black text-gray-400 uppercase tracking-widest">
                          Primary instructional text
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
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            Validation Logic
                          </h3>
                          <p className="text-2xs font-black text-gray-400 uppercase tracking-widest">
                            Answer configuration
                          </p>
                        </div>
                      </div>
                      <span className="text-2xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest italic">
                        {questionType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* MCQ Multi Implementation */}
                    {questionType === 'mcq_multi' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {currentOptions.map(
                            (opt: { id: string; text: string }, index: number) => {
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
                                      className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newOpts = [...currentOptions];
                                      newOpts.splice(index, 1);
                                      form.setValue('options', { options: newOpts });
                                      // Also remove from solution if it was there
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
                            }
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
                    )}

                    {/* Boolean Implementation */}
                    {questionType === 'boolean' && (
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
                                value={
                                  (form.watch('options') as Record<string, string>)?.true_label ||
                                  'True'
                                }
                                onChange={(e) => {
                                  const opt =
                                    (form.watch('options') as Record<string, string>) || {};
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
                                value={
                                  (form.watch('options') as Record<string, string>)?.false_label ||
                                  'False'
                                }
                                onChange={(e) => {
                                  const opt =
                                    (form.watch('options') as Record<string, string>) || {};
                                  form.setValue('options', { ...opt, false_label: e.target.value });
                                }}
                                className="h-10 rounded-xl bg-white border-gray-100 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {questionType === 'text_input' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Master Key (Exact Match)
                          </label>
                          <Input
                            value={form.watch('solution') as string}
                            onChange={(e) => form.setValue('solution', e.target.value)}
                            placeholder="Enter the authoritative response..."
                            className="h-14 rounded-2xl bg-white/50 border-gray-100 text-lg font-black tracking-tight focus:ring-8 focus:ring-emerald-500/5 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Reorder Steps Implementation */}
                    {questionType === 'reorder_steps' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          {(
                            (
                              form.watch('options') as {
                                steps: Array<{ id: string; text: string }>;
                              }
                            )?.steps || []
                          ).map((step, index, all) => (
                            <div key={step.id} className="flex items-center gap-4 group">
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const steps = [...all];
                                    [steps[index - 1], steps[index]] = [
                                      steps[index],
                                      steps[index - 1],
                                    ];
                                    form.setValue('options', { steps });
                                    form.setValue(
                                      'solution',
                                      steps.map((s) => s.id)
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
                                    const steps = [...all];
                                    [steps[index], steps[index + 1]] = [
                                      steps[index + 1],
                                      steps[index],
                                    ];
                                    form.setValue('options', { steps });
                                    form.setValue(
                                      'solution',
                                      steps.map((s) => s.id)
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
                              <Input
                                value={step.text}
                                onChange={(e) => {
                                  const steps = [...all];
                                  steps[index].text = e.target.value;
                                  form.setValue('options', { steps });
                                }}
                                placeholder={`Step ${index + 1} content...`}
                                className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const steps = [...all];
                                  steps.splice(index, 1);
                                  form.setValue('options', { steps });
                                  form.setValue(
                                    'solution',
                                    steps.map((s) => s.id)
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
                            const steps =
                              (
                                form.watch('options') as {
                                  steps: Array<{ id: string; text: string }>;
                                }
                              )?.steps || [];
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
                    )}

                    {/* Placeholder for other complex types to maintain UI consistency */}
                    {!(QUESTION_TYPES as readonly string[]).includes(questionType) && (
                      <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold italic">
                          Dynamic configuration for {questionType.replace('_', ' ')} protocol
                          active.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Explanation */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10">
                        <HelpCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                          Rationalization
                        </h3>
                        <p className="text-2xs font-black text-gray-400 uppercase tracking-widest">
                          Solution explanation
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
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/10">
                        <Settings className="h-5 w-5 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Metadata</h3>
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
                              <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-slate-500/10 transition-all">
                                <SelectValue placeholder="Protocol type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="font-bold py-2">
                                  {t.replace('_', ' ').toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all">
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
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Categorization */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/10">
                        <Layers className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Anchoring</h3>
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
                              <SelectTrigger className="h-12 rounded-xl bg-white/50 border-gray-100 font-bold focus:ring-4 focus:ring-purple-500/10 transition-all">
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

                {/* Actions Footer - Floating style for mobile/right for desktop handled by flex */}
                <div className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : initialData ? (
                      'COMMIT UPDATE'
                    ) : (
                      'DEPLOY QUESTION'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/questions')}
                    className="w-full h-12 rounded-xl font-black text-2xs uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900"
                  >
                    ABORT EXECUTION
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

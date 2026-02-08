import { useForm } from 'react-hook-form';
import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateQuestion, useUpdateQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash, ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Database } from '@/lib/database.types';
import type { Json } from '@/types/database.types';

type Question = Database['public']['Tables']['questions']['Row'];

// Hardcoded for now based on Schema
const QUESTION_TYPES = ['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps'] as const;

const STATUS_OPTIONS: { value: 'draft' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

// Zod schema for the form
const questionSchema = z.object({
  skill_id: z.string().uuid(),
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

  // Helper to parse initial JSON data based on question type
  const parseOptions = (data: Question | undefined, type: string) => {
      if (!data?.options) {
          switch (type) {
              case 'multiple_choice':
              case 'mcq_multi':
                  return { options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] };
              case 'boolean':
                  return { true_label: 'True', false_label: 'False' };
              case 'text_input':
                  return { placeholder: '' };
              case 'reorder_steps':
                  return { steps: [{ id: '1', text: '' }, { id: '2', text: '' }] };
              default:
                  return { options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] };
          }
      }
      return data.options;
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
      // Parse JSON solution
      let sol: Json = {};
      try {
        sol = typeof data.solution === 'string' ? JSON.parse(data.solution as string) : data.solution;
      } catch {
        sol = data.solution || {};
      }
      switch (type) {
          case 'multiple_choice':
              return (sol as Record<string, unknown>).correct_option_id || '';
          case 'mcq_multi':
              return (sol as Record<string, unknown>).correct_ids || [];
          case 'boolean':
              return (sol as Record<string, unknown>).correct_value ?? null;
          case 'text_input':
              return (sol as Record<string, unknown>).exact_match || '';
          case 'reorder_steps':
              return (sol as Record<string, unknown>).correct_order || [];
          default:
              return (sol as Record<string, unknown>).correct_option_id || '';
      }
  };

  const initialType = initialData?.type || 'multiple_choice';
  
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      skill_id: initialData?.skill_id || '',
      type: initialType as QuestionFormData['type'],
      content: initialData?.content || '',
      explanation: initialData?.explanation|| '',
      points: initialData?.points || 1,
      status: ('status' in (initialData || {})) ? (initialData?.status as 'draft' | 'live') : 'draft',
      options:parseOptions(initialData, initialType), 
      solution: parseSolution(initialData, initialType),
    },
  });

  const questionType = form.watch('type');
  const prevTypeRef = useRef(questionType);

  useEffect(() => {
    if (prevTypeRef.current !== questionType && !initialData) {
      const defaultOptions = parseOptions(undefined, questionType);
      const defaultSolution = parseSolution(undefined, questionType);
      form.setValue('options', defaultOptions);
      form.setValue('solution', defaultSolution);
      form.clearErrors();
    }
    prevTypeRef.current = questionType;
  }, [questionType, form, initialData]);

  const onSubmit = async (data: QuestionFormData) => {
    try {
      const submissionData: Partial<Question> = { 
        ...data,
        app_id: currentApp?.app_id || '',
        options: data.options as Json,
        solution: data.solution as Json
      };

      if (data.type === 'multiple_choice') {
          const opts = data.options as { options: { id: string, text: string}[] };
          const correctId = data.solution as string;
          
          if (!correctId) {
             form.setError('solution', { message: 'Please select a correct answer' });
             return;
          }

          submissionData.options = opts as Json;
          submissionData.solution = { correct_option_id: correctId } as Json;
      } else if (data.type === 'mcq_multi') {
          const opts = data.options as { options: { id: string, text: string}[] };
          const correctIds = data.solution as string[];
          
          if (!correctIds || correctIds.length === 0) {
             form.setError('solution', { message: 'Please select at least one correct answer' });
             return;
          }

          submissionData.options = opts as Json;
          submissionData.solution = { correct_ids: correctIds } as Json;
      } else if (data.type === 'boolean') {
          const labels = data.options as { true_label?: string; false_label?: string };
          const correctValue = data.solution as boolean;
          
          if (correctValue === null || correctValue === undefined) {
             form.setError('solution', { message: 'Please select a correct answer' });
             return;
          }

          submissionData.options = labels as Json;
          submissionData.solution = { correct_value: correctValue } as Json;
      } else if (data.type === 'text_input') {
          const placeholder = data.options as { placeholder?: string };
          const exactMatch = data.solution as string;
          
          if (!exactMatch) {
             form.setError('solution', { message: 'Please provide the expected answer' });
             return;
          }

          submissionData.options = placeholder as Json;
          submissionData.solution = { exact_match: exactMatch } as Json;
      } else if (data.type === 'reorder_steps') {
          const opts = data.options as { steps: { id: string; text: string }[] };
          const correctOrder = data.solution as string[];
          
          if (!opts.steps || opts.steps.length < 2) {
             form.setError('options', { message: 'Please add at least 2 steps' });
             return;
          }
          
          if (!correctOrder || correctOrder.length !== opts.steps.length) {
             form.setError('solution', { message: 'Please set the correct order for all steps' });
             return;
          }

          submissionData.options = opts as Json;
          submissionData.solution = { correct_order: correctOrder } as Json;
      }

      if (initialData) {
        await updateQuestion.mutateAsync({
           question_id: initialData.question_id,
           ...submissionData
        });
      } else {
        await createQuestion.mutateAsync(submissionData as Database['public']['Tables']['questions']['Insert']);
      }
      navigate('/questions');
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  // Custom Field Array for MCQ Options
  const currentOptions = (form.watch('options') as { options: { id: string; text: string }[] })?.options || [];
  const setOptions = (newOptions: { id: string; text: string }[]) => {
      form.setValue('options', { options: newOptions });
  };

  const addOption = () => {
     const nextId = String.fromCharCode(97 + currentOptions.length); // a, b, c...
     setOptions([...currentOptions, { id: nextId, text: '' }]);
  };

  const removeOption = (index: number) => {
      const newOpts = [...currentOptions];
      newOpts.splice(index, 1);
      setOptions(newOpts);
  };

  const updateOptionText = (index: number, text: string) => {
      const newOpts = [...currentOptions];
      newOpts[index].text = text;
      setOptions(newOpts);
  };

  // MCQ Multi helpers
  const currentSelectedIds = (form.watch('solution') as string[]) || [];
  const toggleSelectedId = (id: string) => {
      const current = [...currentSelectedIds];
      const idx = current.indexOf(id);
      if (idx >= 0) {
          current.splice(idx, 1);
      } else {
          current.push(id);
      }
      form.setValue('solution', current);
  };

  // Boolean helpers
  const currentBooleanOpts = form.watch('options') as { true_label?: string, false_label?: string } || {};
  const booleanAnswer = form.watch('solution') as boolean | null;

  // Text input helpers
  const currentTextOpts = form.watch('options') as { placeholder?: string } || {};
  const textAnswer = form.watch('solution') as string || '';

  // Reorder steps helpers
  const currentSteps = (form.watch('options') as { steps: { id: string; text: string }[] })?.steps || [];
  const currentOrder = (form.watch('solution') as string[]) || [];

  const setSteps = (newSteps: { id: string; text: string }[]) => {
      form.setValue('options', { steps: newSteps });
  };

  const addStep = () => {
      const nextId = String(currentSteps.length + 1);
      const newSteps = [...currentSteps, { id: nextId, text: '' }];
      setSteps(newSteps);
      form.setValue('solution', [...currentOrder, nextId]);
  };

  const removeStep = (index: number) => {
      const stepId = currentSteps[index].id;
      const newSteps = [...currentSteps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
      const newOrder = currentOrder.filter((id: string) => id !== stepId);
      form.setValue('solution', newOrder);
  };

  const updateStepText = (index: number, text: string) => {
      const newSteps = [...currentSteps];
      newSteps[index].text = text;
      setSteps(newSteps);
  };

  const moveStepInOrder = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...currentOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return;
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      form.setValue('solution', newOrder);
  };

  if (isLoadingSkills) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-5xl mx-auto pb-10">
        
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{initialData ? 'Edit Question' : 'Create Question'}</h2>
                <p className="text-muted-foreground">Define the content and answers for this practice problem.</p>
            </div>
            <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/questions')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Save Changes' : 'Create Question'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Question Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {QUESTION_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t.replace('_', ' ').toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text & Media</FormLabel>
                              <FormControl>
                                <RichTextEditor 
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="What is 2 + 2?"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Answer Configuration</CardTitle>
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded capitalize">
                                {questionType.replace('_', ' ')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {questionType === 'multiple_choice' && (
                            <div className="space-y-4">
                                <RadioGroup 
                                    onValueChange={(val) => form.setValue('solution', val)} 
                                    defaultValue={form.watch('solution') as string}
                                    className="space-y-3"
                                >
                                    {currentOptions.map((opt, index: number) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <RadioGroupItem value={opt.id} id={opt.id} />
                                            <div className="flex-1 flex gap-2">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-sm font-medium shrink-0">
                                                    {opt.id.toUpperCase()}
                                                </span>
                                                <Input 
                                                    value={opt.text} 
                                                    onChange={(e) => updateOptionText(index, e.target.value)}
                                                    placeholder={`Option ${opt.id.toUpperCase()}`}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                                                <Trash className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                </RadioGroup>
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2 text-primary hover:text-primary">
                                    <Plus className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                                {form.formState.errors.solution && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.solution.message as string}
                                     </p>
                                )}
                            </div>
                        )}

                        {questionType === 'mcq_multi' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-2">Check the boxes for all correct answers.</p>
                                <div className="space-y-3">
                                    {currentOptions.map((opt, index: number) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <Checkbox 
                                                checked={currentSelectedIds.includes(opt.id)}
                                                onCheckedChange={() => toggleSelectedId(opt.id)}
                                            />
                                            <div className="flex-1 flex gap-2">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-sm font-medium shrink-0">
                                                    {opt.id.toUpperCase()}
                                                </span>
                                                <Input 
                                                    value={opt.text} 
                                                    onChange={(e) => updateOptionText(index, e.target.value)}
                                                    placeholder={`Option ${opt.id.toUpperCase()}`}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                                                <Trash className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2 text-primary hover:text-primary">
                                    <Plus className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                                {form.formState.errors.solution && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.solution.message as string}
                                     </p>
                                )}
                            </div>
                        )}

                        {questionType === 'boolean' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel>True Label (Optional)</FormLabel>
                                        <Input 
                                            value={currentBooleanOpts.true_label || ''} 
                                            onChange={(e) => form.setValue('options', { ...currentBooleanOpts, true_label: e.target.value })}
                                            placeholder="True"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>False Label (Optional)</FormLabel>
                                        <Input 
                                            value={currentBooleanOpts.false_label || ''} 
                                            onChange={(e) => form.setValue('options', { ...currentBooleanOpts, false_label: e.target.value })}
                                            placeholder="False"
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <FormLabel>Correct Answer</FormLabel>
                                    <div className="flex gap-4">
                                        <Button 
                                            type="button" 
                                            size="lg"
                                            variant={booleanAnswer === true ? 'default' : 'outline'}
                                            onClick={() => form.setValue('solution', true)}
                                            className="flex-1"
                                        >
                                            {currentBooleanOpts.true_label || 'True'}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            size="lg"
                                            variant={booleanAnswer === false ? 'default' : 'outline'}
                                            onClick={() => form.setValue('solution', false)}
                                            className="flex-1"
                                        >
                                            {currentBooleanOpts.false_label || 'False'}
                                        </Button>
                                    </div>
                                </div>
                                {form.formState.errors.solution && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.solution.message as string}
                                     </p>
                                )}
                            </div>
                        )}

                        {questionType === 'text_input' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <FormLabel>Correct Answer (Exact Match)</FormLabel>
                                    <Input 
                                        value={textAnswer} 
                                        onChange={(e) => form.setValue('solution', e.target.value)}
                                        placeholder="Enter the exact answer key"
                                        className="h-12 text-lg font-medium"
                                    />
                                    <p className="text-xs text-muted-foreground">The student's input must match this exactly (case-insensitive depending on implementation).</p>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Placeholder Text (Optional)</FormLabel>
                                    <Input 
                                        value={currentTextOpts.placeholder || ''} 
                                        onChange={(e) => form.setValue('options', { placeholder: e.target.value })}
                                        placeholder="e.g. Type your answer here..."
                                    />
                                </div>
                                {form.formState.errors.solution && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.solution.message as string}
                                     </p>
                                )}
                            </div>
                        )}

                        {questionType === 'reorder_steps' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-medium">Step Definitions</h4>
                                        <Button type="button" variant="outline" size="sm" onClick={addStep}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Step
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {currentSteps.map((step, index: number) => (
                                            <div key={step.id} className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-sm font-medium shrink-0">
                                                    {step.id}
                                                </span>
                                                <Input 
                                                    value={step.text} 
                                                    onChange={(e) => updateStepText(index, e.target.value)}
                                                    placeholder={`Step ${step.id} text`}
                                                    className="flex-1"
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)} disabled={currentSteps.length <= 2}>
                                                    <Trash className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Set Correct Order</h4>
                                    <p className="text-xs text-muted-foreground mb-4">Use arrows to arrange steps in the solution order.</p>
                                    <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                                        {currentOrder.map((stepId: string, index: number) => {
                                            const step = currentSteps.find((s) => s.id === stepId);
                                            return (
                                                <div key={stepId} className="flex items-center gap-3 p-3 border rounded-md bg-white shadow-sm">
                                                    <span className="font-bold text-muted-foreground w-6">{index + 1}.</span>
                                                    <span className="flex-1 font-medium">{step?.text || `Step ${stepId}`}</span>
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => moveStepInOrder(index, 'up')}
                                                            disabled={index === 0}
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => moveStepInOrder(index, 'down')}
                                                            disabled={index === currentOrder.length - 1}
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {form.formState.errors.solution && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.solution.message as string}
                                     </p>
                                )}
                                {form.formState.errors.options && (
                                     <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.options.message as string}
                                     </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Explanation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="explanation"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <RichTextEditor 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="Explain why the answer is correct (optional)..."
                                    className="min-h-[100px]"
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">{option.description}</span>
                                            )}
                                        </div>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="points"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Points</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Categorization</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="skill_id"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Skill</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a skill" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {skills?.map((skill) => (
                                            <SelectItem key={skill.skill_id} value={skill.skill_id}>
                                                {skill.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}

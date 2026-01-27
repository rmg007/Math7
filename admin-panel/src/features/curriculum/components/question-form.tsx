/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateQuestion, useUpdateQuestion } from '../hooks/use-questions';
import { useSkills } from '../hooks/use-skills';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Database } from '@/lib/database.types';

type Question = Database['public']['Tables']['questions']['Row'];

// Hardcoded for now based on Schema
const QUESTION_TYPES = ['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps'] as const;

// Zod schema for the form
const questionSchema = z.object({
  skill_id: z.string().uuid(),
  type: z.enum(QUESTION_TYPES),
  content: z.string().min(1, 'Question text is required'),
  // Options: for MCQ, list of specific objects. For others, could be flexible.
  options: z.any(), 
  solution: z.any(),
  explanation: z.string().optional(),
  points: z.coerce.number().min(1),
  is_published: z.boolean().default(false),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: Question;
}

export function QuestionForm({ initialData }: QuestionFormProps) {
  const navigate = useNavigate();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const { data: skills, isLoading: isLoadingSkills } = useSkills();

  // Helper to parse initial JSON data
  const parseOptions = (data: Question | undefined) => {
      if (!data?.options) return { options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] };
      const opts = data.options as any;
      if (opts.options && Array.isArray(opts.options)) return opts;
      return { options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] };
  };

  const parseSolution = (data: Question | undefined) => {
      if (!data?.solution) return '';
      const sol = data.solution as any;
      return sol.correct_option_id || '';
  };

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      skill_id: initialData?.skill_id || '',
      type: initialData?.type || 'multiple_choice',
      content: initialData?.content || '',
      explanation: initialData?.explanation || '',
      points: initialData?.points || 1,
      is_published: initialData?.is_published || false,
      // Internal fields for managing JSON state
      options: parseOptions(initialData), 
      solution: parseSolution(initialData),
    },
  });

  const questionType = form.watch('type');

  // Logic to handle internal state for Options (Simpler to manage outside RHF for JSON structure complexity, 
  // or use FieldArray if we map it to form fields. Let's try FieldArray for options.options)

  // Actually, let's just stick to a simpler "MCQ Builder" approach.
  // We'll store the options array in the form under `options.options`.

  const onSubmit = async (data: QuestionFormData) => {
    try {
      // Transform form data back to expected JSONB structure
      const submissionData = { ...data };

      if (data.type === 'multiple_choice') {
          // Ensure structure
          const opts = data.options as { options: { id: string, text: string}[] };
          const correctId = data.solution as string;
          
          if (!correctId) {
             form.setError('solution', { message: 'Please select a correct answer' });
             return;
          }

          submissionData.options = opts;
          submissionData.solution = { correct_option_id: correctId };
      }

      if (initialData) {
        await updateQuestion.mutateAsync({
           id: initialData.id,
           ...submissionData
        } as any);
      } else {
        await createQuestion.mutateAsync(submissionData as any);
      }
      navigate('/questions');
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const isSubmitting = createQuestion.isPending || updateQuestion.isPending;

  // Custom Field Array for MCQ Options
  // We need to access control for dynamic fields
  // Since `options` is `any`, we need to cast or manage carefully.
  // Let's manually manage the options array in the render for now, updating the form value.
  const currentOptions = (form.watch('options') as any)?.options || [];
  const setOptions = (newOptions: any[]) => {
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

  if (isLoadingSkills) return <Loader2 className="animate-spin" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        
        <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem key={skill.id} value={skill.id}>
                                {skill.title}
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
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What is 2 + 2?" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {questionType === 'multiple_choice' && (
            <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium text-sm">Multiple Choice Options</h3>
                <RadioGroup 
                    onValueChange={(val) => form.setValue('solution', val)} 
                    defaultValue={form.watch('solution') as string}
                >
                    {currentOptions.map((opt: any, index: number) => (
                        <div key={index} className="flex items-center gap-4">
                            <RadioGroupItem value={opt.id} id={opt.id} />
                            <div className="flex-1 flex gap-2">
                                <span className="flex h-10 w-8 items-center justify-center rounded-md border bg-muted text-sm font-medium">
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
                 <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                    <Plus className="mr-2 h-4 w-4" /> Add Option
                </Button>
                {form.formState.errors.solution && (
                     <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.solution.message as string}
                     </p>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
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

             <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 mt-8">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Published
                        </FormLabel>
                    </div>
                    </FormItem>
                )}
            />
        </div>

         <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Markdown support)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Explain why the answer is correct..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/questions')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

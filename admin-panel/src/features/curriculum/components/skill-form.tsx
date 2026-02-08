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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill, useUpdateSkill } from '../hooks/use-skills';
import { useDomains } from '../hooks/use-domains';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Database } from '@/lib/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];

const STATUS_OPTIONS: { value: 'draft' | 'published' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'published', label: 'Published', description: 'Ready for review' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const skillSchema = z.object({
  domain_id: z.string().uuid(),
  slug: z.string()
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores')
    .min(1, 'Slug is required')
    .max(100, 'Slug is too long'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  difficulty_level: z.coerce.number().min(1).max(5),
  sort_order: z.coerce.number().default(0),
  status: z.enum(['draft', 'published', 'live']).default('draft'),
});

type SkillFormData = z.infer<typeof skillSchema>;

interface SkillFormProps {
  initialData?: Skill;
}

export function SkillForm({ initialData }: SkillFormProps) {
  const navigate = useNavigate();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const { data: domains, isLoading: isLoadingDomains } = useDomains();

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      domain_id: initialData?.domain_id || '',
      slug: initialData?.slug || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      difficulty_level: initialData?.difficulty_level || 1,
      sort_order: initialData?.sort_order || 0,
      status: (initialData?.status as 'draft' | 'published' | 'live') || 'draft',
    },
  });

  const onSubmit = async (data: SkillFormData) => {
    try {
      if (initialData) {
        await updateSkill.mutateAsync({
           skill_id: initialData.skill_id,
           ...data
        });
      } else {
        await createSkill.mutateAsync(data);
      }
      navigate('/skills');
    } catch (error) {
      console.error('Failed to save skill:', error);
      // Ideally show a toast here
    }
  };

  const isSubmitting = createSkill.isPending || updateSkill.isPending;

  if (isLoadingDomains) return <Loader2 className="animate-spin" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6 w-full max-w-2xl px-1">
        
        <FormField
          control={form.control}
          name="domain_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-[48px] text-base">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {domains?.map((domain) => (
                        <SelectItem key={domain.domain_id} value={domain.domain_id}>
                            {domain.title}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The domain this skill belongs to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Addition" {...field} className="min-h-[48px] text-base" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. addition" {...field} className="min-h-[48px] text-base" />
                </FormControl>
                <FormDescription>
                    Unique identifier (URL-safe).
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this skill..." 
                  className="resize-none min-h-[100px] text-base" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="difficulty_level"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Difficulty Level (1-5)</FormLabel>
                    <FormControl>
                        <Input type="number" min={1} max={5} {...field} className="min-h-[48px] text-base" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                    <Input type="number" {...field} className="min-h-[48px] text-base" />
                </FormControl>
                <FormDescription>
                    Order in which this appears in lists.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-[48px] text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}{option.description ? ` - ${option.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Controls visibility of this skill.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/skills')} className="w-full sm:w-auto min-h-[48px] px-6">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[48px] px-6">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Skill' : 'Create Skill'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

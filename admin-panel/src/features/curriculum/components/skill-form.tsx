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
import { Checkbox } from '@/components/ui/checkbox';
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
  is_published: z.boolean().default(false),
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
      is_published: initialData?.is_published || false,
    },
  });

  const onSubmit = async (data: SkillFormData) => {
    try {
      if (initialData) {
        await updateSkill.mutateAsync({
           id: initialData.id,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        
        <FormField
          control={form.control}
          name="domain_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {domains?.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
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

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Addition" {...field} />
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
                    <Input placeholder="e.g. addition" {...field} />
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
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="difficulty_level"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Difficulty Level (1-5)</FormLabel>
                    <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
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
                    <Input type="number" {...field} />
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
          name="is_published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                <FormDescription>
                  This skill will be visible to students when checked.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/skills')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Skill' : 'Create Skill'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

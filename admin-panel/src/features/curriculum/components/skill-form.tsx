import { AdminHeader } from '@/components/ui/admin-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@questerix/core/types/database';
import { normalizeFormData } from '@/lib/normalization';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Globe, Layers, ListOrdered, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useDomains } from '../hooks/use-domains';
import { useCheckSkillSlug, useCreateSkill, useUpdateSkill } from '../hooks/use-skills';

type Skill = Database['public']['Tables']['skills']['Row'];

const STATUS_OPTIONS: {
  value: 'draft' | 'published' | 'live';
  label: string;
  description?: string;
}[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'published', label: 'Published', description: 'Ready for review' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const skillSchema = z.object({
  domain_id: z.string().uuid('Please select a valid domain'),
  slug: z
    .string()
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

  const isEditing = Boolean(initialData);
  const { toast } = useToast();
  const { checkSlug } = useCheckSkillSlug();

  const form = useForm<SkillFormData>({
    mode: 'onBlur',
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
    // Normalize text fields: trim whitespace, lowercase the slug
    const normalizedData = normalizeFormData(data, {
      trim: ['title', 'description'],
      lowercase: ['slug'],
    });

    try {
      // Pre-flight check for slug availability
      const isAvailable = await checkSlug(normalizedData.slug, initialData?.skill_id);
      if (!isAvailable) {
        form.setError('slug', {
          type: 'manual',
          message: 'This slug is already in use in this app. Please choose another one.',
        });
        toast({
          title: 'Slug conflict',
          description: 'A skill with this slug already exists. Please use a unique slug.',
          variant: 'destructive',
        });
        return;
      }

      if (initialData) {
        await updateSkill.mutateAsync({
          skill_id: initialData.skill_id,
          ...normalizedData,
        });
        toast({
          title: 'Skill updated',
          description: `Skill "${normalizedData.title}" has been updated successfully.`,
        });
      } else {
        await createSkill.mutateAsync(normalizedData);
        toast({
          title: 'Skill created',
          description: `Skill "${normalizedData.title}" has been created successfully.`,
        });
      }
      navigate('/skills');
    } catch (error: unknown) {
      console.error('Failed to save skill:', error);

      let errorMessage = 'An unexpected error occurred while saving the skill.';

      const supabaseError = error as { code?: string; status?: number };

      // Handle Supabase/Postgres 409 Conflict (Duplicate Key)
      if (supabaseError?.code === '23505' || supabaseError?.status === 409) {
        errorMessage =
          'A skill with this slug already exists in this app. Please use a different slug.';
        form.setError('slug', { type: 'manual', message: errorMessage });
      }

      toast({
        title: 'Error saving skill',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = createSkill.isPending || updateSkill.isPending;

  if (isLoadingDomains) {
    return (
      <div className="flex h-[50vh] justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title={isEditing ? 'Edit Skill' : 'Add Skill'}
        description={isEditing ? 'Edit skill details.' : 'Add a new skill.'}
        icon={Zap}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} data-testid="skill-form" className="space-y-8">
          <fieldset
            disabled={form.formState.isSubmitting}
            className="space-y-8 disabled:opacity-60"
          >
            <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-4 sm:p-8 md:p-10 space-y-8">
                <FormField
                  control={form.control}
                  name="domain_id"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                          Domain
                        </FormLabel>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all border">
                            <SelectValue placeholder="Select a domain context" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                          {domains?.map((domain) => (
                            <SelectItem
                              key={domain.domain_id}
                              value={domain.domain_id}
                              className="py-3 rounded-xl"
                            >
                              <span className="font-bold text-gray-900">{domain.title}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs font-bold text-red-500 italic" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Title
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. Single-Digit Addition"
                            {...field}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all border"
                            required
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="w-4 h-4 text-indigo-500" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Slug
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. addition_basic"
                            {...field}
                            disabled={isEditing}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border disabled:opacity-50"
                            required
                            pattern="[a-z0-9_]+"
                            title="Lowercase letters, numbers, and underscores only"
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField
                    control={form.control}
                    name="difficulty_level"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Difficulty (1-5)
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            {...field}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border text-center"
                            required
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ListOrdered className="w-4 h-4 text-slate-500" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Order
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-slate-500/10 transition-all border text-center"
                            required
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Status
                          </FormLabel>
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              data-testid="status-select"
                              className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all border"
                            >
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="py-3 rounded-xl"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900">{option.label}</span>
                                  {option.description && (
                                    <span className="text-2xs text-gray-400 uppercase tracking-widest">
                                      {option.description}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                          Description
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Detail the core competencies and learning objectives of this skill..."
                          className="min-h-[150px] rounded-[2rem] border-gray-100 bg-white/50 text-base font-medium leading-relaxed focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border p-6"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold text-red-500 italic" />
                    </FormItem>
                  )}
                />

                <FormActions
                  isSubmitting={isSubmitting}
                  submitLabel={isEditing ? 'Update Skill' : 'Create Skill'}
                  submittingLabel="Saving..."
                  onCancel={() => navigate('/skills')}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}

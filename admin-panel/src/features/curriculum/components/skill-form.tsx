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
import { useCreateSkill, useUpdateSkill } from '../hooks/use-skills';
import { useDomains } from '../hooks/use-domains';
import { useNavigate } from 'react-router-dom';
import { Loader2, Zap, Globe, ListOrdered, FileText, ShieldCheck, Layers } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Database } from '@/lib/database.types';
import { Card, CardContent } from '@/components/ui/card';
import { AdminHeader } from '@/components/ui/admin-header';

type Skill = Database['public']['Tables']['skills']['Row'];

const STATUS_OPTIONS: { value: 'draft' | 'published' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'published', label: 'Published', description: 'Ready for review' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const skillSchema = z.object({
  domain_id: z.string().uuid('Please select a valid domain'),
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

  const isEditing = Boolean(initialData);

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
        title={isEditing ? 'Refine Skill' : 'Provision Skill'}
        description={isEditing ? 'Modify the specific attributes and difficulty parameters of this skill.' : 'Anchor a new technical node within the curriculum hierarchy.'}
        icon={Zap}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Skills', href: '/skills' },
          { label: isEditing ? 'Edit' : 'New', href: '#' }
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 md:p-10 space-y-8">
              <FormField
                control={form.control}
                name="domain_id"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Parent Domain</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all border">
                          <SelectValue placeholder="Select a domain context" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                        {domains?.map((domain) => (
                          <SelectItem key={domain.domain_id} value={domain.domain_id} className="py-3 rounded-xl">
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Skill Title</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Single-Digit Addition" 
                          {...field} 
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all border"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Resource identifier</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="e.g. addition_basic" 
                          {...field} 
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Intensity (1-5)</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={5} 
                          {...field} 
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border text-center"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sequence</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-slate-500/10 transition-all border text-center"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Protocol State</FormLabel>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all border">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="py-3 rounded-xl">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{option.label}</span>
                                {option.description && (
                                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">{option.description}</span>
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Instructional Blueprint</FormLabel>
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

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate('/skills')}
                  className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:bg-gray-100/50 transition-all"
                >
                  Terminate
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-14 px-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    isEditing ? 'Commit Update' : 'Anchor Skill'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

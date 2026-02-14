import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/hooks/use-app';
import { zodResolver } from '@hookform/resolvers/zod';
import { Book, FileText, Globe, ListOrdered, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useCreateDomain, useDomains, useUpdateDomain } from '../hooks/use-domains';

const STATUS_OPTIONS: { value: 'draft' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const domainSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'live']).default('draft'),
});

type DomainFormData = z.infer<typeof domainSchema>;

export function DomainForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentApp, isLoading: isAppLoading } = useApp();
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const { data: domains } = useDomains();

  const isEditing = Boolean(id);
  const existingDomain = domains?.find((d) => d.domain_id === id);

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      sort_order: 0,
      status: 'draft',
    },
  });

  // Auto-set sort order for new domains
  useEffect(() => {
    if (!isEditing && domains && domains.length > 0) {
      const maxOrder = domains.reduce((max, d) => Math.max(max, d.sort_order ?? 0), 0);
      const currentSortOrder = form.getValues('sort_order');
      // Only set if it hasn't been manually changed from 0
      if (currentSortOrder === 0) {
        form.setValue('sort_order', maxOrder + 1);
      }
    }
  }, [domains, isEditing, form]);

  useEffect(() => {
    if (existingDomain) {
      form.reset({
        title: existingDomain.title,
        slug: existingDomain.slug,
        description: existingDomain.description || '',
        sort_order: existingDomain.sort_order ?? 0,
        status: (existingDomain.status as 'draft' | 'live') || 'draft',
      });
    }
  }, [existingDomain, form]);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: DomainFormData) => {
    setError(null);
    if (!currentApp?.app_id) {
      const msg =
        'Failed to save domain: No app selected (currentApp is ' + JSON.stringify(currentApp) + ')';
      console.error(msg);
      setError(msg);
      return;
    }

    try {
      if (isEditing && id) {
        await updateDomain.mutateAsync({ domain_id: id, ...data });
      } else {
        await createDomain.mutateAsync(data);
      }
      navigate('/domains');
    } catch (err: unknown) {
      console.error('Failed to save domain:', err);
      let message =
        err instanceof Error ? err.message : 'An unexpected error occurred while saving.';

      // Handle duplicate slug error (Postgres error code 23505)
      if (
        (err && typeof err === 'object' && 'code' in err && err.code === '23505') ||
        (err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof err.message === 'string' &&
          err.message.includes('unique constraint "domains_app_id_slug_key"'))
      ) {
        message =
          'A domain with this slug already exists for this application. Please use a different slug.';
      }

      setError(message);
    }
  };

  const isSubmitting = createDomain.isPending || updateDomain.isPending;

  if (isAppLoading || (isEditing && !existingDomain && domains)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Synchronizing Context...
        </p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <Globe className="w-12 h-12 text-amber-500" />
          <h3 className="text-xl font-bold text-amber-900">No App Selected</h3>
          <p className="text-amber-700">
            Please select an application from the sidebar to manage domains.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader
        title={isEditing ? 'Modify Domain' : 'Create Domain'}
        description={
          isEditing
            ? 'Update the structural parameters of this educational area.'
            : 'Initialize a new high-level educational category.'
        }
        icon={Book}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Domains', href: '/domains' },
          { label: isEditing ? 'Edit' : 'New', href: '#' },
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-1 pt-1">
                <h4 className="text-sm font-bold text-red-900 uppercase tracking-wider">
                  Submission Failed
                </h4>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Display Title
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="e.g. Advanced Mathematics"
                          {...field}
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all border"
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
                        <Globe className="w-4 h-4 text-blue-500" />
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Unique Slug
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="e.g. math_advanced"
                          {...field}
                          disabled={isEditing}
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all border disabled:opacity-50"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] font-medium text-gray-400">
                        Lowercase, numbers, and underscores only.
                      </FormDescription>
                      <FormMessage className="text-xs font-bold text-red-500 italic" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ListOrdered className="w-4 h-4 text-amber-500" />
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Sort Priority
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Protocol Status
                        </FormLabel>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all border">
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
                                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Comprehensive Description
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Define the scope and objectives for this domain..."
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
                  onClick={() => navigate('/domains')}
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
                      {isEditing ? 'Updating Signature...' : 'Initiating Provision...'}
                    </>
                  ) : isEditing ? (
                    'Update Signature'
                  ) : (
                    'Initiate Provision'
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

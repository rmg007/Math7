import { AdminHeader } from '@/components/ui/admin-header';
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
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Book, FileText, Globe, ListOrdered, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  useCheckDomainSlug,
  useCreateDomain,
  useDomain,
  useDomains,
  useUpdateDomain,
} from '../hooks/use-domains';

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
  app_id: z.string().uuid('App selection is required'),
});

type DomainFormData = z.infer<typeof domainSchema>;

export function DomainForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentApp, isLoading: isAppLoading, isSuperAdmin, apps } = useApp();
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const { checkSlug } = useCheckDomainSlug();
  const { toast } = useToast();

  // Use useDomain specific hook for fetching the target domain
  // This allows finding domains across apps for Super Admins
  const {
    data: fetchedDomain,
    isLoading: isDomainLoading,
    error: domainError,
  } = useDomain(id || '');

  // Keep useDomains for NEW domains sort order logic
  const { data: domains } = useDomains();

  const isEditing = Boolean(id);
  const existingDomain = fetchedDomain;

  const form = useForm<DomainFormData>({
    mode: 'onBlur',
    resolver: zodResolver(domainSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      sort_order: 0,
      status: 'draft',
      app_id: currentApp?.app_id || '',
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
        app_id: existingDomain.app_id || currentApp?.app_id || '',
      });
    } else if (currentApp?.app_id) {
      // Should default to current app for new domains
      if (!form.getValues('app_id')) {
        form.setValue('app_id', currentApp.app_id);
      }
    }
  }, [existingDomain, form, currentApp]);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: DomainFormData) => {
    // ... (onSubmit implementation is fine, just need to make sure I don't delete it)
    setError(null);
    const appId = data.app_id || currentApp?.app_id;

    if (!appId) {
      const msg = 'Failed to save domain: No app selected';
      console.error(msg);
      setError(msg);
      return;
    }

    // Normalize text fields: trim whitespace, lowercase the slug
    const normalizedData = {
      ...data,
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description?.trim() || '',
    };

    try {
      // Pre-flight check for slug availability
      const isAvailable = await checkSlug(normalizedData.slug, id);
      if (!isAvailable) {
        form.setError('slug', {
          type: 'manual',
          message: 'This slug is already in use in this app. Please choose another one.',
        });
        toast({
          title: 'Slug conflict',
          description: 'A domain with this slug already exists. Please use a unique slug.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditing && id) {
        await updateDomain.mutateAsync({ domain_id: id, ...normalizedData });
        toast({ title: 'Success', description: 'Domain updated' });
      } else {
        await createDomain.mutateAsync(normalizedData);
        toast({ title: 'Success', description: 'Domain created' });
      }
      navigate('/domains');
    } catch (err: unknown) {
      console.error('Failed to save domain:', err);
      let message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while saving the domain.';

      const supabaseError = err as { code?: string; status?: number };

      // Handle duplicate slug error (Postgres error code 23505 or 409 status)
      if (supabaseError?.code === '23505' || supabaseError?.status === 409) {
        message =
          'A domain with this slug already exists for this application. Please use a different slug.';
        form.setError('slug', { type: 'manual', message: message });
      }

      setError(message);
      toast({
        title: 'Error saving domain',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = createDomain.isPending || updateDomain.isPending;

  const isInitialLoading = isAppLoading || (isEditing && isDomainLoading);

  if (domainError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
        role="alert"
        aria-live="assertive"
      >
        <ShieldCheck className="w-12 h-12 text-red-500" aria-hidden="true" />
        <h3 className="text-xl font-bold text-red-900">Error Loading Domain</h3>
        <p className="text-red-700 max-w-md text-center">{(domainError as Error).message}</p>
        <button
          onClick={() => navigate('/domains')}
          className="px-4 py-2 bg-white border border-red-200 rounded-lg text-red-700 font-bold hover:bg-red-50 transition-colors"
          aria-label="Back to domains list"
        >
          Return to Domains
        </button>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
        role="status"
        aria-busy="true"
      >
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" aria-hidden="true" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Loading Domain...
        </p>
      </div>
    );
  }

  if (!currentApp) {
    return (
      <Card className="bg-amber-50 border-amber-200" role="alert">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <Globe className="w-12 h-12 text-amber-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-amber-900">No App Selected</h3>
          <p className="text-amber-700">
            Please select an application from the sidebar to manage domains.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="main"
      aria-label={isEditing ? 'Modify Domain' : 'Create Domain'}
    >
      <AdminHeader
        title={isEditing ? 'Modify Domain' : 'Create Domain'}
        description={isEditing ? 'Update domain details.' : 'Add a new domain.'}
        icon={Book}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          data-testid="domain-form"
          className="space-y-8"
          aria-label={isEditing ? 'Modify domain form' : 'Create domain form'}
        >
          <fieldset
            disabled={form.formState.isSubmitting}
            className="space-y-8 disabled:opacity-60"
            aria-busy={form.formState.isSubmitting}
          >
            {error && (
              <div
                data-testid="form-error"
                className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4"
                role="alert"
                aria-live="assertive"
              >
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-600" aria-hidden="true" />
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
              <CardContent className="p-4 sm:p-8 md:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="app_id"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Related App
                          </FormLabel>
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={!isSuperAdmin} // Only Super Admins can change app association
                        >
                          <FormControl>
                            <SelectTrigger
                              className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all border"
                              aria-label="Select related application"
                            >
                              <SelectValue placeholder="Select Application" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                            {apps.map((app) => (
                              <SelectItem
                                key={app.app_id}
                                value={app.app_id}
                                className="py-3 rounded-xl font-bold"
                              >
                                {app.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs font-bold text-red-500 italic" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-purple-500" aria-hidden="true" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Title
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. Advanced Mathematics"
                            {...field}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all border"
                            required
                            aria-required="true"
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
                          <Globe className="w-4 h-4 text-blue-500" aria-hidden="true" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Slug
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="e.g. math_advanced"
                            {...field}
                            disabled={isEditing}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all border disabled:opacity-50"
                            required
                            aria-required="true"
                            pattern="[a-z0-9_]+"
                            title="Lowercase letters, numbers, and underscores only"
                          />
                        </FormControl>
                        <FormDescription className="text-2xs font-medium text-gray-400">
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
                          <ListOrdered className="w-4 h-4 text-amber-500" aria-hidden="true" />
                          <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                            Order
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all border"
                            required
                            aria-required="true"
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
                          <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
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
                              aria-label="Select domain status"
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
                        <FileText className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                        <FormLabel className="text-2xs font-black uppercase tracking-extra-wide text-gray-400">
                          Description
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

                <FormActions
                  isSubmitting={isSubmitting}
                  submitLabel={isEditing ? 'Update Domain' : 'Create Domain'}
                  submittingLabel={isEditing ? 'Updating...' : 'Creating...'}
                  onCancel={() => navigate('/domains')}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}

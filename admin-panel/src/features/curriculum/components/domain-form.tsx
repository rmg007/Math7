import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Book, Globe, ListOrdered, FileText, ShieldCheck } from 'lucide-react'
import { useCreateDomain, useUpdateDomain, useDomains } from '../hooks/use-domains'
import { AdminHeader } from '@/components/ui/admin-header'

const STATUS_OPTIONS: { value: 'draft' | 'live'; label: string; description?: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Not visible to students' },
  { value: 'live', label: 'Live', description: 'Visible to students' },
];

const domainSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  status: z.enum(['draft', 'live']).default('draft'),
})

type DomainFormData = z.infer<typeof domainSchema>

export function DomainForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const createDomain = useCreateDomain()
  const updateDomain = useUpdateDomain()
  const { data: domains } = useDomains()
  
  const isEditing = Boolean(id)
  const existingDomain = domains?.find(d => d.domain_id === id)

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      sort_order: 0,
      status: 'draft',
    }
  })

  // Auto-set sort order for new domains
  useEffect(() => {
    if (!isEditing && domains) {
      const maxOrder = domains.reduce((max, d) => Math.max(max, d.sort_order ?? 0), 0)
      form.reset({
        title: '',
        slug: '',
        description: '',
        sort_order: maxOrder + 1,
        status: 'draft',
      })
    }
  }, [domains, isEditing, form])

  useEffect(() => {
    if (existingDomain) {
      form.reset({
        title: existingDomain.title,
        slug: existingDomain.slug,
        description: existingDomain.description || '',
        sort_order: existingDomain.sort_order ?? 0,
        status: (existingDomain.status as 'draft' | 'live') || 'draft',
      })
    }
  }, [existingDomain, form])

  const onSubmit = async (data: DomainFormData) => {
    try {
      if (isEditing && id) {
        await updateDomain.mutateAsync({ domain_id: id, ...data })
      } else {
        await createDomain.mutateAsync(data)
      }
      navigate('/domains')
    } catch (error) {
      console.error('Failed to save domain', error)
    }
  }

  const isSubmitting = createDomain.isPending || updateDomain.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader 
        title={isEditing ? 'Modify Domain' : 'Create Domain'}
        description={isEditing ? 'Update the structural parameters of this educational area.' : 'Initialize a new high-level educational category.'}
        icon={Book}
        breadcrumbs={[
          { label: 'Curriculum', href: '/domains' },
          { label: 'Domains', href: '/domains' },
          { label: isEditing ? 'Edit' : 'New', href: '#' }
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Display Title</FormLabel>
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Unique Slug</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="e.g. math_advanced" 
                          {...field} 
                          disabled={isEditing}
                          className="h-14 rounded-2xl border-gray-100 bg-white/50 text-lg font-bold tracking-tight focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all border disabled:opacity-50"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] font-medium text-gray-400">Lowercase, numbers, and underscores only.</FormDescription>
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sort Priority</FormLabel>
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Protocol Status</FormLabel>
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Comprehensive Description</FormLabel>
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
                      Executing...
                    </>
                  ) : (
                    isEditing ? 'Update Signature' : 'Initiate Provision'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCreateDomain, useUpdateDomain, useDomains } from '../hooks/use-domains' 

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
  sort_order: z.number().int().default(0),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      sort_order: 0,
      status: 'draft',
    }
  })

  useEffect(() => {
    if (existingDomain) {
      reset({
        title: existingDomain.title,
        slug: existingDomain.slug,
        description: existingDomain.description || '',
        sort_order: existingDomain.sort_order ?? 0,
        status: (existingDomain.status as 'draft' | 'live') || 'draft',
      })
    }
  }, [existingDomain, reset])

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

  return (
    <div className="w-full max-w-2xl space-y-4 md:space-y-6 px-1">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isEditing ? 'Edit Domain' : 'New Domain'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5 rounded-lg border p-4 md:p-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <input
            id="title"
            {...register('title')}
            className="flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            placeholder="e.g. Mathematics"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">Slug</label>
          <input
            id="slug"
            {...register('slug')}
            className="flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background focus:ring-2 focus:ring-purple-200 focus:border-purple-500 disabled:opacity-50"
            placeholder="e.g. basic_math"
            disabled={isEditing} 
          />
          {errors.slug && (
            <p className="text-sm text-red-500">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-2">
            <label htmlFor="sort_order" className="text-sm font-medium">Sort Order</label>
            <input
                id="sort_order"
                type="number"
                {...register('sort_order', { valueAsNumber: true })}
                className="flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            />
            {errors.sort_order && (
                <p className="text-sm text-red-500">{errors.sort_order.message}</p>
            )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <textarea
            id="description"
            {...register('description')}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select
            id="status"
            {...register('status')}
            className="flex min-h-[48px] w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}{option.description ? ` - ${option.description}` : ''}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/domains')}
            className="w-full sm:w-auto min-h-[48px] px-6"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[48px] px-6">
            {isEditing ? 'Update Domain' : 'Create Domain'}
          </Button>
        </div>
      </form>
    </div>
  )
}

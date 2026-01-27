import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCreateDomain, useDomains } from '../hooks/use-domains' 

// We can extend this as needed, simplified for MVP
const domainSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
})

type DomainFormData = z.infer<typeof domainSchema>

export function DomainForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const createDomain = useCreateDomain()
  const { data: domains } = useDomains()
  
  // If editing, find the existing domain
  const isEditing = !!id
  const existingDomain = domains?.find(d => d.id === id)

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
      sort_order: 0
    }
  })

  // Reset form when editing data loads
  useEffect(() => {
    if (existingDomain) {
      reset({
        title: existingDomain.title,
        slug: existingDomain.slug,
        description: existingDomain.description || '',
        sort_order: existingDomain.sort_order
      })
    }
  }, [existingDomain, reset])

  const onSubmit = async (data: DomainFormData) => {
    try {
      if (isEditing) {
        // We'll add update capability later, for now MVP focus on create or mock update
        // await updateDomain.mutateAsync({ id, ...data })
        console.log('Update not implemented yet', data)
      } else {
        await createDomain.mutateAsync(data)
      }
      navigate('/domains')
    } catch (error) {
      console.error('Failed to save domain', error)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Edit Domain' : 'New Domain'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border p-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <input
            id="title"
            {...register('title')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/domains')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? 'Update Domain' : 'Create Domain'}
          </Button>
        </div>
      </form>
    </div>
  )
}

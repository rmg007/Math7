import { Link } from 'react-router-dom'
import { Plus, Edit } from 'lucide-react'
import { useDomains } from '../hooks/use-domains'
import { Button } from '@/components/ui/button'

export function DomainList() {
  const { data: domains, isLoading, error } = useDomains()

  if (isLoading) return <div>Loading domains...</div>
  if (error) return <div className="text-red-500">Error loading domains</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Domains</h2>
        <Button asChild>
          <Link to="/domains/new">
            <Plus className="mr-2 h-4 w-4" />
            New Domain
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="h-12 px-4 font-medium">Sort Order</th>
              <th className="h-12 px-4 font-medium">Title</th>
              <th className="h-12 px-4 font-medium">Slug</th>
              <th className="h-12 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {domains?.map((domain) => (
              <tr key={domain.id} className="border-t hover:bg-muted/50">
                <td className="p-4">{domain.sort_order}</td>
                <td className="p-4 font-medium">{domain.title}</td>
                <td className="p-4 text-muted-foreground">{domain.slug}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/domains/${domain.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {domains?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No domains found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

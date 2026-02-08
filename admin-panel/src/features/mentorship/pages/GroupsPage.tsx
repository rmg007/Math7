import { useGroups } from '../hooks/use-groups'
import { Plus, Users, Copy, Check, School, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'


interface Group {
  id: string
  name: string
  type: 'class' | 'family'
  join_code: string
}

export function GroupsPage() {
  const { data: groups, isLoading } = useGroups()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) return <div className="p-8 text-slate-500">Loading groups...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Groups</h1>
           <p className="text-slate-600 text-lg">Manage your classes and family learning groups.</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 shadow-lg shadow-purple-500/25 border-0">
          <Link to="/groups/new">
            <Plus className="mr-2 h-5 w-5" />
            Create New Group
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups?.map((group: Group) => (
          <div key={group.id} className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="p-6 relative">
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        "p-3 rounded-xl shadow-sm",
                        group.type === 'class' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                        {group.type === 'class' ? <School className="h-6 w-6" /> : <Home className="h-6 w-6" />}
                    </div>
                    <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                        group.type === 'class' 
                            ? "bg-blue-50 text-blue-600 border-blue-200" 
                            : "bg-purple-50 text-purple-600 border-purple-200"
                    )}>
                        {group.type}
                    </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1" title={group.name}>{group.name}</h3>
                
                <div className="mt-6 p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between pl-4 pr-1 py-1">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Join Code</span>
                        <span className="text-lg font-mono font-bold text-purple-600 tracking-widest leading-none pb-1">{group.join_code}</span>
                    </div>
                     <button 
                        onClick={(e) => {
                            e.preventDefault();
                            copyCode(group.join_code, group.id);
                        }}
                        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-700 active:scale-95"
                        title="Copy Join Code"
                     >
                        {copiedId === group.id ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                     </button>
                </div>
            </div>
            
             <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-purple-50/50 transition-colors">
                <span className="text-xs text-slate-500">0 Students</span>
                <Link to={`/groups/${group.id}`} className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
                    Manage Group &rarr;
                </Link>
            </div>
          </div>
        ))}
      </div>
      
      {groups?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No groups created yet</h3>
              <p className="text-slate-600 max-w-md mx-auto mb-8 text-lg">
                  Get started by creating your first class or family group to assign tasks, track progress, and mentor students.
              </p>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link to="/groups/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                </Link>
              </Button>
          </div>
      )}
    </div>
  )
}

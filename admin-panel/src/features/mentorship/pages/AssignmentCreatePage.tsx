import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Target, Clock, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useApp } from '@/hooks/use-app'

// Types
type AssignmentType = 'skill_mastery' | 'time_goal' | 'custom'
type AssignmentScope = 'mandatory' | 'suggested'

interface Skill {
  id: string
  title: string
  domain_id: string
  domains: {
    title: string
  } | null
}

export function AssignmentCreatePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentApp } = useApp()

  // Form State
  const [type, setType] = useState<AssignmentType>('skill_mastery')
  const [targetId, setTargetId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [scope, setScope] = useState<AssignmentScope>('mandatory')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch Group Details
  const { data: group } = useQuery({
    queryKey: ['group', groupId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected')
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId!)
        .eq('app_id', currentApp.app_id)
        .single()
      if (error) throw error
      return data
    },
    enabled: Boolean(groupId) && Boolean(currentApp?.app_id)
  })

  // Fetch Skills for Selection
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ['skills-search', searchTerm, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected')

      let query = supabase
        .from('skills')
        .select('id, title, domain_id, domains(title)')
        .eq('app_id', currentApp.app_id)
        .limit(20)
      
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any as Skill[]
    },
    enabled: type === 'skill_mastery' && Boolean(currentApp?.app_id)
  })

  // Create Assignment Mutation
  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!groupId || !targetId || !currentApp?.app_id) throw new Error('Missing required fields')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase.from('assignments').insert({
        group_id: groupId,
        target_id: targetId,
        type,
        scope,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'pending'
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', groupId] })
      toast({
        title: 'Assignment Created',
        description: 'The assignment has been added to the group.'
      })
      navigate(`/groups/${groupId}`)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  if (!group) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/groups/${groupId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Assignment</h1>
          <p className="text-slate-500">Assign work to {group.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-8 shadow-sm">
        
        {/* Assignment Type Selection */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Assignment Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setType('skill_mastery')}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                type === 'skill_mastery' 
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" 
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="p-2 bg-blue-100 w-fit rounded-lg mb-3 text-blue-600">
                <Target className="h-5 w-5" />
              </div>
              <div className="font-semibold text-slate-900">Skill Mastery</div>
              <div className="text-sm text-slate-500 mt-1">Complete specific skills</div>
            </button>

            <button
              onClick={() => setType('time_goal')}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                type === 'time_goal' 
                  ? "border-purple-500 bg-purple-50/50 ring-1 ring-purple-500" 
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="p-2 bg-purple-100 w-fit rounded-lg mb-3 text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="font-semibold text-slate-900">Time Goal</div>
              <div className="text-sm text-slate-500 mt-1">Practice for X minutes</div>
            </button>

            <button
              disabled
              className="p-4 rounded-xl border-2 border-slate-100 text-left opacity-50 cursor-not-allowed"
            >
              <div className="p-2 bg-slate-100 w-fit rounded-lg mb-3 text-slate-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="font-semibold text-slate-400">Custom Task</div>
              <div className="text-sm text-slate-400 mt-1">Coming soon</div>
            </button>
          </div>
        </div>

        {/* Dynamic Content Selection */}
        {type === 'skill_mastery' && (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Select Skill</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search skills..."
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                {skills?.map((skill: Skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setTargetId(skill.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between",
                      targetId === skill.id && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div>
                      <div className="font-medium">{skill.title}</div>
                      <div className="text-xs text-slate-500">{skill.domains?.title}</div>
                    </div>
                    {targetId === skill.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Due Date & Scope */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Due Date (Optional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Scope</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['mandatory', 'suggested'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all",
                    scope === s ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate(`/groups/${groupId}`)}>Cancel</Button>
          <Button 
            onClick={() => createAssignment.mutate()}
            disabled={!targetId || createAssignment.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createAssignment.isPending ? 'Assigning...' : 'Create Assignment'}
          </Button>
        </div>

      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AdminHeader } from '@/components/ui/admin-header'
import { Target, Clock, CheckCircle, Activity, ShieldCheck, Loader2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useApp } from '@/hooks/use-app'

// Types
type AssignmentType = 'skill_mastery' | 'time_goal' | 'custom'
type AssignmentScope = 'mandatory' | 'suggested'

interface Skill {
  id: string
  skill_id?: string
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
      if (!currentApp?.app_id || !groupId) throw new Error('Missing app or group context')
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
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
        .select('skill_id, title, domain_id, domains(title)')
        .eq('app_id', currentApp.app_id)
        .limit(20)
      
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // The database uses skill_id but our UI expects id
      return (data as (Skill & { skill_id: string })[]).map(s => ({
        ...s,
        id: s.skill_id
      }))
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

  if (!group) return (
    <div className="max-w-3xl mx-auto p-12 flex flex-col items-center justify-center animate-pulse">
      <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Awaiting Group Synchronization...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-10 space-y-10 animate-in fade-in duration-700">
      <AdminHeader 
        title="Initialize Assignment"
        description={`Scale group performance by provisioning targeted work for ${group.name}.`}
        icon={Target}
        breadcrumbs={[
          { label: 'Mentorship', href: '/groups' },
          { label: group.name, href: `/groups/${groupId}` },
          { label: 'New Assignment', href: `/groups/${groupId}/assignments/new` }
        ]}
      />

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-10 shadow-sm hover:shadow-xl transition-all duration-500 space-y-12">
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Protocol Type Selection</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setType('skill_mastery')}
              className={cn(
                "p-6 rounded-[1.5rem] border-2 text-left transition-all group relative overflow-hidden",
                type === 'skill_mastery' 
                  ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-600/5 ring-4 ring-indigo-500/10" 
                  : "border-gray-100 bg-white/50 hover:border-gray-200 hover:bg-white"
              )}
            >
              <div className={cn("p-2.5 w-fit rounded-xl mb-4 transition-transform group-hover:scale-110", type === 'skill_mastery' ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600")}>
                <Target className="h-5 w-5" />
              </div>
              <div className="font-black text-gray-900 uppercase italic tracking-tight text-sm">Skill Mastery</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Complete objectives</div>
            </button>

            <button
              onClick={() => setType('time_goal')}
              className={cn(
                "p-6 rounded-[1.5rem] border-2 text-left transition-all group relative overflow-hidden",
                type === 'time_goal' 
                  ? "border-purple-600 bg-purple-50/50 shadow-lg shadow-purple-600/5 ring-4 ring-purple-500/10" 
                  : "border-gray-100 bg-white/50 hover:border-gray-200 hover:bg-white"
              )}
            >
              <div className={cn("p-2.5 w-fit rounded-xl mb-4 transition-transform group-hover:scale-110", type === 'time_goal' ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600")}>
                <Clock className="h-5 w-5" />
              </div>
              <div className="font-black text-gray-900 uppercase italic tracking-tight text-sm">Time Goal</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Practice session duration</div>
            </button>

            <button
              disabled
              className="p-6 rounded-[1.5rem] border-2 border-dashed border-gray-100 text-left opacity-30 cursor-not-allowed bg-gray-50/30"
            >
              <div className="p-2.5 bg-gray-100 w-fit rounded-xl mb-4 text-gray-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="font-black text-gray-400 uppercase italic tracking-tight text-sm">Custom Task</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Under development</div>
            </button>
          </div>
        </div>

        {type === 'skill_mastery' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Objective Matrix</label>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Query skill catalog..."
                className="w-full h-14 px-6 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold italic"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-[1.5rem] divide-y divide-gray-50 bg-white/30 backdrop-blur-sm custom-scrollbar">
                {skills?.map((skill: Skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setTargetId(skill.id)}
                    className={cn(
                      "w-full px-6 py-4 text-left hover:bg-indigo-50/50 transition-colors flex items-center justify-between group/row",
                      targetId === skill.id && "bg-indigo-50/80 text-indigo-700"
                    )}
                  >
                    <div>
                      <div className="font-black text-gray-900 text-base italic tracking-tight">{skill.title}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{skill.domains?.title}</div>
                    </div>
                    {targetId === skill.id ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white scale-110 shadow-lg shadow-indigo-500/20 transition-transform">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-gray-100 opacity-0 group-hover/row:opacity-100 transition-opacity"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Deadline Marker</label>
            </div>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="date"
                className="w-full h-14 pl-12 pr-6 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
              </div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Protocol Scope</label>
            </div>
            <div className="flex bg-gray-100/50 backdrop-blur-sm border border-gray-100 p-1.5 rounded-2xl">
              {(['mandatory', 'suggested'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                    scope === s 
                      ? "bg-white shadow-lg text-gray-900 scale-[1.02] ring-1 ring-gray-100" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100/50">
           <div className="flex items-center gap-3 px-6 py-3 bg-gray-50/50 rounded-2xl border border-gray-100">
             <div className={cn("w-2.5 h-2.5 rounded-full", targetId ? "bg-emerald-500 animate-pulse" : "bg-gray-300")}></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ready for initialization</span>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
             <Button 
                variant="ghost" 
                onClick={() => navigate(`/groups/${groupId}`)}
                className="flex-1 md:flex-none rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 h-14 px-8"
              >
                Abort Protocol
              </Button>
             <Button 
              onClick={() => createAssignment.mutate()}
              disabled={!targetId || createAssignment.isPending}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-14 shadow-xl shadow-indigo-600/20 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 transition-all"
            >
              {createAssignment.isPending ? 'Executing...' : 'Authorize Assignment'}
            </Button>
           </div>
        </div>

      </div>
    </div>
  )
}

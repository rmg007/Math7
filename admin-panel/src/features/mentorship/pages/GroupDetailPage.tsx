import { useParams, Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Users, School, Home, Trash2, Edit3, UserPlus, Copy, Check, ClipboardList, CheckCircle, Circle, Clock, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminHeader } from '@/components/ui/admin-header'

interface Assignment {
  id: string
  type: string
  scope: string | null
  due_date: string | null
  status: string | null
  target_id: string
}

interface Member {
  group_id: string
  user_id: string | null
  nickname: string | null
  joined_at: string | null
  is_anonymous: boolean | null
  profiles: {
    id: string
    email: string
    full_name: string | null
  } | null
}

interface Skill {
  skill_id: string
  title: string
}

interface ProgressEntry {
  user_id: string
  skill_id: string
  mastery_level: number | null
}

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [copiedCode, setCopiedCode] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editNickname, setEditNickname] = useState('')

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      if (!id) throw new Error('Group ID is required')
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: Boolean(id)
  })

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['group-members', id],
    queryFn: async () => {
      if (!id) throw new Error('Group ID is required')
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          )
        `)
        .eq('group_id', id)
        .order('joined_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: Boolean(id)
  })

  // Update member nickname mutation
  const updateNicknameMutation = useMutation({
    mutationFn: async ({ memberId, nickname }: { memberId: string; nickname: string }) => {
      if (!id) throw new Error('Group ID is required')
      const { error } = await supabase
        .from('group_members')
        .update({ nickname })
        .eq('group_id', id)
        .eq('user_id', memberId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] })
      setEditingMemberId(null)
      setEditNickname('')
      toast({
        title: 'Success',
        description: 'Nickname updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update nickname',
        variant: 'destructive'
      })
    }
  })

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', id],
    queryFn: async () => {
      if (!id) throw new Error('Group ID is required')
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: Boolean(id)
  })

  // Fetch skill details for assignments
  const assignmentSkillIds = assignments
    ?.filter((a: Assignment) => a.type === 'skill_mastery')
    .map((a: Assignment) => a.target_id) || []

  const { data: assignmentSkills } = useQuery({
    queryKey: ['skills-details', assignmentSkillIds],
    queryFn: async () => {
      if (assignmentSkillIds.length === 0) return []
      const { data, error } = await supabase
        .from('skills')
        .select('skill_id, title')
        .in('skill_id', assignmentSkillIds)
      if (error) throw error
      return data
    },
    enabled: assignmentSkillIds.length > 0
  })

  // Fetch progress for members
  const memberIds = members?.map((m: Member) => m.user_id).filter((id): id is string => id !== null) || []
  const { data: progress } = useQuery({
    queryKey: ['group-progress', id, memberIds],
    queryFn: async () => {
      if (memberIds.length === 0 || assignmentSkillIds.length === 0) return []
      const { data, error } = await supabase
        .from('skill_progress')
        .select('*')
        .in('user_id', memberIds)
        .in('skill_id', assignmentSkillIds)
      if (error) throw error
      return data
    },
    enabled: Boolean(id) && memberIds.length > 0 && assignmentSkillIds.length > 0
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!id) throw new Error('Group ID is required')
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', memberId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] })
      toast({
        title: 'Success',
        description: 'Member removed from group',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive'
      })
    }
  })

  const copyJoinCode = () => {
    if (group?.join_code) {
      navigator.clipboard.writeText(group.join_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Join code copied to clipboard',
      })
    }
  }

  const handleSaveNickname = (memberId: string) => {
    if (editNickname.trim()) {
      updateNicknameMutation.mutate({ memberId, nickname: editNickname.trim() })
    }
  }

  const startEditingNickname = (memberId: string, currentNickname: string) => {
    setEditingMemberId(memberId)
    setEditNickname(currentNickname || '')
  }

  const cancelEditing = () => {
    setEditingMemberId(null)
    setEditNickname('')
  }

  if (groupLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-2xl w-2/3"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
          <div className="h-32 bg-gray-100 rounded-2xl"></div>
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Group not found</h1>
        <p className="text-gray-500 mb-8 font-medium">The group you're looking for doesn't exist or has been deleted.</p>
        <Link to="/groups">
          <Button variant="outline" className="rounded-xl px-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </Link>
      </div>
    )
  }

  const getStatus = (memberId: string, skillId: string) => {
    const entry = progress?.find((p: ProgressEntry) => p.user_id === memberId && p.skill_id === skillId)
    // Assuming entry.mastery_score is 0-100.
    if (!entry || entry.mastery_level === null) return 'not_started'
    if (entry.mastery_level >= 100) return 'mastered'
    return 'in_progress'
  }

  const getSkillTitle = (skillId: string) => assignmentSkills?.find((s: Skill) => s.skill_id === skillId)?.title || 'Skill'

  const memberCount = members?.length || 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHeader 
        title={group.name}
        description="Manage members, assignments, and group settings"
        icon={group.type === 'class' ? School : Home}
        breadcrumbs={[
          { label: 'Mentorship', href: '/groups' },
          { label: 'Groups', href: '/groups' },
          { label: group.name, href: `/groups/${id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] uppercase font-black px-3 py-1 rounded-full border tracking-widest",
              group.type === 'class'
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : "bg-purple-500/10 text-purple-600 border-purple-500/20"
            )}>
              {group.type}
            </span>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-100/50 backdrop-blur-md p-1 rounded-2xl border border-white/20">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
            <ClipboardList className="w-4 h-4 mr-2" /> Progress Matrix
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">Members</span>
              </div>
              <div className="text-4xl font-black text-gray-900 tracking-tight">{memberCount}</div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/10">
                    <Copy className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">Join Code</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex-1">
                  <code className="text-indigo-600 font-mono text-xl font-black tracking-widest block text-center">
                    {group.join_code}
                  </code>
                </div>
                <Button
                  onClick={() => copyJoinCode()}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl text-indigo-600 hover:bg-white hover:shadow-sm"
                >
                  {copiedCode ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
               <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">Public Join</span>
              </div>
              <div className={cn(
                "text-2xl font-black tracking-tight",
                group.allow_anonymous_join ? "text-emerald-600" : "text-gray-300"
              )}>
                {group.allow_anonymous_join ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-gray-900 tracking-tight text-lg">Members</h3>
                   <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Enrollment roster</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-9"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>

              {membersLoading ? (
                <div className="p-8 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : members && members.length > 0 ? (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {members.map((member: Member) => {
                    const displayName = member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous User'
                    const isAnonymous = !member.user_id || !member.profiles?.email
                    const isEditing = editingMemberId === member.user_id

                    return (
                      <div 
                        key={member.user_id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-indigo-500/20 shadow-lg">
                            {displayName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editNickname}
                                  onChange={(e) => setEditNickname(e.target.value)}
                                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full max-w-[200px]"
                                  placeholder="Enter nickname"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && member.user_id) handleSaveNickname(member.user_id)
                                    if (e.key === 'Escape') cancelEditing()
                                  }}
                                  autoFocus
                                />
                                <Button 
                                  size="sm" 
                                  className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                                  onClick={() => member.user_id && handleSaveNickname(member.user_id)}
                                  disabled={updateNicknameMutation.isPending || !member.user_id}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{displayName}</h3>
                                  {isAnonymous && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-black uppercase tracking-widest">
                                      Anon
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                   {member.profiles?.email && (
                                    <p className="text-[11px] text-gray-400 font-semibold">{member.profiles.email}</p>
                                  )}
                                  <span className="text-[11px] text-gray-300">•</span>
                                  <p className="text-[11px] text-gray-400 font-semibold">
                                     {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Active'}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => member.user_id && startEditingNickname(member.user_id, member.nickname || '')}
                              className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                member.user_id && removeMemberMutation.mutate(member.user_id)
                              }}
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Squad Empty</h3>
                  <p className="text-xs text-gray-500 font-medium mb-6">
                    Connect students using code <span className="font-black text-indigo-600 font-mono tracking-widest">{group.join_code}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 tracking-tight text-lg">Curriculum</h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Active assignments</p>
                </div>
                <Link to={`/groups/${id}/assignments/new`}>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-9"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create
                  </Button>
                </Link>
              </div>

              {assignmentsLoading ? (
                <div className="p-8 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : assignments && assignments.length > 0 ? (
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {assignments.map((assignment: Assignment) => (
                    <div key={assignment.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2.5 rounded-xl border",
                          assignment.type === 'skill_mastery' 
                            ? "bg-blue-500/10 border-blue-500/10 text-blue-600" 
                            : "bg-purple-500/10 border-purple-500/10 text-purple-600"
                        )}>
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight capitalize">{assignment.type.replace('_', ' ')}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                               {assignment.scope}
                            </span>
                            {assignment.due_date && (
                               <div className="flex items-center gap-1">
                                 <span className="text-[10px] text-gray-300">•</span>
                                 <Clock className="w-3 h-3 text-gray-300" />
                                 <span className="text-[11px] text-gray-400 font-semibold">{new Date(assignment.due_date).toLocaleDateString()}</span>
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border",
                        assignment.status === 'pending' 
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        {assignment.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-6 w-6 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">No Active Tasks</h3>
                  <p className="text-xs text-gray-500 font-medium">Create assignments to start monitoring mastery loops.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="outline-none">
           <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-bold text-gray-900 text-lg tracking-tight">Assignment Matrix</h2>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Mastery tracking engine</p>
              </div>
              
              {!members || members.length === 0 ? (
                 <div className="p-16 text-center text-gray-400 font-medium">No students enrolled.</div>
              ) : !assignmentSkillIds || assignmentSkillIds.length === 0 ? (
                 <div className="p-16 text-center text-gray-400 font-medium">No curricula tracked in this matrix.</div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b-2 border-gray-100">
                        <TableHead className="w-[200px] font-bold text-[10px] uppercase tracking-widest text-gray-400 pl-6 h-12">Student</TableHead>
                        {assignmentSkillIds.map((skillId: string) => (
                          <TableHead key={skillId} className="text-center min-w-[140px] font-bold text-[10px] uppercase tracking-widest text-gray-400 h-12">
                            {getSkillTitle(skillId)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member: Member) => (
                        <TableRow key={member.user_id || `${member.group_id}-anon`} className="hover:bg-gray-50/30 transition-colors">
                          <TableCell className="font-bold text-gray-700 pl-6 py-4 text-sm whitespace-nowrap">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                                 {(member.nickname || member.profiles?.full_name || 'A').charAt(0)}
                               </div>
                               {member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous'}
                             </div>
                          </TableCell>
                          {assignmentSkillIds.map((skillId: string) => {
                             const status = member.user_id ? getStatus(member.user_id, skillId) : 'not_started'
                             return (
                               <TableCell key={skillId} className="text-center py-4">
                                 {status === 'mastered' ? (
                                   <div className="flex justify-center">
                                      <div className="p-1 bg-emerald-500/10 rounded-lg">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                      </div>
                                   </div>
                                 ) : status === 'in_progress' ? (
                                   <div className="flex justify-center">
                                     <div className="p-1 bg-amber-500/10 rounded-lg">
                                       <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="flex justify-center">
                                     <Circle className="h-4 w-4 text-gray-100" />
                                   </div>
                                 )}
                               </TableCell>
                             )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
           </div>
        </TabsContent>

        <TabsContent value="settings" className="outline-none">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-16 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-6">
               <Settings className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Advanced Engine Tuning</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">Modify group parameters, synchronization protocols, and archival state. This interface is currently under development.</p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" className="rounded-xl px-8 border-gray-200 text-gray-400 grayscale" disabled>Manage Meta</Button>
              <Button variant="outline" className="rounded-xl px-8 border-red-100 text-red-300 hover:text-red-600 hover:bg-red-50 hover:border-red-200" disabled>Archive Group</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

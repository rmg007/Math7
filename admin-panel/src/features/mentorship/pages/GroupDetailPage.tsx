import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Users, School, Home, Trash2, Edit3, UserPlus, Copy, Check, ClipboardList, CheckCircle, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  user_id: string
  nickname: string | null
  joined_at: string
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

  // Remove member mutation


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
  const memberIds = members?.map((m: Member) => m.user_id) || []
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
    return <div className="p-8 text-slate-500">Loading group...</div>
  }

  if (!group) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Group not found</h1>
        <Link to="/groups">
          <Button variant="outline">← Back to Groups</Button>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link to="/groups">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-lg",
              group.type === 'class' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
            )}>
              {group.type === 'class' ? <School className="h-5 w-5" /> : <Home className="h-5 w-5" />}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{group.name}</h1>
            <span className={cn(
              "text-xs uppercase font-bold px-3 py-1 rounded-full border",
              group.type === 'class'
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-purple-50 text-purple-600 border-purple-200"
            )}>
              {group.type}
            </span>
          </div>
          <p className="text-slate-500">Manage members, assignments, and group settings</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Progress Matrix</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Member Count Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-purple-200 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Members</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{memberCount}</div>
            </div>

            {/* Join Code Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Join Code</span>
                <button
                  onClick={copyJoinCode}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600"
                  title="Copy Join Code"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-2xl font-mono font-bold text-purple-600 tracking-widest">
                {group.join_code}
              </div>
            </div>

            {/* Anonymous Join Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-purple-200 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Anonymous Join</span>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                group.allow_anonymous_join ? "text-green-600" : "text-slate-400"
              )}>
                {group.allow_anonymous_join ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Group Members</h2>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            {membersLoading ? (
              <div className="text-slate-400 py-8 text-center">Loading members...</div>
            ) : members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member: Member) => {
                  const displayName = member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous User'
                  const isAnonymous = !member.user_id || !member.profiles?.email
                  const isEditing = editingMemberId === member.user_id

                  return (
                    <div 
                      key={member.user_id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </div>

                        {/* Member Info */}
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="Enter nickname"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && member.user_id) handleSaveNickname(member.user_id)
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => member.user_id && handleSaveNickname(member.user_id)}
                                disabled={updateNicknameMutation.isPending || !member.user_id}
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900">{displayName}</h3>
                                {isAnonymous && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                    Anonymous
                                  </span>
                                )}
                              </div>
                              {member.profiles?.email && (
                                <p className="text-sm text-slate-500">{member.profiles.email}</p>
                              )}
                              <p className="text-xs text-slate-400">
                                Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => member.user_id && startEditingNickname(member.user_id, member.nickname || '')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this member?') && member.user_id) {
                                removeMemberMutation.mutate(member.user_id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No members yet</h3>
                <p className="text-slate-500 mb-6">
                  Share the join code <span className="font-mono font-bold text-purple-600">{group.join_code}</span> to add members
                </p>
              </div>
            )}
          </div>

          {/* Assignments Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
              <Link to={`/groups/${id}/assignments/new`}>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </Link>
            </div>

            
            {assignmentsLoading ? (
              <div className="text-slate-400 py-8 text-center">Loading assignments...</div>
            ) : assignments && assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment: Assignment) => (
                  <div key={assignment.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        assignment.type === 'skill_mastery' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                      )}>
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 capitalize">{assignment.type.replace('_', ' ')}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <span className="capitalize px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-xs">{assignment.scope}</span>
                          {assignment.due_date && (
                             <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                      assignment.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200"
                    )}>
                      {assignment.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No assignments yet</h3>
                <p className="text-slate-500">Create assignments to track student progress on specific skills or domains.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress">
           <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Assignment Progress</h2>
                <p className="text-sm text-slate-500">Track student mastery across assigned skills</p>
              </div>
              
              {!members || members.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">No members to track.</div>
              ) : !assignmentSkillIds || assignmentSkillIds.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">No skill assignments created yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[200px]">Student</TableHead>
                        {assignmentSkillIds.map((skillId: string) => (
                          <TableHead key={skillId} className="text-center min-w-[120px]">
                            {getSkillTitle(skillId)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member: Member) => (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-medium">
                             {member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous'}
                          </TableCell>
                          {assignmentSkillIds.map((skillId: string) => {
                             const status = member.user_id ? getStatus(member.user_id, skillId) : 'not_started'
                             return (
                               <TableCell key={skillId} className="text-center">
                                 {status === 'mastered' ? (
                                   <div className="flex justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div>
                                 ) : status === 'in_progress' ? (
                                   <div className="flex justify-center"><Clock className="h-5 w-5 text-amber-500" /></div>
                                 ) : (
                                   <div className="flex justify-center"><Circle className="h-5 w-5 text-slate-200" /></div>
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

        <TabsContent value="settings">
          <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Group Settings</h3>
            <p className="mb-4">Advanced configuration coming soon.</p>
            <Button variant="outline" disabled>Archive Group</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

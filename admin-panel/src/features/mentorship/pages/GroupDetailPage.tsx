import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { castJson } from '@/lib/type-utils';
import { cn, isValidUUID } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Check,
    CheckCircle,
    Circle,
    ClipboardList,
    Clock,
    Copy,
    Edit3,
    Home,
    Layers,
    LayoutDashboard,
    Plus,
    School,
    Settings,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface Assignment {
  id: string;
  completion_trigger?: unknown;
  created_at: string;
  due_date: string | null;
  group_id: string | null;
  scope: 'mandatory' | 'suggested' | null;
  status: 'pending' | 'completed' | 'late' | null;
  student_id: string | null;
  target_id: string;
  type: 'skill_mastery' | 'time_goal' | 'custom';
  updated_at: string;
}

interface Member {
  group_id: string;
  is_anonymous: boolean | null;
  joined_at: string;
  nickname: string | null;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

const MemberRow = memo(
  ({
    member,
    onEdit,
    onRemove,
    isEditing,
    editNickname,
    onNicknameChange,
    onSave,
    onCancel,
    isPending,
  }: {
    member: Member;
    onEdit: (id: string, nickname: string) => void;
    onRemove: (id: string) => void;
    isEditing: boolean;
    editNickname: string;
    onNicknameChange: (val: string) => void;
    onSave: (id: string) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => {
    const displayName =
      member.nickname || member.profiles?.full_name || member.profiles?.email || 'Anonymous User';
    const isAnonymous = !member.user_id || !member.profiles?.email;

    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all group">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-900 text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 w-full max-w-[200px]"
                  placeholder="Enter nickname"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && member.user_id) onSave(member.user_id);
                    if (e.key === 'Escape') onCancel();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 rounded-lg font-bold text-2xs uppercase tracking-widest"
                  onClick={() => member.user_id && onSave(member.user_id)}
                  disabled={isPending || !member.user_id}
                >
                  Save
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{displayName}</h3>
                  {isAnonymous && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold uppercase">
                      Anon
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {member.profiles?.email && (
                    <p className="text-xs text-gray-400 font-semibold">{member.profiles.email}</p>
                  )}
                  <span className="text-xs text-gray-300">•</span>
                  <p className="text-xs text-gray-400 font-semibold">
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Active'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => member.user_id && onEdit(member.user_id, member.nickname || '')}
              className="h-7 w-7 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => member.user_id && onRemove(member.user_id)}
              className="h-7 w-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);

const AssignmentRow = memo(({ assignment }: { assignment: Assignment }) => {
  return (
    <div
      key={assignment.id}
      className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-2.5 rounded-xl border',
            assignment.type === 'skill_mastery'
              ? 'bg-blue-500/10 border-blue-500/10 text-blue-600'
              : 'bg-purple-500/10 border-purple-500/10 text-purple-600'
          )}
        >
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight capitalize">
            {assignment.type.replace('_', ' ')}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {assignment.scope}
            </span>
            {assignment.due_date && (
              <div className="flex items-center gap-1">
                <span className="text-2xs text-gray-300">•</span>
                <Clock className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-400 font-semibold">
                  {new Date(assignment.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'px-3 py-1 rounded-full text-2xs font-black uppercase tracking-[0.1em] border',
          assignment.status === 'pending'
            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        )}
      >
        {assignment.status}
      </div>
    </div>
  );
});

const ProgressCell = memo(({ status }: { status: string }) => {
  return (
    <TableCell className="text-center py-4">
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
  );
});

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const navigate = useNavigate();

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const markName = 'GroupDetail:fetchGroup';
      performance.mark(`${markName}:start`);
      if (!id) throw new Error('Group ID is required');
      if (!isValidUUID(id)) throw new Error(`Invalid group ID format: ${id}`);
      const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return data;
    },
    enabled: Boolean(id) && isValidUUID(id ?? ''),
  });

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['group-members', id],
    queryFn: async () => {
      const markName = 'GroupDetail:fetchMembers';
      performance.mark(`${markName}:start`);
      if (!id) throw new Error('Group ID is required');
      if (!isValidUUID(id)) throw new Error(`Invalid group ID format: ${id}`);
      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          *,
          profiles (
            id,
            email,
            full_name
          )
        `
        )
        .eq('group_id', id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return castJson<Member[]>(data || []);
    },
    enabled: Boolean(id),
  });

  // Update member nickname mutation
  const updateNicknameMutation = useMutation({
    mutationFn: async ({ memberId, nickname }: { memberId: string; nickname: string }) => {
      if (!id) throw new Error('Group ID is required');
      if (!isValidUUID(id)) throw new Error(`Invalid group ID format: ${id}`);
      const { error } = await supabase
        .from('group_members')
        .update({ nickname } as { nickname: string })
        .eq('group_id', id)
        .eq('user_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] });
      setEditingMemberId(null);
      setEditNickname('');
      toast({
        title: 'Success',
        description: 'Nickname updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update nickname',
        variant: 'destructive',
      });
    },
  });

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', id],
    queryFn: async () => {
      const markName = 'GroupDetail:fetchAssignments';
      performance.mark(`${markName}:start`);
      if (!id) throw new Error('Group ID is required');
      if (!isValidUUID(id)) throw new Error(`Invalid group ID format: ${id}`);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      // Supabase select returns generic type
      return castJson<Assignment[]>(data || []);
    },
    enabled: Boolean(id),
  });

  // Fetch skill details for assignments
  const assignmentSkillIds =
    assignments
      ?.filter((a: Assignment) => a.type === 'skill_mastery' && a.target_id)
      .map((a: Assignment) => a.target_id as string) || [];

  const { data: assignmentSkills } = useQuery({
    queryKey: ['skills-details', assignmentSkillIds],
    queryFn: async () => {
      const markName = 'GroupDetail:fetchAssignmentSkills';
      performance.mark(`${markName}:start`);
      if (assignmentSkillIds.length === 0) return [];
      const { data, error } = await supabase
        .from('skills')
        .select('skill_id, title')
        // The database uses skill_id but our UI expects id
        .in('skill_id', assignmentSkillIds);
      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return data;
    },
    enabled: assignmentSkillIds.length > 0,
  });

  // Fetch progress for members
  const memberIds =
    members?.map((m: Member) => m.user_id).filter((id): id is string => id !== null) || [];
  const { data: progress } = useQuery({
    queryKey: ['group-progress', id, memberIds],
    queryFn: async () => {
      if (memberIds.length === 0 || assignmentSkillIds.length === 0) return [];
      const { data, error } = await supabase
        .from('skill_progress')
        .select('*')
        .in('user_id', memberIds)
        .in('skill_id', assignmentSkillIds);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id) && memberIds.length > 0 && assignmentSkillIds.length > 0,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!id) throw new Error('Group ID is required');
      if (!isValidUUID(id)) throw new Error(`Invalid group ID format: ${id}`);
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] });
      toast({
        title: 'Success',
        description: 'Member removed from group',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  const copyJoinCode = useCallback(() => {
    if (group?.join_code) {
      navigator.clipboard.writeText(group.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Join code copied to clipboard',
      });
    }
  }, [group?.join_code, toast]);

  const handleSaveNickname = useCallback(
    (memberId: string) => {
      if (editNickname.trim()) {
        updateNicknameMutation.mutate({ memberId, nickname: editNickname.trim() });
      }
    },
    [editNickname, updateNicknameMutation]
  );

  const startEditingNickname = useCallback((memberId: string, currentNickname: string) => {
    setEditingMemberId(memberId);
    setEditNickname(currentNickname || '');
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingMemberId(null);
    setEditNickname('');
  }, []);

  const getStatus = useCallback(
    (memberId: string, skillId: string) => {
      if (!progress) return 'not_started';
      const entry = progress.find((p) => p.user_id === memberId && p.skill_id === skillId);
      if (!entry || entry.mastery_level === null) return 'not_started';
      if (entry.mastery_level >= 100) return 'mastered';
      return 'in_progress';
    },
    [progress]
  );

  const getSkillTitle = useCallback(
    (skillId: string) => {
      const skill = assignmentSkills?.find((s) => s.skill_id === skillId);
      return skill?.title || 'Skill';
    },
    [assignmentSkills]
  );

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
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Group not found</h1>
        <p className="text-gray-500 mb-8 font-medium">
          The group you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/groups">
          <Button variant="outline" className="rounded-xl px-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  const memberCount = members?.length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 p-4 md:p-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-indigo-600 hover:bg-indigo-50 -ml-2 font-black text-[10px] uppercase tracking-widest gap-2"
        >
          <Link to="/groups">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
        </Button>
        <AdminHeader
          title={group.name}
          description="Integrated oversight of cluster operations and pedagogical progress"
          icon={group.type === 'class' ? School : Home}
          actions={
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-[10px] uppercase font-black px-4 py-1.5 rounded-full border tracking-widest shadow-sm',
                  group.type === 'class'
                    ? 'bg-blue-50/50 text-blue-600 border-blue-200'
                    : 'bg-purple-50/50 text-purple-600 border-purple-200'
                )}
              >
                {group.type}
              </span>
            </div>
          }
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-indigo-50/50 shadow-sm inline-flex">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/20 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/20 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <ClipboardList className="w-4 h-4 mr-2" /> Matrix
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/20 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Cohort Size
                  </span>
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tight">
                  {memberCount}
                </p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  Active Members
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Activation Code
                  </span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                    <Copy className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <code className="text-2xl font-mono font-black text-indigo-600 tracking-extra-wide">
                    {group.join_code}
                  </code>
                  <Button
                    onClick={() => copyJoinCode()}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    {copiedCode ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  Security Authorization
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 group hover:border-indigo-100/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Anonymous Entry
                  </span>
                  <div
                    className={cn(
                      'p-2 rounded-xl',
                      group.allow_anonymous_join
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <p
                  className={cn(
                    'text-lg font-black uppercase tracking-tight',
                    group.allow_anonymous_join ? 'text-emerald-600' : 'text-gray-400'
                  )}
                >
                  {group.allow_anonymous_join ? 'ACTIVE PROTOCOL' : 'RESTRICTED'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  Access Policy
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-indigo-50/50 flex items-center justify-between bg-white/30">
                  <div>
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Members
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      Enrolled Students
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="p-8 space-y-4">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="divide-y divide-gray-100/50 max-h-[500px] overflow-y-auto">
                    {members.map((member: Member) => (
                      <MemberRow
                        key={member.user_id}
                        member={member}
                        onEdit={startEditingNickname}
                        onRemove={removeMemberMutation.mutate}
                        isEditing={editingMemberId === member.user_id}
                        editNickname={editNickname}
                        onNicknameChange={setEditNickname}
                        onSave={handleSaveNickname}
                        onCancel={cancelEditing}
                        isPending={updateNicknameMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="Squad Empty"
                    description={`Connect students using code ${group.join_code}`}
                    className="py-20"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-indigo-50/50 flex items-center justify-between bg-white/30">
                  <div>
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Assignments
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      Active Tasks
                    </p>
                  </div>
                  <Link to={`/groups/${id}/assignments/new`}>
                    <Button
                      size="sm"
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                      <Plus className="h-4 w-4" /> New Task
                    </Button>
                  </Link>
                </div>

                {assignmentsLoading ? (
                  <div className="p-8 space-y-4">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                  </div>
                ) : assignments && assignments.length > 0 ? (
                  <div className="divide-y divide-gray-100/50 max-h-[500px] overflow-y-auto">
                    {assignments.map((assignment: Assignment) => (
                      <AssignmentRow key={assignment.id} assignment={assignment} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardList}
                    title="No Active Tasks"
                    description="No assignments yet."
                    className="py-20"
                    action={
                      <Button
                        onClick={() => navigate(`/groups/${id}/assignments/new`)}
                        className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                      >
                        Initialize Task
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="outline-none">
          <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-indigo-50/50 bg-white/30">
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Progress Matrix
                </h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  Mastery Tracking Intelligence
                </p>
              </div>

              {!members || members.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    No Students Registered
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    Registry is currently empty
                  </p>
                </div>
              ) : !assignmentSkillIds || assignmentSkillIds.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="Matrix Not Initialized"
                  description="No skills assigned yet."
                  className="py-24"
                />
              ) : (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-indigo-50/20 hover:bg-indigo-50/20 border-b border-indigo-50">
                        <TableHead className="w-[240px] font-black text-[10px] uppercase tracking-widest text-indigo-900/60 pl-8 h-16">
                          Student Identity
                        </TableHead>
                        {assignmentSkillIds.map((skillId: string) => (
                          <TableHead
                            key={skillId}
                            className="text-center min-w-[160px] font-black text-[10px] uppercase tracking-widest text-indigo-900/60 h-16"
                          >
                            {getSkillTitle(skillId)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member: Member) => (
                        <TableRow
                          key={member.user_id || `${member.group_id}-anon`}
                          className="hover:bg-indigo-50/10 transition-colors border-b border-indigo-50/30"
                        >
                          <TableCell className="pl-8 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-400 shadow-sm">
                                {(member.nickname || member.profiles?.full_name || 'A')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-gray-900 tabular-nums">
                                  {member.nickname || member.profiles?.full_name || 'Anonymous'}
                                </p>
                                {member.profiles?.email && (
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {member.profiles.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {assignmentSkillIds.map((skillId: string) => {
                            return (
                              <ProgressCell
                                key={skillId}
                                status={
                                  member.user_id
                                    ? getStatus(member.user_id, skillId)
                                    : 'not_started'
                                }
                              />
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="outline-none">
          <Card className="glass-card border-0 shadow-2xl shadow-indigo-500/5 overflow-hidden">
            <CardContent className="p-20 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-indigo-500/5">
                <Settings className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">
                Configuration Core
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto">
                Advanced squad orchestration and data lifecycle management modules are in
                development.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest border-indigo-100 text-indigo-400 opacity-50 cursor-not-allowed"
                >
                  Edit Registry
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest border-red-100 text-red-300 hover:text-red-400 hover:bg-red-50 transition-all font-bold"
                  disabled
                >
                  DECOMMISSION UNIT
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { AdminHeader } from '@/components/ui/admin-header';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Calendar, CheckCircle, Clock, Loader2, ShieldCheck, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Types
type AssignmentType = 'skill_mastery' | 'time_goal' | 'custom';
type AssignmentScope = 'mandatory' | 'suggested';

interface Skill {
  id: string;
  skill_id?: string;
  title: string;
  domain_id: string;
  domains: {
    title: string;
  } | null;
}

export function AssignmentCreatePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin, setCurrentApp, apps, isLoading: isAppLoading } = useApp();

  // Form State
  const [type, setType] = useState<AssignmentType>('skill_mastery');
  const [targetId, setTargetId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scope, setScope] = useState<AssignmentScope>('mandatory');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Group Details
  const { data: group } = useQuery({
    queryKey: ['group', groupId, currentApp?.app_id, isSuperAdmin],
    queryFn: async () => {
      if (!groupId) throw new Error('Missing group ID');
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('Missing app context');

      let query = supabase.from('groups').select('*').eq('id', groupId);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(groupId) && (isSuperAdmin || Boolean(currentApp?.app_id)),
  });

  // Context Switching
  const isContextSwitching = group && currentApp && group.app_id !== currentApp.app_id;

  useEffect(() => {
    if (isContextSwitching) {
      const targetApp = apps.find(a => a.app_id === group.app_id);
      if (targetApp) {
        console.log(`[AssignmentCreatePage] Switching context from ${currentApp?.display_name} to ${targetApp.display_name}`);
        setCurrentApp(targetApp);
      }
    }
  }, [group, currentApp, apps, setCurrentApp, isContextSwitching]);


  // Fetch Skills for Selection
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ['skills-search', searchTerm, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        .select('skill_id, title, domain_id, domains(title)')
        .eq('app_id', currentApp.app_id)
        .limit(20);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // The database uses skill_id but our UI expects id
      return (data as (Skill & { skill_id: string })[]).map((s) => ({
        ...s,
        id: s.skill_id,
      }));
    },
    enabled: type === 'skill_mastery' && Boolean(currentApp?.app_id),
  });

  // Create Assignment Mutation
  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!groupId || !targetId || !currentApp?.app_id) throw new Error('Missing required fields');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('assignments').insert({
        group_id: groupId,
        target_id: targetId,
        type,
        scope,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', groupId] });
      toast({
        title: 'Assignment Created',
        description: 'The assignment has been added to the group.',
      });
      navigate(`/groups/${groupId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!group || isAppLoading || isContextSwitching)
    return (
      <div className="max-w-3xl mx-auto p-12 flex flex-col items-center justify-center animate-pulse">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-2xs font-black text-gray-400 uppercase tracking-widest text-center">
          {isContextSwitching ? 'Switching App Context...' : 'Awaiting Group Synchronization...'}
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in duration-700">
      <AdminHeader
        title="Initialize Assignment"
        description={`Configure execution protocol for ${group.name}`}
        icon={Target}
      />

      <div className="glass-card border-0 shadow-2xl shadow-indigo-500/5 p-12 space-y-16 overflow-hidden relative">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                Protocol Selection
              </label>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Select objective type</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button
              onClick={() => setType('skill_mastery')}
              className={cn(
                'p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden flex flex-col items-center text-center',
                type === 'skill_mastery'
                  ? 'border-indigo-200 bg-indigo-50/50 shadow-xl shadow-indigo-500/10 ring-8 ring-indigo-500/5 translate-y-[-4px]'
                  : 'border-gray-100 bg-white/50 hover:border-indigo-100 hover:bg-white hover:shadow-lg'
              )}
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500 shadow-sm',
                  type === 'skill_mastery'
                    ? 'bg-indigo-600 text-white rotate-12 scale-110 shadow-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-400 group-hover:rotate-6'
                )}
              >
                <Target className="h-7 w-7" />
              </div>
              <div className="font-black text-gray-900 uppercase tracking-tight text-sm mb-1">
                Skill Mastery
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[120px]">
                Targeted Objective Success
              </div>
            </button>

            <button
              onClick={() => setType('time_goal')}
              className={cn(
                'p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden flex flex-col items-center text-center',
                type === 'time_goal'
                  ? 'border-purple-200 bg-purple-50/50 shadow-xl shadow-purple-500/10 ring-8 ring-purple-500/5 translate-y-[-4px]'
                  : 'border-gray-100 bg-white/50 hover:border-purple-100 hover:bg-white hover:shadow-lg'
              )}
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500 shadow-sm',
                  type === 'time_goal'
                    ? 'bg-purple-600 text-white -rotate-12 scale-110 shadow-purple-500/30'
                    : 'bg-purple-50 text-purple-400 group-hover:-rotate-6'
                )}
              >
                <Clock className="h-7 w-7" />
              </div>
              <div className="font-black text-gray-900 uppercase tracking-tight text-sm mb-1">
                Time Goal
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[120px]">
                Duration Based Logistics
              </div>
            </button>

            <button
              disabled
              className="p-8 rounded-[2.5rem] border border-dashed border-gray-100/50 text-center opacity-40 cursor-not-allowed bg-gray-50/20 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-100/50 rounded-2xl mb-6 flex items-center justify-center text-gray-300">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div className="font-black text-gray-400 uppercase tracking-tight text-sm mb-1">
                Custom Task
              </div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[120px]">
                Protocol Pending Development
              </div>
            </button>
          </div>
        </div>

        {type === 'skill_mastery' && (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">
                  Objective Matrix
                </label>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Connect specific skill criteria</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative group/search">
                <Target className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Query skill catalog..."
                  className="w-full h-16 pl-16 pr-8 rounded-[1.5rem] border border-gray-100 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none font-bold text-lg placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-[320px] overflow-y-auto border border-indigo-50/50 rounded-[2rem] divide-y divide-gray-100/50 bg-white/30 backdrop-blur-sm custom-scrollbar shadow-inner shadow-indigo-500/5">
                {skills?.map((skill: Skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setTargetId(skill.id)}
                    className={cn(
                      'w-full px-8 py-5 text-left transition-all flex items-center justify-between group/row',
                      targetId === skill.id 
                        ? 'bg-indigo-600/90 text-white shadow-lg' 
                        : 'hover:bg-indigo-50/50 text-gray-600'
                    )}
                  >
                    <div className="space-y-1">
                      <div className={cn(
                        "font-black text-base uppercase tracking-tight italic",
                        targetId === skill.id ? "text-white" : "text-gray-900"
                      )}>
                        {skill.title}
                      </div>
                      <div className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        targetId === skill.id ? "text-indigo-100" : "text-gray-400"
                      )}>
                        {skill.domains?.title}
                      </div>
                    </div>
                    {targetId === skill.id ? (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white scale-110 shadow-lg transition-transform border border-white/30">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl border border-gray-100 group-hover/row:border-indigo-200 group-hover/row:bg-white group-hover/row:shadow-sm transition-all"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-indigo-50/50">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1.25rem] bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
                  Deadline Marker
                </label>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Protocol expiration date</p>
              </div>
            </div>
            <div className="relative group">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="date"
                className="w-full h-16 pl-16 pr-8 rounded-[1.5rem] border border-gray-100 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none font-black text-lg text-gray-900"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Deadline date"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[1.25rem] bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100/50">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                  Protocol Scope
                </label>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Enforcement priority level</p>
              </div>
            </div>
            <div className="flex bg-indigo-50/50 backdrop-blur-md border border-indigo-100/30 p-2 rounded-[1.5rem] shadow-inner shadow-indigo-500/5">
              {(['mandatory', 'suggested'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={cn(
                    'flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500',
                    scope === s
                      ? 'bg-white shadow-xl text-gray-900 scale-[1.02] ring-1 ring-black/5'
                      : 'text-gray-400 hover:text-indigo-600 hover:bg-white/40'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-indigo-50/50">
          <div className="flex items-center gap-4 px-8 py-4 bg-indigo-50/30 rounded-[1.5rem] border border-indigo-100/50 shadow-inner">
            <div
              className={cn(
                'w-3 h-3 rounded-full shadow-inner transition-all duration-500',
                targetId ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 'bg-gray-200'
              )}
            ></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {targetId ? 'Ready for Execution' : 'Awaiting Objectives'}
            </span>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={() => navigate(`/groups/${groupId}`)}
              className="flex-1 md:flex-none rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 h-16 px-10 hover:bg-red-50 hover:text-red-400 transition-all"
            >
              Abort Protocol
            </Button>
            <Button
              onClick={() => createAssignment.mutate()}
              disabled={!targetId || createAssignment.isPending}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] px-16 h-16 shadow-2xl shadow-indigo-600/30 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {createAssignment.isPending ? 'Executing...' : 'Authorize Protocol'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

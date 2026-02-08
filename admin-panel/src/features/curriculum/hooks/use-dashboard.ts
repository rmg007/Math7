import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';

type CurriculumMeta = Database['public']['Tables']['curriculum_meta']['Row'];

interface DashboardStats {
  totalDomains: number;
  totalSkills: number;
  totalQuestions: number;
  liveDomains: number;
  liveSkills: number;
  liveQuestions: number;
  publishedDomains: number;
  publishedSkills: number;
  publishedQuestions: number;
  draftDomains: number;
  draftSkills: number;
  draftQuestions: number;
  currentVersion: number;
  lastPublishedAt: string | null;
  readyToPublish: number;
}

interface RecentActivity {
  id: string;
  type: 'domain' | 'skill' | 'question';
  title: string;
  action: 'created' | 'updated';
  timestamp: string;
}

export function useDashboardStats() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['dashboard-stats', currentApp?.app_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const [
        domainsResult,
        liveDomainsResult,
        publishedDomainsResult,
        draftDomainsResult,
        skillsResult,
        liveSkillsResult,
        publishedSkillsResult,
        draftSkillsResult,
        questionsResult,
        liveQuestionsResult,
        publishedQuestionsResult,
        draftQuestionsResult,
        metaResult,
      ] = await Promise.all([
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null),
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'published'),
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'published'),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'published'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        // Meta is per-app? Or global? Ideally per-app. For now assuming singleton is global, but lets verify.
        // If meta is global, we can't really version per app easily without changing schema.
        // Current schema for curriculum_meta likely assumes one curriculum. 
        // For now, let's just keep using the singleton as is, but acknowledged as a limitation.
        supabase.from('curriculum_meta').select('version, last_published_at').eq('id', 'singleton').single(),
      ]);

      if (domainsResult.error) throw domainsResult.error;
      if (skillsResult.error) throw skillsResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const publishedCount = (publishedDomainsResult.count ?? 0) + (publishedSkillsResult.count ?? 0) + (publishedQuestionsResult.count ?? 0);
      
      return {
        totalDomains: domainsResult.count ?? 0,
        totalSkills: skillsResult.count ?? 0,
        totalQuestions: questionsResult.count ?? 0,
        liveDomains: liveDomainsResult.count ?? 0,
        liveSkills: liveSkillsResult.count ?? 0,
        liveQuestions: liveQuestionsResult.count ?? 0,
        publishedDomains: publishedDomainsResult.count ?? 0,
        publishedSkills: publishedSkillsResult.count ?? 0,
        publishedQuestions: publishedQuestionsResult.count ?? 0,
        draftDomains: draftDomainsResult.count ?? 0,
        draftSkills: draftSkillsResult.count ?? 0,
        draftQuestions: draftQuestionsResult.count ?? 0,
        currentVersion: (metaResult.data as CurriculumMeta | null)?.version ?? 0,
        lastPublishedAt: (metaResult.data as CurriculumMeta | null)?.last_published_at ?? null,
        readyToPublish: publishedCount,
      };
    },
    enabled: Boolean(currentApp?.app_id),
    refetchInterval: 60000,
  });
}

export function useRecentActivity() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['recent-activity', currentApp?.app_id],
    queryFn: async (): Promise<RecentActivity[]> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const [domainsResult, skillsResult, questionsResult] = await Promise.all([
        supabase
          .from('domains')
          .select('domain_id, title, created_at, updated_at')
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(4),
        supabase
          .from('skills')
          .select('skill_id, title, created_at, updated_at')
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(4),
        supabase
          .from('questions')
          .select('question_id, content, created_at, updated_at')
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(4),
      ]);

      if (domainsResult.error) throw domainsResult.error;
      if (skillsResult.error) throw skillsResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const activities: RecentActivity[] = [];

      (domainsResult.data)?.forEach((d) => {
        const isNew = d.created_at === d.updated_at;
        activities.push({
          id: d.domain_id,
          type: 'domain',
          title: d.title,
          action: isNew ? 'created' : 'updated',
          timestamp: d.updated_at,
        });
      });

      (skillsResult.data)?.forEach((s) => {
        const isNew = s.created_at === s.updated_at;
        activities.push({
          id: s.skill_id,
          type: 'skill',
          title: s.title,
          action: isNew ? 'created' : 'updated',
          timestamp: s.updated_at,
        });
      });

      (questionsResult.data)?.forEach((q) => {
        const isNew = q.created_at === q.updated_at;
        activities.push({
          id: q.question_id,
          type: 'question',
          title: q.content.substring(0, 50) + (q.content.length > 50 ? '...' : ''),
          action: isNew ? 'created' : 'updated',
          timestamp: q.updated_at,
        });
      });

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: Boolean(currentApp?.app_id),
    refetchInterval: 30000,
  });
}

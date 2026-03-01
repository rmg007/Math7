import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

import { castJson } from '@/lib/type-utils';

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

export function useDashboardStats() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['dashboard-stats', currentApp?.app_id],
    queryFn: async (): Promise<DashboardStats> => {
      const markName = 'useDashboardStats';
      performance.mark(`${markName}:start`);
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
        supabase
          .from('domains')
          .select('domain_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null),
        supabase
          .from('domains')
          .select('domain_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'live'),
        supabase
          .from('domains')
          .select('domain_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'published'),
        supabase
          .from('domains')
          .select('domain_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'draft'),
        supabase
          .from('skills')
          .select('skill_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null),
        supabase
          .from('skills')
          .select('skill_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'live'),
        supabase
          .from('skills')
          .select('skill_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'published'),
        supabase
          .from('skills')
          .select('skill_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'draft'),
        supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null),
        supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'live'),
        supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'published'),
        supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true })
          .eq('app_id', currentApp.app_id)
          .is('deleted_at', null)
          .eq('status', 'draft'),
        // Meta is per-app? Or global? Ideally per-app. For now assuming singleton is global, but lets verify.
        // If meta is global, we can't really version per app easily without changing schema.
        // Current schema for curriculum_meta likely assumes one curriculum.
        // For now, let's just keep using the singleton as is, but acknowledged as a limitation.
        supabase
          .from('curriculum_meta')
          .select('version, last_published_at')
          .eq('app_id', currentApp.app_id)
          .maybeSingle(),
      ]);

      if (domainsResult.error) throw domainsResult.error;
      if (skillsResult.error) throw skillsResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const publishedCount =
        (publishedDomainsResult.count ?? 0) +
        (publishedSkillsResult.count ?? 0) +
        (publishedQuestionsResult.count ?? 0);

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

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
        currentVersion: castJson<CurriculumMeta | null>(metaResult.data)?.version ?? 0,
        lastPublishedAt:
          castJson<CurriculumMeta | null>(metaResult.data)?.last_published_at ?? null,
        readyToPublish: publishedCount,
      };
    },
    enabled: Boolean(currentApp?.app_id),
    refetchInterval: 60000,
  });
}

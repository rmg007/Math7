 
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/hooks/use-app';

interface CurriculumMeta {
  version: number;
  last_published_at: string | null;
}

interface PublishStats {
  draftDomains: number;
  liveDomains: number;
  draftSkills: number;
  liveSkills: number;
  draftQuestions: number;
  liveQuestions: number;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

interface PublishPreview {
  meta: CurriculumMeta;
  stats: PublishStats;
  validationIssues: ValidationIssue[];
  canPublish: boolean;
  readyToPublishCount: number;
}

export function useCurriculumMeta() {
  const { currentApp } = useApp();
  
  // FIX M3: Query by app_id, not singleton
  return useQuery({
    queryKey: ['curriculum-meta', currentApp?.app_id],
    queryFn: async (): Promise<CurriculumMeta> => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      
      const { data, error } = await supabase
        .from('curriculum_meta')
        .select('version, last_published_at')
        .eq('app_id', currentApp.app_id)  // FIX: Tenant-scoped
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching curriculum meta:', error.message || error);
        throw error;
      }
      return data as CurriculumMeta ?? { version: 0, last_published_at: null };
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function usePaginatedPublishHistory(params: {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['publish-history-paginated', params, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { page, pageSize, sortBy = 'version', sortOrder = 'desc' } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('curriculum_snapshots')
        .select('version, published_at, domains_count, skills_count, questions_count', { count: 'exact' })
        .eq('app_id', currentApp.app_id)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function usePublishPreview() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['publish-preview', currentApp?.app_id],
    queryFn: async (): Promise<PublishPreview> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const validationIssues: ValidationIssue[] = [];

      // FIX M3: Separate meta query (tenant-scoped) from content counts
      const [
        metaResult,
        draftDomainsResult,
        liveDomainsResult,
        draftSkillsResult,
        liveSkillsResult,
        draftQuestionsResult,
        liveQuestionsResult,
      ] = await Promise.all([
        supabase.from('curriculum_meta').select('version, last_published_at').eq('app_id', currentApp.app_id).maybeSingle(),
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        supabase.from('domains').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        supabase.from('skills').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'draft'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('app_id', currentApp.app_id).is('deleted_at', null).eq('status', 'live'),
      ]);

      if (metaResult.error && metaResult.error.code !== 'PGRST116') {
        console.warn('Error fetching curriculum meta preview:', metaResult.error.message || metaResult.error);
        throw metaResult.error;
      }

      const stats: PublishStats = {
        draftDomains: draftDomainsResult.count ?? 0,
        liveDomains: liveDomainsResult.count ?? 0,
        draftSkills: draftSkillsResult.count ?? 0,
        liveSkills: liveSkillsResult.count ?? 0,
        draftQuestions: draftQuestionsResult.count ?? 0,
        liveQuestions: liveQuestionsResult.count ?? 0,
      };

      const liveCount = stats.liveDomains + stats.liveSkills + stats.liveQuestions;
      const draftCount = stats.draftDomains + stats.draftSkills + stats.draftQuestions;

      if (liveCount === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No content is currently live. Mark content as "Live" to make it visible to students.',
        });
      }

      if (draftCount > 0) {
        validationIssues.push({
          type: 'warning',
          message: `${draftCount} item(s) are in draft status and not visible to students.`,
        });
      }

      return {
        meta: metaResult.data as CurriculumMeta,
        stats,
        validationIssues,
        canPublish: liveCount > 0,
        readyToPublishCount: liveCount,
      };
    },
    enabled: Boolean(currentApp?.app_id),
    refetchInterval: 30000,
  });
}

export function usePublishCurriculum() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();
  
  return useMutation({
    mutationFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      
      // FIX M4: Pass app_id to RPC
      // Note: Type cast needed until database.types.ts is regenerated
      const { data, error } = await supabase.rpc('publish_curriculum', {
        p_app_id: currentApp.app_id
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-meta'] });
      queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

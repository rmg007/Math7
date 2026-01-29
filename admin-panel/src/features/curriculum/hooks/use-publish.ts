/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CurriculumMeta {
  version: number;
  last_published_at: string | null;
}

interface PublishStats {
  publishedDomains: number;
  unpublishedDomains: number;
  publishedSkills: number;
  unpublishedSkills: number;
  publishedQuestions: number;
  unpublishedQuestions: number;
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
}

export function useCurriculumMeta() {
  return useQuery({
    queryKey: ['curriculum-meta'],
    queryFn: async (): Promise<CurriculumMeta> => {
      const { data, error } = await supabase
        .from('curriculum_meta')
        .select('version, last_published_at')
        .eq('id', 'singleton')
        .single();
      
      if (error) throw error;
      return data as CurriculumMeta;
    },
  });
}

export function usePublishPreview() {
  return useQuery({
    queryKey: ['publish-preview'],
    queryFn: async (): Promise<PublishPreview> => {
      const validationIssues: ValidationIssue[] = [];

      const [
        metaResult,
        publishedDomainsResult,
        unpublishedDomainsResult,
        publishedSkillsResult,
        unpublishedSkillsResult,
        publishedQuestionsResult,
        unpublishedQuestionsResult,
      ] = await Promise.all([
        supabase.from('curriculum_meta').select('version, last_published_at').eq('id', 'singleton').single(),
        supabase.from('domains').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', true),
        supabase.from('domains').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', false),
        supabase.from('skills').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', true),
        supabase.from('skills').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', false),
        supabase.from('questions').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', true),
        supabase.from('questions').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_published', false),
      ]);

      if (metaResult.error) throw metaResult.error;
      if (publishedDomainsResult.error) throw publishedDomainsResult.error;
      if (unpublishedDomainsResult.error) throw unpublishedDomainsResult.error;
      if (publishedSkillsResult.error) throw publishedSkillsResult.error;
      if (unpublishedSkillsResult.error) throw unpublishedSkillsResult.error;
      if (publishedQuestionsResult.error) throw publishedQuestionsResult.error;
      if (unpublishedQuestionsResult.error) throw unpublishedQuestionsResult.error;

      const stats: PublishStats = {
        publishedDomains: publishedDomainsResult.count ?? 0,
        unpublishedDomains: unpublishedDomainsResult.count ?? 0,
        publishedSkills: publishedSkillsResult.count ?? 0,
        unpublishedSkills: unpublishedSkillsResult.count ?? 0,
        publishedQuestions: publishedQuestionsResult.count ?? 0,
        unpublishedQuestions: unpublishedQuestionsResult.count ?? 0,
      };

      if (stats.publishedDomains === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No domains are marked as published',
        });
      }

      if (stats.publishedSkills === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No skills are marked as published',
        });
      }

      if (stats.publishedQuestions === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No questions are marked as published',
        });
      }

      // Check if there's nothing to publish
      const hasContent = stats.publishedDomains > 0 || stats.publishedSkills > 0 || stats.publishedQuestions > 0;
      if (!hasContent) {
        validationIssues.unshift({
          type: 'error',
          message: 'Nothing to publish. Mark at least one domain, skill, or question as published first.',
        });
      }

      return {
        meta: metaResult.data as CurriculumMeta,
        stats,
        validationIssues,
        canPublish: hasContent,
      };
    },
    refetchInterval: 30000,
  });
}

export function usePublishCurriculum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('publish_curriculum');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-meta'] });
      queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
      queryClient.invalidateQueries({ queryKey: ['publish-history'] });
    },
  });
}

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

      const [metaResult, domainsResult, skillsResult, questionsResult] = await Promise.all([
        supabase.from('curriculum_meta').select('version, last_published_at').eq('id', 'singleton').single(),
        supabase.from('domains').select('id, name, is_published').is('deleted_at', null),
        supabase.from('skills').select('id, name, domain_id, is_published').is('deleted_at', null),
        supabase.from('questions').select('id, skill_id, is_published').is('deleted_at', null),
      ]);

      if (metaResult.error) throw metaResult.error;
      if (domainsResult.error) throw domainsResult.error;
      if (skillsResult.error) throw skillsResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const domains = (domainsResult.data || []) as { id: string; name: string; is_published: boolean }[];
      const skills = (skillsResult.data || []) as { id: string; name: string; domain_id: string; is_published: boolean }[];
      const questions = (questionsResult.data || []) as { id: string; skill_id: string; is_published: boolean }[];

      const stats: PublishStats = {
        publishedDomains: domains.filter(d => d.is_published).length,
        unpublishedDomains: domains.filter(d => !d.is_published).length,
        publishedSkills: skills.filter(s => s.is_published).length,
        unpublishedSkills: skills.filter(s => !s.is_published).length,
        publishedQuestions: questions.filter(q => q.is_published).length,
        unpublishedQuestions: questions.filter(q => !q.is_published).length,
      };

      const domainIds = new Set(domains.map(d => d.id));
      const orphanedSkills = skills.filter(s => !domainIds.has(s.domain_id));
      if (orphanedSkills.length > 0) {
        validationIssues.push({
          type: 'error',
          message: `${orphanedSkills.length} skill(s) are linked to deleted or missing domains`,
        });
      }

      const skillIds = new Set(skills.map(s => s.id));
      const orphanedQuestions = questions.filter(q => !skillIds.has(q.skill_id));
      if (orphanedQuestions.length > 0) {
        validationIssues.push({
          type: 'error',
          message: `${orphanedQuestions.length} question(s) are linked to deleted or missing skills`,
        });
      }

      const publishedDomainsWithoutSkills = domains.filter(d => 
        d.is_published && !skills.some(s => s.domain_id === d.id)
      );
      if (publishedDomainsWithoutSkills.length > 0) {
        validationIssues.push({
          type: 'error',
          message: `${publishedDomainsWithoutSkills.length} published domain(s) have no skills: ${publishedDomainsWithoutSkills.map(d => d.name).join(', ')}`,
        });
      }

      if (stats.publishedDomains === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No domains are marked as published',
        });
      }

      if (stats.publishedQuestions === 0) {
        validationIssues.push({
          type: 'warning',
          message: 'No questions are marked as published',
        });
      }

      const hasErrors = validationIssues.some(i => i.type === 'error');

      return {
        meta: metaResult.data as CurriculumMeta,
        stats,
        validationIssues,
        canPublish: !hasErrors,
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
    },
  });
}

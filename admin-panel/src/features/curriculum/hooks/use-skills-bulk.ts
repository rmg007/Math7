import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CurriculumStatus } from '../types';

export function useBulkDeleteSkills() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (skill_ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        // checked app_id: conditional RLS
        .update({ deleted_at: new Date().toISOString() })
        .in('skill_id', skill_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useBulkUpdateSkillsStatus() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({
      skill_ids,
      status,
    }: {
      skill_ids: string[];
      status: CurriculumStatus;
    }) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('skills').update({ status }).in('skill_id', skill_ids);

      // checked app_id: conditional RLS
      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
    },
  });
}

export function useBulkCreateSkills() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (skills: Record<string, unknown>[]) => {
      // Using Record<string, unknown>[] for bulk import payload to simplify UI mapping
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = skills.map((skill) => ({
        ...skill,
        app_id: currentApp.app_id,
      }));

      // checked app_id: payload mapping
      const { data, error } = await supabase
        .from('skills')
        .insert(payload as Database['public']['Tables']['skills']['Insert'][]) // checked app_id
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
    },
  });
}

import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CurriculumStatus } from '../types';

export function useBulkDeleteDomains() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (domain_ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('domains')
        .update({ deleted_at: new Date().toISOString() })
        .in('domain_id', domain_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useBulkUpdateDomainsStatus() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: CurriculumStatus }) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('domains').update({ status }).in('domain_id', ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
    },
  });
}

export function useBulkCreateDomains() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (domains: Record<string, unknown>[]) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = domains.map((domain) => ({
        ...domain,
        app_id: currentApp.app_id,
      }));

      const { data, error } = await supabase
        .from('domains')
        .insert(payload as Database['public']['Tables']['domains']['Insert'][]) // checked app_id: payload
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
    },
  });
}

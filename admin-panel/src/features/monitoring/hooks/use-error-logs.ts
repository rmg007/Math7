import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type ErrorLog = Tables<'error_logs'>;

export function useErrorLogs(status?: string, appId?: string) {
  return useQuery({
    queryKey: ['error-logs', status, appId],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (appId) {
        query = query.eq('app_id', appId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useErrorLogStats() {
  return useQuery({
    queryKey: ['error-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('error_logs').select('status');

      if (error) throw error;

      const logs = data ?? [];
      const stats = {
        total: logs.length,
        new: logs.filter((e) => e.status === 'new').length,
        seen: logs.filter((e) => e.status === 'seen').length,
        ignored: logs.filter((e) => e.status === 'ignored').length,
        resolved: logs.filter((e) => e.status === 'resolved').length,
        promoted: logs.filter((e) => e.status === 'promoted').length,
      };

      return stats;
    },
  });
}

export function useUpdateErrorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('error_logs').update({ status }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

export function useDeleteErrorLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('error_logs').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

export function usePromoteToIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      errorId,
      title,
      rootCause,
      resolution,
    }: {
      errorId: string;
      title: string;
      rootCause?: string;
      resolution?: string;
    }) => {
      const { data, error } = await supabase.rpc('promote_error_to_issue', {
        p_error_id: errorId,
        p_title: title,
        p_root_cause: rootCause || undefined,
        p_resolution: resolution || undefined,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
      queryClient.invalidateQueries({ queryKey: ['known-issues'] });
    },
  });
}

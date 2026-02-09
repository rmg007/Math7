import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ErrorLog {
  id: string;
  user_id: string | null;
  app_id: string | null;
  platform: string;
  app_version: string | null;
  error_type: string;
  error_message: string;
  stack_trace: string | null;
  url: string | null;
  user_agent: string | null;
  extra_context: Record<string, unknown>;
  status: 'new' | 'seen' | 'ignored' | 'resolved' | 'promoted';
  promoted_to_issue_id: string | null;
  created_at: string;
  occurred_at: string;
}

export function useErrorLogs(status?: string) {
  return useQuery({
    queryKey: ['error-logs', status],
    queryFn: async () => {
      let query = supabase
        .from('error_logs' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as unknown as ErrorLog[];
    },
  });
}

export function useErrorLogStats() {
  return useQuery({
    queryKey: ['error-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs' as never)
        .select('status');

      if (error) throw error;

      const logs = (data ?? []) as unknown as { status: string }[];
      const stats = {
        total: logs.length,
        new: logs.filter(e => e.status === 'new').length,
        seen: logs.filter(e => e.status === 'seen').length,
        ignored: logs.filter(e => e.status === 'ignored').length,
        resolved: logs.filter(e => e.status === 'resolved').length,
        promoted: logs.filter(e => e.status === 'promoted').length,
      };

      return stats;
    },
  });
}

export function useUpdateErrorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('error_logs' as never)
        .update({ status } as never)
        .eq('id', id);

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
      const { error } = await supabase
        .from('error_logs' as never)
        .delete()
        .eq('id', id);

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
      resolution 
    }: { 
      errorId: string; 
      title: string; 
      rootCause?: string; 
      resolution?: string;
    }) => {
      const { data, error } = await supabase.rpc('promote_error_to_issue' as never, {
        p_error_id: errorId,
        p_title: title,
        p_root_cause: rootCause || null,
        p_resolution: resolution || null,
      } as never);

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

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { castJson } from '@/lib/type-utils';
import { isValidUUID } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type ErrorLog = Tables<'error_logs'>;

export function useErrorLogs({
  status,
  appId,
  page = 1,
  pageSize = 50,
  search = '',
}: {
  status?: string;
  appId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: ['error-logs', status, appId, page, pageSize, search],
    queryFn: async () => {
      const markName = 'useErrorLogs';
      performance.mark(`${markName}:start`);
      let query = supabase
        .from('error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (appId) {
        query = query.eq('app_id', appId);
      }

      if (search) {
        // Search in both message and type
        query = query.or(`error_message.ilike.%${search}%,error_type.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return {
        data: castJson<ErrorLog[]>(data ?? []),
        count: count ?? 0,
      };
    },
  });
}

export function useErrorLogStats() {
  return useQuery({
    queryKey: ['error-log-stats'],
    queryFn: async () => {
      const markName = 'useErrorLogStats';
      performance.mark(`${markName}:start`);
      // Use server-side counting with head:true to avoid fetching all rows
      const [totalResult, newResult, seenResult, ignoredResult, resolvedResult, promotedResult] =
        await Promise.all([
          supabase.from('error_logs').select('id', { count: 'exact', head: true }),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'new'),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'seen'),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ignored'),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'resolved'),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'promoted'),
        ]);

      if (totalResult.error) throw totalResult.error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return {
        total: totalResult.count ?? 0,
        new: newResult.count ?? 0,
        seen: seenResult.count ?? 0,
        ignored: ignoredResult.count ?? 0,
        resolved: resolvedResult.count ?? 0,
        promoted: promotedResult.count ?? 0,
      };
    },
  });
}

export function useUpdateErrorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!isValidUUID(id)) throw new Error(`Invalid error log ID format: ${id}`);
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
      if (!isValidUUID(id)) throw new Error(`Invalid error log ID format: ${id}`);
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

export function useBulkUpdateErrorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from('error_logs').update({ status }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

export function useBulkDeleteErrorLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('error_logs').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface KnownIssue {
  id: string;
  title: string;
  description?: string;
  error_message?: string;
  root_cause?: string | null;
  resolution?: string | null;
  status: 'open' | 'closed' | 'recurring' | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  category?: string | null;
  created_at: string | null;
  updated_at: string | null;
  promoted_from_id?: string | null;
}

interface KnownIssueRow {
  id: string;
  title: string;
  metadata: Record<string, unknown> | null;
  root_cause: string | null;
  resolution: string | null;
  status: string | null;
  severity: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  promoted_from_id: string | null;
}

export function useKnownIssues() {
  return useQuery({
    queryKey: ['known-issues'],
    queryFn: async (): Promise<KnownIssue[]> => {
      const { data, error } = await supabase
        .from('known_issues' as never)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown as KnownIssueRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        description: (row.metadata as Record<string, string> | null)?.description,
        error_message: (row.metadata as Record<string, string> | null)?.error_message,
        root_cause: row.root_cause,
        resolution: row.resolution,
        status: (row.status as KnownIssue['status']) ?? null,
        severity: (row.severity as KnownIssue['severity']) ?? null,
        category: row.category ?? null,
        created_at: row.created_at ?? '',
        updated_at: row.updated_at ?? '',
        promoted_from_id: row.promoted_from_id ?? null,
      }));
    },
  });
}

export function useDeleteKnownIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('known_issues' as never)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['known-issues'] });
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

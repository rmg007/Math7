import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type KnownIssueRow = Database['public']['Tables']['known_issues']['Row'];

export interface KnownIssue {
  id: string;
  title: string;
  description?: string;
  error_message?: string;
  root_cause?: string | null;
  resolution?: string | null;
  status: 'open' | 'closed' | 'recurring' | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  sentry_link?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useKnownIssues() {
  return useQuery({
    queryKey: ['known-issues'],
    queryFn: async (): Promise<KnownIssue[]> => {
      const { data, error } = await supabase
        .from('known_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as KnownIssueRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        error_message: row.error_message || undefined,
        root_cause: row.root_cause,
        resolution: row.resolution,
        status: (row.status as KnownIssue['status']) ?? null,
        severity: (row.severity as KnownIssue['severity']) ?? null,
        sentry_link: row.sentry_link,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
      }));
    },
  });
}

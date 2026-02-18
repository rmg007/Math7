import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type KnownIssue = Tables<'known_issues'>;

export function useKnownIssues() {
  return useQuery({
    queryKey: ['known-issues'],
    queryFn: async (): Promise<KnownIssue[]> => {
      const { data, error } = await supabase
        .from('known_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
  });
}

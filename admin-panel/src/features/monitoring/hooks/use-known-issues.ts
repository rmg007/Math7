import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

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

export function useDeleteKnownIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('known_issues')
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

import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type KnownIssueInsert = Database['public']['Tables']['known_issues']['Insert'];
type KnownIssueUpdate = Database['public']['Tables']['known_issues']['Update'];

// Type guard to ensure we don't send nulls where they aren't allowed, though Supabase types handle this well.
// We'll trust the Database types.

export function useCreateKnownIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIssue: KnownIssueInsert) => {
      const { data, error } = await supabase
        .from('known_issues')
        .insert(newIssue)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['known-issues'] });
    },
  });
}

export function useUpdateKnownIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: KnownIssueUpdate }) => {
      const { data, error } = await supabase
        .from('known_issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['known-issues'] });
    },
  });
}

export function useDeleteKnownIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('known_issues').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['known-issues'] });
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log-stats'] });
    },
  });
}

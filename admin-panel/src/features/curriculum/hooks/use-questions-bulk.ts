import { useApp } from '@/hooks/use-app';
import { Database } from '@questerix/core/types/database';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type QuestionInsert = Database['public']['Tables']['questions']['Insert'];

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (questions: QuestionInsert[]) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = questions.map((q) => ({
        ...q,
        app_id: currentApp.app_id,
      }));

      const { data, error } = await supabase.from('questions').insert(payload).select(); // checked app_id

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          ['questions', 'questions-paginated', 'dashboard-stats'].includes(
            query.queryKey[0] as string
          ),
      });
    },
  });
}

export function useBulkDeleteQuestions() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (question_ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('questions')
        .update({ deleted_at: new Date().toISOString() })
        .in('question_id', question_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          ['questions', 'questions-paginated', 'dashboard-stats'].includes(
            query.queryKey[0] as string
          ),
      });
    },
  });
}

export function useBulkUpdateQuestionsStatus() {
  const queryClient = useQueryClient();
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({
      question_ids,
      status,
    }: {
      question_ids: string[];
      status: 'draft' | 'published' | 'live';
    }) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('questions').update({ status }).in('question_id', question_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          ['questions', 'questions-paginated', 'dashboard-stats', 'publish-preview'].includes(
            query.queryKey[0] as string
          ),
      });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useApp } from '@/hooks/use-app';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];

export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'draft' | 'published' | 'live';
  skillId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useQuestions(skillId?: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['questions', skillId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('questions')
        .select(`
          *,
          skills (
            title,
            domains ( title )
          )
        `)
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (skillId && skillId !== 'all') {
        query = query.eq('skill_id', skillId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as (Question & { skills: { name: string, domains: { name: string } | null } | null })[];
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function usePaginatedQuestions(params: PaginationParams) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['questions-paginated', params, currentApp?.app_id],
    queryFn: async (): Promise<PaginatedResponse<Question & { skills: { name: string, domains: { name: string } | null } | null }>> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { page, pageSize, search, status, skillId, sortBy = 'created_at', sortOrder = 'desc' } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('questions')
        .select(`
          *,
          skills (
            title,
            domains ( title )
          )
        `, { count: 'exact' })
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null);

      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (skillId && skillId !== 'all') {
        query = query.eq('skill_id', skillId);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as unknown as (Question & { skills: { name: string, domains: { name: string } | null } | null })[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function useQuestion(question_id: string) {
    const { currentApp } = useApp();
    return useQuery({
        queryKey: ['question', question_id, currentApp?.app_id],
        queryFn: async () => {
             if (!currentApp?.app_id) throw new Error('No app selected');

             const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('question_id', question_id)
                .eq('app_id', currentApp.app_id)
                .single();

            if (error) throw error;
            return data as Question;
        },
        enabled: Boolean(question_id) && Boolean(currentApp?.app_id),
    });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();
  
  return useMutation({
    mutationFn: async (question: QuestionInsert) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = {
        ...question,
        app_id: currentApp.app_id
      };

      const { data, error } = await supabase
        .from('questions')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (questions: QuestionInsert[]) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = questions.map(q => ({
        ...q,
        app_id: currentApp.app_id
      }));

      const { data, error } = await supabase
        .from('questions')
        .insert(payload)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ question_id, ...updates }: { question_id: string } & Partial<Question>) => {
            const { data, error } = await supabase
                .from('questions')
                .update(updates)
                .eq('question_id', question_id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['question', data.question_id] });
        },
    });
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (question_id: string) => {
            const { error } = await supabase
                .from('questions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('question_id', question_id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
        },
    });
}

export function useBulkDeleteQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (question_ids: string[]) => {
            const { error } = await supabase
                .from('questions')
                .update({ deleted_at: new Date().toISOString() })
                .in('question_id', question_ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useBulkUpdateQuestionsStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ question_ids, status }: { question_ids: string[]; status: CurriculumStatus }) => {
            const { error } = await supabase
                .from('questions')
                .update({ status })
                .in('question_id', question_ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
        },
    });
}

export function useDuplicateQuestion() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async (question_id: string) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { data: original, error: fetchError } = await supabase
                .from('questions')
                .select('*')
                .eq('question_id', question_id)
                .eq('app_id', currentApp.app_id)
                .single();

            if (fetchError) throw fetchError;
            if (!original) throw new Error('Question not found');

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { question_id: _, created_at, updated_at, app_id, ...rest } = original;
            const duplicate: QuestionInsert = {
                ...rest,
                app_id: currentApp.app_id,
                content: rest.content || 'Question',
                status: 'draft',
            };

            const { data, error } = await supabase
                .from('questions')
                .insert(duplicate)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useUpdateQuestionOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: { question_id: string; sort_order: number }[]) => {
            const promises = updates.map(({ question_id, sort_order }) =>
                supabase.from('questions')
                    .update({ sort_order })
                    .eq('question_id', question_id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw errors[0].error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
        },
    });
}

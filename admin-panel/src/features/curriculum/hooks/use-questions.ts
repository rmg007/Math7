/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type QuestionUpdate = Database['public']['Tables']['questions']['Update'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'published' | 'draft';
  skillId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useQuestions(skillId?: string) {
  return useQuery({
    queryKey: ['questions', skillId],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select(`
          *,
          skills (
            title,
            domains ( title )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (skillId && skillId !== 'all') {
        query = query.eq('skill_id', skillId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as (Question & { skills: { title: string, domains: { title: string } | null } | null })[];
    },
  });
}

export function usePaginatedQuestions(params: PaginationParams) {
  return useQuery({
    queryKey: ['questions-paginated', params],
    queryFn: async (): Promise<PaginatedResponse<Question & { skills: { title: string, domains: { title: string } | null } | null }>> => {
      const { page, pageSize, search, status, skillId } = params;
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
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      if (status === 'published') {
        query = query.eq('is_published', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      }

      if (skillId && skillId !== 'all') {
        query = query.eq('skill_id', skillId);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: data as unknown as (Question & { skills: { title: string, domains: { title: string } | null } | null })[],
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}

export function useQuestion(id: string) {
    return useQuery({
        queryKey: ['question', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Question;
        },
        enabled: !!id,
    });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (question: QuestionInsert) => {
      const { data, error } = await (supabase
        .from('questions') as any)
        .insert(question)
        .select()
        .single();
      
      if (error) throw error;
      return data as Question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
    },
  });
}

export function useUpdateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & QuestionUpdate) => {
            const { data, error } = await (supabase
                .from('questions') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Question;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['question', data.id] });
        },
    });
}

export function useDeleteQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('questions') as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

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
        mutationFn: async (ids: string[]) => {
            const { error } = await (supabase
                .from('questions') as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);

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
        mutationFn: async ({ ids, is_published }: { ids: string[]; is_published: boolean }) => {
            const { error } = await (supabase
                .from('questions') as any)
                .update({ is_published })
                .in('id', ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useDuplicateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: original, error: fetchError } = await supabase
                .from('questions')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!original) throw new Error('Question not found');

            const { id: _, created_at, updated_at, ...rest } = original as any;
            const duplicate = {
                ...rest,
                content: `${rest.content} (Copy)`,
                is_published: false,
            };

            const { data, error } = await (supabase
                .from('questions') as any)
                .insert(duplicate)
                .select()
                .single();

            if (error) throw error;
            return data as Question;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['questions-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

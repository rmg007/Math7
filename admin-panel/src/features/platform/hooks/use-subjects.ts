import { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type Subject = Tables<'subjects'>;
export type SubjectInsert = TablesInsert<'subjects'>;
export type SubjectUpdate = TablesUpdate<'subjects'>;

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: SubjectInsert) => {
      const { data, error } = await supabase.from('subjects').insert(subject).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & SubjectUpdate) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('subject_id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error(`Subject with ID ${id} not found for update.`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subjects').delete().eq('subject_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useBulkUpdateSubjectsStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: 'draft' | 'published' | 'live';
    }) => {
      const { error } = await supabase.from('subjects').update({ status }).in('subject_id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useBulkDeleteSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('subjects').delete().in('subject_id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useBulkCreateSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjects: SubjectInsert[]) => {
      const { data, error } = await supabase.from('subjects').insert(subjects).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

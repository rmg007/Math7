/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];
type SkillInsert = Database['public']['Tables']['skills']['Insert'];
type SkillUpdate = Database['public']['Tables']['skills']['Update'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'published' | 'draft';
  domainId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useSkills(domainId?: string) {
  return useQuery({
    queryKey: ['skills', domainId],
    queryFn: async () => {
      let query = supabase
        .from('skills')
        .select(`
          *,
          domains (
            title
          )
        `)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as (Skill & { domains: { title: string } | null })[];
    },
  });
}

export function usePaginatedSkills(params: PaginationParams) {
  return useQuery({
    queryKey: ['skills-paginated', params],
    queryFn: async (): Promise<PaginatedResponse<Skill & { domains: { title: string } | null }>> => {
      const { page, pageSize, search, status, domainId } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('skills')
        .select(`
          *,
          domains (
            title
          )
        `, { count: 'exact' })
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status === 'published') {
        query = query.eq('is_published', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      }

      if (domainId && domainId !== 'all') {
        query = query.eq('domain_id', domainId);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: data as unknown as (Skill & { domains: { title: string } | null })[],
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}

export function useSkill(id: string) {
    return useQuery({
        queryKey: ['skill', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('skills')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Skill;
        },
        enabled: !!id,
    });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (skill: SkillInsert) => {
      const { data, error } = await (supabase
        .from('skills') as any)
        .insert(skill)
        .select()
        .single();
      
      if (error) throw error;
      return data as Skill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
    },
  });
}

export function useUpdateSkill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & SkillUpdate) => {
            const { data, error } = await (supabase
                .from('skills') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Skill;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['skill', data.id] });
        },
    });
}

export function useDeleteSkill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('skills') as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
        },
    });
}

export function useBulkDeleteSkills() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await (supabase
                .from('skills') as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useBulkUpdateSkillsStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ids, is_published }: { ids: string[]; is_published: boolean }) => {
            const { error } = await (supabase
                .from('skills') as any)
                .update({ is_published })
                .in('id', ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useDuplicateSkill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: original, error: fetchError } = await supabase
                .from('skills')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!original) throw new Error('Skill not found');

            const { id: _, created_at, updated_at, ...rest } = original as any;
            const duplicate = {
                ...rest,
                title: `${rest.title} (Copy)`,
                slug: `${rest.slug}_copy_${Date.now()}`,
                is_published: false,
            };

            const { data, error } = await (supabase
                .from('skills') as any)
                .insert(duplicate)
                .select()
                .single();

            if (error) throw error;
            return data as Skill;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

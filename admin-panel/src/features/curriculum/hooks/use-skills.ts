import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useApp } from '@/hooks/use-app';

type Skill = Database['public']['Tables']['skills']['Row'];

export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];

// Form input type - excludes auto-generated fields
export type SkillFormInput = {
  domain_id: string;
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
};

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | CurriculumStatus;
  domainId?: string;
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

export function useSkills(domainId?: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['skills', domainId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        .select(`
          *,
          domains (
            title
          )
        `)
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (domainId) {
        query = query.eq('domain_id', domainId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as (Skill & { domains: { title: string } | null })[];
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function usePaginatedSkills(params: PaginationParams) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['skills-paginated', params, currentApp?.app_id],
    queryFn: async (): Promise<PaginatedResponse<Skill & { domains: { title: string } | null }>> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { page, pageSize, search, status, domainId, sortBy = 'sort_order', sortOrder = 'asc' } = params;
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
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null);

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (domainId && domainId !== 'all') {
        query = query.eq('domain_id', domainId);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as unknown as (Skill & { domains: { title: string } | null })[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function useSkill(skill_id: string) {
    const { currentApp } = useApp();
    return useQuery({
        queryKey: ['skill', skill_id, currentApp?.app_id],
        queryFn: async () => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { data, error } = await supabase
                .from('skills')
                .select('*')
                .eq('skill_id', skill_id)
                .eq('app_id', currentApp.app_id)
                .single();

            if (error) throw error;
            return data as Skill;
        },
        enabled: Boolean(skill_id) && Boolean(currentApp?.app_id),
    });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();
  
  return useMutation({
    mutationFn: async (skill: SkillFormInput) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = {
          ...skill,
          app_id: currentApp.app_id
      };

      const { data, error } = await supabase
        .from('skills')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
        mutationFn: async ({ skill_id, ...updates }: { skill_id: string } & Partial<Skill>) => {
            const { data, error } = await supabase
                .from('skills')
                .update(updates)
                .eq('skill_id', skill_id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['skill', data.skill_id] });
        },
    });
}

export function useDeleteSkill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (skill_id: string) => {
            const { error } = await supabase
                .from('skills')
                .update({ deleted_at: new Date().toISOString() })
                .eq('skill_id', skill_id);
            
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
        mutationFn: async (skill_ids: string[]) => {
            const { error } = await supabase
                .from('skills')
                .update({ deleted_at: new Date().toISOString() })
                .in('skill_id', skill_ids);

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
        mutationFn: async ({ skill_ids, status }: { skill_ids: string[]; status: CurriculumStatus }) => {
            const { error } = await supabase
                .from('skills')
                .update({ status })
                .in('skill_id', skill_ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
        },
    });
}

export function useDuplicateSkill() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async (skill_id: string) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { data: original, error: fetchError } = await supabase
                .from('skills')
                .select('*')
                .eq('skill_id', skill_id)
                .eq('app_id', currentApp.app_id)
                .single();

            if (fetchError) throw fetchError;
            if (!original) throw new Error('Skill not found');

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { skill_id: _, created_at, updated_at, app_id, ...rest } = original;
            const duplicate: Database['public']['Tables']['skills']['Insert'] = {
                ...rest,
                app_id: currentApp.app_id, // Ensure we use current app ID
                title: `${rest.title} (Copy)`,
                slug: `${rest.slug}_copy_${Date.now()}`,
                status: 'draft',
            };

            const { data, error } = await supabase
                .from('skills')
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

export function useUpdateSkillOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: { skill_id: string; sort_order: number }[]) => {
            const promises = updates.map(({ skill_id, sort_order }) =>
                supabase.from('skills')
                    .update({ sort_order })
                    .eq('skill_id', skill_id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw errors[0].error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
        },
    });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useApp } from '@/hooks/use-app';

type Domain = Database['public']['Tables']['domains']['Row'];

// Form input type - excludes auto-generated fields
export type DomainFormInput = {
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
};

export type CurriculumStatus = Database['public']['Enums']['curriculum_status'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | CurriculumStatus;
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

export function useDomains() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['domains', currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null)
        .order('sort_order');
      
      if (error) throw error;
      return data as Domain[];
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function usePaginatedDomains(params: PaginationParams) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['domains-paginated', params, currentApp?.app_id],
    queryFn: async (): Promise<PaginatedResponse<Domain>> => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { page, pageSize, search, status, sortBy = 'sort_order', sortOrder = 'asc' } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('domains')
        .select('*', { count: 'exact' })
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null);

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Domain[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

export function useDomain(domainId: string) {
    const { currentApp } = useApp();
    return useQuery({
        queryKey: ['domain', domainId, currentApp?.app_id],
        queryFn: async () => {
            if (!currentApp?.app_id) throw new Error('No app selected');

             const { data, error } = await supabase
                .from('domains')
                .select('*')
                .eq('domain_id', domainId)
                .eq('app_id', currentApp.app_id)
                .single();

            if (error) throw error;
            return data as Domain;
        },
        enabled: Boolean(domainId) && Boolean(currentApp?.app_id),
    });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();
  
  return useMutation({
    mutationFn: async (domain: DomainFormInput) => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      
      const payload = {
          ...domain,
          app_id: currentApp.app_id
      };

      const { data, error } = await supabase
        .from('domains')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data as Domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
    },
  });
}

export function useUpdateDomain() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async ({ domain_id, ...updates }: { domain_id: string } & Partial<Domain>) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { data, error } = await supabase
                .from('domains')
                .update(updates)
                .eq('domain_id', domain_id)
                .eq('app_id', currentApp.app_id)
                .select()
                .single();

            if (error) throw error;
            return data as Domain;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['domain', data.domain_id] });
        },
    });
}

export function useDeleteDomain() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async (domain_id: string) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { error } = await supabase
                .from('domains')
                .update({ deleted_at: new Date().toISOString() })
                .eq('domain_id', domain_id)
                .eq('app_id', currentApp.app_id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
        },
    });
}

export function useBulkDeleteDomains() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async (domain_ids: string[]) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { error } = await supabase
                .from('domains')
                .update({ deleted_at: new Date().toISOString() })
                .in('domain_id', domain_ids)
                .eq('app_id', currentApp.app_id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

export function useBulkUpdateDomainsStatus() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async ({ ids, status }: { ids: string[]; status: CurriculumStatus }) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const { error } = await supabase
                .from('domains')
                .update({ status })
                .in('domain_id', ids)
                .eq('app_id', currentApp.app_id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['publish-preview'] });
        },
    });
}

export function useUpdateDomainOrder() {
    const queryClient = useQueryClient();
    const { currentApp } = useApp();

    return useMutation({
        mutationFn: async (updates: { domain_id: string; sort_order: number }[]) => {
            if (!currentApp?.app_id) throw new Error('No app selected');

            const promises = updates.map(({ domain_id, sort_order }) =>
                supabase.from('domains')
                    .update({ sort_order })
                    .eq('domain_id', domain_id)
                    .eq('app_id', currentApp.app_id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw errors[0].error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
        },
    });
}

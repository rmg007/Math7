/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Domain = Database['public']['Tables']['domains']['Row'];
type DomainInsert = Database['public']['Tables']['domains']['Insert'];
type DomainUpdate = Database['public']['Tables']['domains']['Update'];

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'published' | 'draft';
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order');
      
      if (error) throw error;
      return data as Domain[];
    },
  });
}

export function usePaginatedDomains(params: PaginationParams) {
  return useQuery({
    queryKey: ['domains-paginated', params],
    queryFn: async (): Promise<PaginatedResponse<Domain>> => {
      const { page, pageSize, search, status } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('domains')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('sort_order');

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status === 'published') {
        query = query.eq('is_published', true);
      } else if (status === 'draft') {
        query = query.eq('is_published', false);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: data as Domain[],
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}

export function useDomain(id: string) {
    return useQuery({
        queryKey: ['domain', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('domains')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Domain;
        },
        enabled: !!id,
    });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domain: DomainInsert) => {
      const { data, error } = await (supabase
        .from('domains') as any)
        .insert(domain)
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

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & DomainUpdate) => {
            const { data, error } = await (supabase
                .from('domains') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Domain;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['domain', data.id] });
        },
    });
}

export function useDeleteDomain() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('domains') as any)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            
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

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await (supabase
                .from('domains') as any)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);

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

    return useMutation({
        mutationFn: async ({ ids, is_published }: { ids: string[]; is_published: boolean }) => {
            const { error } = await (supabase
                .from('domains') as any)
                .update({ is_published })
                .in('id', ids);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });
}

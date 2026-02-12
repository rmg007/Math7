import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CurriculumStatus, isValidUUID, PaginatedResponse, PaginationParams } from './shared';


// Form input type - excludes auto-generated fields
export type DomainFormInput = {
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
};

export function useDomains() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['domains', currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      if (!isValidUUID(currentApp.app_id)) {
        throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
      }

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Domain[];
    },
    enabled: Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id),
  });
}

export function usePaginatedDomains(params: PaginationParams) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['domains-paginated', params, currentApp?.app_id],
    queryFn: async (): Promise<PaginatedResponse<Domain>> => {
      if (!currentApp?.app_id) {
        console.error('usePaginatedDomains: No app selected');
        throw new Error('No app selected');
      }

      // Validate UUID format
      if (!isValidUUID(currentApp.app_id)) {
        console.error('usePaginatedDomains: Invalid app_id format:', {
          app_id: currentApp.app_id,
          type: typeof currentApp.app_id,
        });
        throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
      }

      const { page, pageSize, search, status, sortBy = 'sort_order', sortOrder = 'asc' } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('domains')
        .select('*', { count: 'exact' })
        .eq('app_id', currentApp.app_id)
        .is('deleted_at', null);

      if (search) {
        const escapedSearch = escapePostgrestSearch(search);
        query = query.or(
          `title.ilike.%${escapedSearch}%,slug.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`
        );
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
    enabled: Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id),
  });
}

export function useDomain(domainId: string) {
  const { currentApp } = useApp();
  return useQuery({
    queryKey: ['domain', domainId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');
      if (!isValidUUID(currentApp.app_id)) {
        throw new Error(`Invalid app ID format: ${currentApp.app_id}`);
      }

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain_id', domainId)
        .eq('app_id', currentApp.app_id)
        .single();

      if (error) throw error;
      return data as Domain;
    },
    enabled: Boolean(domainId) && Boolean(currentApp?.app_id) && isValidUUID(currentApp?.app_id),
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
        app_id: currentApp.app_id,
      };

      const { data, error } = await supabase.from('domains').insert(payload).select().single();

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
        supabase
          .from('domains')
          .update({ sort_order })
          .eq('domain_id', domain_id)
          .eq('app_id', currentApp.app_id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
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

export function useBulkCreateDomains() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (domains: Record<string, unknown>[]) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = domains.map((domain) => ({
        ...domain,
        app_id: currentApp.app_id,
      }));

      const { data, error } = await supabase
        .from('domains')
        .insert(payload as Database['public']['Tables']['domains']['Insert'][])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains-paginated'] });
    },
  });
}

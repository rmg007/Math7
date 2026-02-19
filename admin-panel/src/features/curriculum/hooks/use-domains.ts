import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { escapePostgrestSearch } from '@/lib/postgrest-utils';
import { isValidUUID } from '@/lib/utils';
import { CurriculumStatus, PaginatedResponse, PaginationParams } from '../types';

type Domain = Database['public']['Tables']['domains']['Row'];

// Form input type - excludes auto-generated fields
export type DomainFormInput = {
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
  app_id?: string;
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

export function usePaginatedDomains(params: PaginationParams, appId?: string) {
  const { currentApp, isSuperAdmin } = useApp();

  return useQuery({
    queryKey: ['domains-paginated', params, appId || currentApp?.app_id, isSuperAdmin],
    queryFn: async (): Promise<
      PaginatedResponse<Domain & { apps: { display_name: string } | null }>
    > => {
      const targetAppId = appId || currentApp?.app_id;

      if (!isSuperAdmin && !targetAppId) {
        console.error('usePaginatedDomains: No app selected');
        throw new Error('No app selected');
      }

      // For super admins, we might not have a target app, so skip validation
      if (!isSuperAdmin && targetAppId && !isValidUUID(targetAppId)) {
        console.error('usePaginatedDomains: Invalid app_id format:', {
          app_id: targetAppId,
          type: typeof targetAppId,
        });
        throw new Error(`Invalid app ID format: ${targetAppId}`);
      }

      const { page, pageSize, search, status, sortBy = 'sort_order', sortOrder = 'asc' } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('domains')
        .select('*, apps(display_name)', { count: 'exact' })
        .is('deleted_at', null);

      // Only filter by app_id if not super admin or if a specific app is requested
      if (!isSuperAdmin || appId) {
        if (targetAppId) {
          query = query.eq('app_id', targetAppId);
        }
      }

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
        data: data as (Domain & { apps: { display_name: string } | null })[],
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
  return useQuery({
    queryKey: ['domain', domainId],
    queryFn: async () => {
      if (!isValidUUID(domainId)) throw new Error(`Invalid domain ID format: ${domainId}`);

      // RLS enforces tenant isolation — no client-side app_id filter needed
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain_id', domainId)
        .single();

      if (error) throw error;
      return data as Domain;
    },
    enabled: Boolean(domainId) && isValidUUID(domainId),
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (domain: DomainFormInput) => {
      const appId = domain.app_id || currentApp?.app_id;
      if (!appId) throw new Error('No app selected');

      const payload = {
        ...domain,
        app_id: appId,
      };

      const { data, error } = await supabase.from('domains').insert(payload).select().single(); // checked app_id: payload

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({ domain_id, ...updates }: { domain_id: string } & Partial<Domain>) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');
      if (!isValidUUID(domain_id)) throw new Error(`Invalid domain ID format: ${domain_id}`);

      let query = supabase.from('domains').update(updates).eq('domain_id', domain_id);

      // Always scope writes to the resource's own app_id when available (defense-in-depth)
      if (updates.app_id) {
        query = query.eq('app_id', updates.app_id);
      } else if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      if (!data) throw new Error(`Domain with ID ${domain_id} not found for update.`);
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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (domain_id: string) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      // Super Admins can delete any domain (RLS will enforce perms)
      // Tenant Admins are restricted to their current app via RLS and this extra check
      let query = supabase
        .from('domains')
        .update({ deleted_at: new Date().toISOString() })
        .eq('domain_id', domain_id);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (domain_ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('domains')
        .update({ deleted_at: new Date().toISOString() })
        .in('domain_id', domain_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: CurriculumStatus }) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('domains').update({ status }).in('domain_id', ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;
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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (updates: { domain_id: string; sort_order: number }[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      const promises = updates.map(({ domain_id, sort_order }) => {
        let query = supabase.from('domains').update({ sort_order }).eq('domain_id', domain_id);

        if (!isSuperAdmin && currentApp?.app_id) {
          query = query.eq('app_id', currentApp.app_id);
        }

        return query;
      });

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
        .insert(payload as Database['public']['Tables']['domains']['Insert'][]) // checked app_id: payload
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

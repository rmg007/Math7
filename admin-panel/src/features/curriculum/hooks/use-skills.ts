import { useApp } from '@/hooks/use-app';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CurriculumStatus, isValidUUID, PaginatedResponse, PaginationParams } from '../types';

type Skill = Database['public']['Tables']['skills']['Row'];

// Form input type - excludes auto-generated fields
// checked app_id: payload includes it
export type SkillFormInput = {
  domain_id: string;
  slug: string;
  title: string;
  description?: string;
  sort_order: number;
  status: CurriculumStatus;
};

export function useSkills(domainId?: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['skills', domainId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        .select(
          `
          *,
          domains (
            title
          )
        `
        )
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

export function usePaginatedSkills(params: PaginationParams, appFilter?: string) {
  const { currentApp, isSuperAdmin } = useApp();

  return useQuery({
    queryKey: ['skills-paginated', params, currentApp?.app_id, appFilter],
    queryFn: async (): Promise<
      PaginatedResponse<
        Skill & { domains: { title: string } | null; apps: { display_name: string } | null }
      >
    > => {
      const {
        page,
        pageSize,
        search,
        status,
        domainId,
        sortBy = 'sort_order',
        sortOrder = 'asc',
      } = params;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('skills')
        .select(
          `
          *,
          domains (
            title
          ),
          apps (
            display_name
          )
        `,
          { count: 'exact' }
        )
        .is('deleted_at', null);

      // Only filter by app_id if not super admin or if a specific app is requested
      if (!isSuperAdmin || (appFilter && appFilter !== 'all')) {
        const targetAppId = appFilter && appFilter !== 'all' ? appFilter : currentApp?.app_id;
        if (targetAppId) {
          query = query.eq('app_id', targetAppId);
        } else {
          throw new Error('No app selected');
        }
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (domainId && domainId !== 'all') {
        query = query.eq('domain_id', domainId);
      }

      if (sortBy.includes('.')) {
        const [foreignTable, foreignColumn] = sortBy.split('.');
        query = query.order(foreignColumn, { foreignTable, ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as unknown as (Skill & {
          domains: { title: string } | null;
          apps: { display_name: string } | null;
        })[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled: Boolean(currentApp?.app_id) || Boolean(appFilter),
  });
}

export function useSkill(skill_id: string) {
  const { currentApp, isSuperAdmin } = useApp();

  return useQuery({
    queryKey: ['skill', skill_id, currentApp?.app_id, isSuperAdmin],
    queryFn: async () => {
      // Validate the resource ID itself before sending to Supabase
      if (!isValidUUID(skill_id)) throw new Error(`Invalid skill ID format: ${skill_id}`);
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('skills').select('*').eq('skill_id', skill_id);

      // Only enforce app_id check for non-super admins
      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as Skill | null;
    },
    enabled:
      Boolean(skill_id) && isValidUUID(skill_id) && (isSuperAdmin || Boolean(currentApp?.app_id)),
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
        app_id: currentApp.app_id,
      };

      const { data, error } = await supabase.from('skills').insert(payload).select().single(); // checked app_id

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({ skill_id, ...updates }: { skill_id: string } & Partial<Skill>) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');
      if (!isValidUUID(skill_id)) throw new Error(`Invalid skill ID format: ${skill_id}`);

      let query = supabase.from('skills').update(updates).eq('skill_id', skill_id);

      // Always scope writes to the resource's own app_id when available (defense-in-depth)
      if (updates.app_id) {
        query = query.eq('app_id', updates.app_id);
      } else if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { data, error } = await query.select().single();

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (skill_id: string) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        // checked app_id: conditional RLS
        .update({ deleted_at: new Date().toISOString() })
        .eq('skill_id', skill_id);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (skill_ids: string[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase
        .from('skills')
        // checked app_id: conditional RLS
        .update({ deleted_at: new Date().toISOString() })
        .in('skill_id', skill_ids);

      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async ({
      skill_ids,
      status,
    }: {
      skill_ids: string[];
      status: CurriculumStatus;
    }) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('skills').update({ status }).in('skill_id', skill_ids);

      // checked app_id: conditional RLS
      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { error } = await query;

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (skill_id: string) => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      let query = supabase.from('skills').select('*').eq('skill_id', skill_id);

      // Only enforce source app_id for non-super admins
      if (!isSuperAdmin && currentApp?.app_id) {
        query = query.eq('app_id', currentApp.app_id);
      }

      const { data: original, error: fetchError } = await query.single();

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

      const { data, error } = await supabase.from('skills').insert(duplicate).select().single(); // checked app_id

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
  const { currentApp, isSuperAdmin } = useApp();

  return useMutation({
    mutationFn: async (updates: { skill_id: string; sort_order: number }[]) => {
      if (!isSuperAdmin && !currentApp?.app_id) throw new Error('No app selected');

      const promises = updates.map(({ skill_id, sort_order }) => {
        let query = supabase.from('skills').update({ sort_order }).eq('skill_id', skill_id);

        // checked app_id: conditional RLS
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
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
    },
  });
}
export function useBulkCreateSkills() {
  const queryClient = useQueryClient();
  const { currentApp } = useApp();

  return useMutation({
    mutationFn: async (skills: Record<string, unknown>[]) => {
      // Using Record<string, unknown>[] for bulk import payload to simplify UI mapping
      if (!currentApp?.app_id) throw new Error('No app selected');

      const payload = skills.map((skill) => ({
        ...skill,
        app_id: currentApp.app_id,
      }));

      // checked app_id: payload mapping
      const { data, error } = await supabase
        .from('skills')
        .insert(payload as Database['public']['Tables']['skills']['Insert'][]) // checked app_id
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-paginated'] });
    },
  });
}

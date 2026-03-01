import { supabase } from '@/lib/supabase';
import { castJson } from '@/lib/type-utils';
import { isValidUUID } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppInsert, AppUpdate, CompiledApp } from '@/types/platform';

export type { App, AppInsert, CompiledApp } from '@/types/platform';

export function useApps() {
  return useQuery({
    queryKey: ['apps-admin'],
    queryFn: async () => {
      const markName = 'useApps';
      performance.mark(`${markName}:start`);
      const { data, error } = await supabase
        .from('apps')
        .select(
          `
          *,
          subjects (
            title
          )
        `
        )
        .order('display_name');

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return castJson<CompiledApp[]>(data || []);
    },
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (app: AppInsert) => {
      const { data, error } = await supabase.from('apps').insert(app).select().single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create app');

      // Automatically create a landing page entry for the new app
      const { error: landingPageError } = await supabase.from('app_landing_pages').insert({
        app_id: data.app_id,
        meta_title: `${data.display_name} | Questerix`,
        meta_description: `Learn ${data.display_name} with Questerix.`,
        hero_headline: `Ace ${data.display_name}`,
        hero_subheadline: `Master your subjects with adaptive practice.`,
      });

      if (landingPageError) {
        console.error('Failed to create landing page for new app:', landingPageError);
        // Don't throw — the app was created successfully. The landing page can be created manually.
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] }); // AppContext query
    },
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AppUpdate) => {
      if (!isValidUUID(id)) throw new Error(`Invalid app ID format: ${id}`);
      const { data, error } = await supabase
        .from('apps')
        .update(updates)
        .eq('app_id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(`App with ID ${id} not found for update.`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isValidUUID(id)) throw new Error(`Invalid app ID format: ${id}`);
      const { error } = await supabase.from('apps').delete().eq('app_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useBulkUpdateAppsStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { error } = await supabase.from('apps').update({ is_active }).in('app_id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useBulkDeleteApps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('apps').delete().in('app_id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}
export function useBulkCreateApps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (apps: AppInsert[]) => {
      const { data, error } = await supabase.from('apps').insert(apps).select();
      if (error) throw error;

      if (data && data.length > 0) {
        const landingPages = data.map((app) => ({
          app_id: app.app_id,
          meta_title: `${app.display_name} | Questerix`,
          meta_description: `Learn ${app.display_name} with Questerix.`,
          hero_headline: `Ace ${app.display_name}`,
          hero_subheadline: `Master your subjects with adaptive practice.`,
        }));

        const { error: lpError } = await supabase.from('app_landing_pages').insert(landingPages);
        if (lpError) console.error('Failed to create bulk landing pages:', lpError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useCheckAppSubdomain() {
  const checkSubdomain = async (subdomain: string, app_id?: string) => {
    if (!subdomain) return true;

    let query = supabase
      .from('apps')
      .select('app_id', { count: 'exact', head: true })
      .eq('subdomain', subdomain.trim().toLowerCase());

    if (app_id) {
      query = query.neq('app_id', app_id);
    }

    const { count, error } = await query;
    if (error) return true; // Assume available on error to avoid blocking saves
    return (count ?? 0) === 0;
  };

  return { checkSubdomain };
}

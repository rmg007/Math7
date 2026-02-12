import { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type App = Tables<'apps'>;
export interface CompiledApp extends App {
  subjects: {
    name: string;
  } | null;
  display_name: string;
  subdomain: string;
}
export type AppInsert = TablesInsert<'apps'>;
export type AppUpdate = TablesUpdate<'apps'>;

export function useApps() {
  return useQuery({
    queryKey: ['apps-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(
          `
          *,
          subjects (
            name
          )
        `
        )
        .order('display_name');

      if (error) throw error;
      return (data || []) as unknown as CompiledApp[];
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
      // Bridge cast needed: DB has display_name column but generated types are stale
      const created = data as unknown as CompiledApp;
      await supabase.from('app_landing_pages').insert({
        app_id: created.app_id,
        meta_title: `${created.display_name} | Questerix`,
        meta_description: `Learn ${created.display_name} with Questerix.`,
        hero_headline: `Ace ${created.display_name}`,
        hero_subheadline: `Master your subjects with adaptive practice.`,
      });

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
      const { error } = await supabase.from('apps').delete().eq('app_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

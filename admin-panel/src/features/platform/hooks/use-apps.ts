import { isValidUUID } from '@/features/curriculum/types';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type App = Tables<'apps'>;
export interface CompiledApp extends App {
  subjects: {
    title: string;
  } | null;
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
            title
          )
        `
        )
        .order('display_name');

      if (error) throw error;
      return (data || []) as CompiledApp[];
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

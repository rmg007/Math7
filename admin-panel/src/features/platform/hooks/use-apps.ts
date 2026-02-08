import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type App = Database['public']['Tables']['apps']['Row'];
export type AppInsert = Database['public']['Tables']['apps']['Insert'];
export type AppUpdate = Database['public']['Tables']['apps']['Update'];

export function useApps() {
  return useQuery({
    queryKey: ['apps-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .order('display_name');
      
      if (error) throw error;
      return data as (App & { subjects: { name: string } | null })[];
    },
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (app: AppInsert) => {
      const { data, error } = await supabase
        .from('apps')
        .insert(app)
        .select()
        .single();
      
      if (error) throw error;

      // Automatically create a landing page entry for the new app
      await supabase.from('app_landing_pages').insert({
        app_id: data.app_id,
        meta_title: `${data.display_name} | Questerix`,
        meta_description: `Learn ${data.display_name} with Questerix.`,
        hero_headline: `Ace ${data.display_name}`,
        hero_subheadline: `Master your subjects with adaptive practice.`
      });

      return data as App;
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
      return data as App;
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
      const { error } = await supabase
        .from('apps')
        .delete()
        .eq('app_id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps-admin'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

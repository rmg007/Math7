import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type LandingPage = Database['public']['Tables']['app_landing_pages']['Row'];
export type LandingPageUpdate = Database['public']['Tables']['app_landing_pages']['Update'];

export function useLandingPages() {
  return useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_landing_pages')
        .select(`
          *,
          apps (
            display_name,
            subdomain
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (LandingPage & { apps: { display_name: string; subdomain: string } | null })[];
    },
  });
}

export function useLandingPage(appId: string) {
  return useQuery({
    queryKey: ['landing-page', appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_landing_pages')
        .select('*')
        .eq('app_id', appId)
        .single();
      
      if (error) throw error;
      return data as LandingPage;
    },
    enabled: Boolean(appId),
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & LandingPageUpdate) => {
      const { data, error } = await supabase
        .from('app_landing_pages')
        .update(updates)
        .eq('landing_page_id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });
}

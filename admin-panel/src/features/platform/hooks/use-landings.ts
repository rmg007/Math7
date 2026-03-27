import { Database } from '@questerix/core/types/database';
import { supabase } from '@/lib/supabase';
import { castJson } from '@/lib/type-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type LandingPage = Database['public']['Tables']['app_landing_pages']['Row'];
type LandingPageUpdate = Database['public']['Tables']['app_landing_pages']['Update'];

export type LandingPageWithApp = LandingPage & {
  apps: { display_name: string; subdomain: string } | null;
};

export function useLandingPages() {
  return useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const markName = 'useLandingPages';
      performance.mark(`${markName}:start`);
      const { data, error } = await supabase
        .from('app_landing_pages')
        .select(
          `
          *,
          apps (
            display_name,
            subdomain
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return castJson<LandingPageWithApp[]>(data);
    },
  });
}

export function useLandingPage(appId: string) {
  return useQuery({
    queryKey: ['landing-page', appId],
    queryFn: async () => {
      const markName = 'useLandingPage';
      performance.mark(`${markName}:start`);
      const { data, error } = await supabase
        .from('app_landing_pages')
        .select('*')
        .eq('app_id', appId)
        .single();

      if (error) throw error;

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      return castJson<LandingPage>(data);
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

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      landingPage: Database['public']['Tables']['app_landing_pages']['Insert']
    ) => {
      const { data, error } = await supabase
        .from('app_landing_pages')
        .insert(landingPage)
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

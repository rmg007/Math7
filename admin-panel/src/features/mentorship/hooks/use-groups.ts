import { useApp } from '@/hooks/use-app';
import { Database } from '@questerix/core/types/database';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type Group = Database['public']['Tables']['groups']['Row'];

export function useGroups() {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['groups', currentApp?.app_id],
    queryFn: async () => {
      const markName = 'useGroups';
      performance.mark(`${markName}:start`);
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('app_id', currentApp.app_id)
        .order('created_at', { ascending: false });

      performance.mark(`${markName}:end`);
      performance.measure(markName, `${markName}:start`, `${markName}:end`);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(currentApp?.app_id),
  });
}

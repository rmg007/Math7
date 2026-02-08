import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { useApp } from '@/hooks/use-app'

export type Group = Database['public']['Tables']['groups']['Row']

export function useGroups() {
  const { currentApp } = useApp()

  return useQuery({
    queryKey: ['groups', currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected')

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('app_id', currentApp.app_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: Boolean(currentApp?.app_id)
  })
}

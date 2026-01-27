import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSkills(domainId: string) {
  return useQuery({
    queryKey: ['skills', domainId],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .eq('domain_id', domainId)
         if (error) throw error
         return data
    },
    enabled: !!domainId
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useQuestions(skillId: string | null) {
  return useQuery({
    queryKey: ['questions', skillId],
    queryFn: async () => {
      if (!skillId) return []
      const { data, error } = await supabase
        .from('questions')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*' as any)
        .eq('skill_id', skillId)
        .is('deleted_at', null)
        .order('created_at')
      
      if (error) throw error
      return data
    },
    enabled: !!skillId
  })
}

export function usePublishDomain() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (domainId: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('domains')
                .update({ is_published: true })
                .eq('id', domainId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] })
        }
    })
}

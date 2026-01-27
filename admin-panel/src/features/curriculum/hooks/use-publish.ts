import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePublishCurriculum() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('publish_curriculum');
      if (error) throw error;
      return data;
    },
  });
}

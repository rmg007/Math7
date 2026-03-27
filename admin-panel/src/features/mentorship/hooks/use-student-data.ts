import { useApp } from '@/hooks/use-app';
import { Database } from '@questerix/core/types/database';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type UserMetadata = Database['public']['Tables']['user_metadata']['Row'];
export type UserActivity = Database['public']['Tables']['user_activity']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Attempt = Database['public']['Tables']['attempts']['Row'];

export function useStudentProfile(userId: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['student-profile', userId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const [profileRes, metadataRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .eq('app_id', currentApp.app_id)
          .single(),
        supabase
          .from('user_metadata')
          .select('*')
          .eq('id', userId)
          .eq('app_id', currentApp.app_id)
          .single(),
      ]);

      if (profileRes.error) throw profileRes.error;

      // Metadata might not exist yet if student hasn't logged into schema v14
      return {
        ...profileRes.data,
        metadata: (metadataRes.data as UserMetadata) || null,
      };
    },
    enabled: Boolean(currentApp?.app_id && userId),
  });
}

export function useStudentActivity(userId: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['student-activity', userId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('app_id', currentApp.app_id)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return (data as UserActivity[]) || [];
    },
    enabled: Boolean(currentApp?.app_id && userId),
  });
}

export function useStudentPurchases(userId: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['student-purchases', userId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('app_id', currentApp.app_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Purchase[]) || [];
    },
    enabled: Boolean(currentApp?.app_id && userId),
  });
}

export function useStudentAttempts(userId: string) {
  const { currentApp } = useApp();

  return useQuery({
    queryKey: ['student-attempts', userId, currentApp?.app_id],
    queryFn: async () => {
      if (!currentApp?.app_id) throw new Error('No app selected');

      const { data, error } = await supabase
        .from('attempts')
        .select('id, question_id, is_correct, confidence_rating, difficulty_perception, created_at')
        .eq('user_id', userId)
        .eq('app_id', currentApp.app_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Attempt[]) || [];
    },
    enabled: Boolean(currentApp?.app_id && userId),
  });
}

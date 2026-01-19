import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  department: string | null;
  has_ai_rijbewijs: boolean;
  ai_rijbewijs_obtained_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useUserProfile() {
  const getCurrentUser = useAppStore((state) => state.getCurrentUser);
  const currentUser = getCurrentUser();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!currentUser?.id,
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    hasAiRijbewijs: profile?.has_ai_rijbewijs ?? false,
    aiRijbewijsObtainedAt: profile?.ai_rijbewijs_obtained_at,
  };
}

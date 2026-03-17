import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PlanType = 'shadow_only' | 'routeai' | 'both';

/**
 * Haalt het plan_type op van de organisatie van de ingelogde gebruiker.
 */
export function useOrgPlanType() {
  const { user } = useAuth();

  const { data: planType, isLoading } = useQuery({
    queryKey: ['org-plan-type', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Haal org_id op via profiel, dan plan_type via organizations
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.org_id) return null;

      const { data: org } = await supabase
        .from('organizations')
        .select('plan_type')
        .eq('id', profile.org_id)
        .maybeSingle();

      return (org?.plan_type as PlanType) ?? 'routeai';
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minuten cache
  });

  return {
    planType: planType ?? 'routeai' as PlanType,
    isShadowOnly: planType === 'shadow_only',
    isLoading,
  };
}

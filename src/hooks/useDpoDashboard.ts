// DPO Dashboard hook — samenvat alle queries voor het DPO-overzicht
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useDpoDashboard() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const orgId = profile?.org_id;

  // Openstaande reviews: dpo_review_required = true EN nog geen review_notes
  const { data: pendingReviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['dpo-pending-reviews', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shadow_survey_runs')
        .select('*')
        .eq('org_id', orgId!)
        .eq('dpo_review_required', true)
        .is('review_notes', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Profielen ophalen voor gebruikersnamen bij reviews
  const reviewUserIds = (pendingReviews ?? []).map(r => r.user_id).filter(Boolean) as string[];
  const { data: reviewProfiles } = useQuery({
    queryKey: ['dpo-review-profiles', reviewUserIds],
    queryFn: async () => {
      if (reviewUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', reviewUserIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: reviewUserIds.length > 0,
  });

  // Hoog-risico tools count
  const { data: highRiskCount, isLoading: loadingHighRisk } = useQuery({
    queryKey: ['dpo-high-risk-tools', orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tool_discoveries')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId!)
        .in('application_risk_class', ['high', 'unacceptable']);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // Surveys voltooid count
  const { data: completedCount, isLoading: loadingCompleted } = useQuery({
    queryKey: ['dpo-completed-surveys', orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId!)
        .not('survey_completed_at', 'is', null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // Tool inventaris — alle ontdekte tools
  const { data: toolDiscoveries, isLoading: loadingTools } = useQuery({
    queryKey: ['dpo-tool-discoveries', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_discoveries')
        .select('*')
        .eq('org_id', orgId!);
      if (error) throw error;

      // Sorteer op risico (unacceptable eerst)
      const order = ['unacceptable', 'high', 'limited', 'minimal', null];
      return (data ?? []).sort((a, b) => {
        const ai = order.indexOf(a.application_risk_class);
        const bi = order.indexOf(b.application_risk_class);
        return ai - bi;
      });
    },
    enabled: !!orgId,
  });

  // Profielen voor tool discoveries
  const toolSubmitterIds = [...new Set((toolDiscoveries ?? []).map(t => t.submitted_by).filter(Boolean) as string[])];
  const { data: toolProfiles } = useQuery({
    queryKey: ['dpo-tool-profiles', toolSubmitterIds],
    queryFn: async () => {
      if (toolSubmitterIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', toolSubmitterIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: toolSubmitterIds.length > 0,
  });

  // Risico-distributie voor staafdiagram
  const riskDistribution = (() => {
    const counts: Record<string, number> = { minimal: 0, limited: 0, high: 0, unacceptable: 0 };
    (toolDiscoveries ?? []).forEach(t => {
      const cls = t.application_risk_class;
      if (cls && cls in counts) counts[cls]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  })();

  // Mutatie: review opslaan
  const markReviewed = useMutation({
    mutationFn: async ({ runId, notes }: { runId: string; notes: string }) => {
      const { error } = await supabase
        .from('shadow_survey_runs')
        .update({ review_notes: notes, dpo_review_required: false })
        .eq('id', runId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dpo-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dpo-completed-surveys'] });
    },
  });

  const getProfileName = (profiles: typeof reviewProfiles, userId: string | null) => {
    if (!userId || !profiles) return 'Onbekend';
    const p = profiles.find(p => p.id === userId);
    return p?.full_name || p?.email || 'Onbekend';
  };

  return {
    pendingReviews: pendingReviews ?? [],
    reviewProfiles: reviewProfiles ?? [],
    highRiskCount: highRiskCount ?? 0,
    completedCount: completedCount ?? 0,
    toolDiscoveries: toolDiscoveries ?? [],
    toolProfiles: toolProfiles ?? [],
    riskDistribution,
    markReviewed,
    getProfileName,
    isLoading: loadingReviews || loadingHighRisk || loadingCompleted || loadingTools,
  };
}

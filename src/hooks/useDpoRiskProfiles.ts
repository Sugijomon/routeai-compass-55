// Hook voor DPO Risicoprofielen tab — survey-resultaten, tool-aggregatie, badges en exports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface SurveyRunWithProfile {
  id: string;
  user_id: string | null;
  submitted_at: string | null;
  survey_completed_at: string | null;
  assigned_tier: string | null;
  risk_score: number | null;
  dpo_review_required: boolean | null;
  review_notes: string | null;
  data_classification: string | null;
  primary_use_case: string | null;
  primary_concern: string | null;
  // Joined profile fields
  full_name: string | null;
  email: string | null;
  department: string | null;
}

export interface ToolDiscoveryRow {
  id: string;
  tool_name: string;
  vendor: string | null;
  use_case: string | null;
  use_frequency: string | null;
  data_types_used: string[] | null;
  department: string | null;
  application_risk_class: string | null;
  eu_ai_act_context: string | null;
  survey_run_id: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
}

export interface ToolAggregation {
  tool_name: string;
  category: string | null;
  count: number;
  mostCommonSensitivity: string | null;
  mostCommonRiskClass: string | null;
}

export interface BadgeRow {
  badge_type: string;
  earned_at: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
}

export function useDpoRiskProfiles() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const orgId = profile?.org_id;

  // --- Sectie 1: Overzichtskaarten ---

  // Participatie: totaal uitgenodigd vs scan voltooid
  const { data: participationStats } = useQuery({
    queryKey: ['dpo-rp-participation', orgId],
    queryFn: async () => {
      // Totaal profielen in org (= uitgenodigd)
      const { count: invited } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId!);

      // Voltooide scans
      const { count: completed } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId!)
        .not('survey_completed_at', 'is', null);

      const inv = invited ?? 0;
      const comp = completed ?? 0;
      return {
        invited: inv,
        completed: comp,
        percentage: inv > 0 ? Math.round((comp / inv) * 100) : 0,
      };
    },
    enabled: !!orgId,
  });

  // Risicoverdeling per tier
  const { data: tierDistribution } = useQuery({
    queryKey: ['dpo-rp-tiers', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shadow_survey_runs')
        .select('assigned_tier')
        .eq('org_id', orgId!)
        .not('survey_completed_at', 'is', null);

      const counts: Record<string, number> = { standard: 0, advanced: 0, custom: 0 };
      (data ?? []).forEach((r) => {
        const t = r.assigned_tier;
        if (t && t in counts) counts[t]++;
      });
      return counts;
    },
    enabled: !!orgId,
  });

  // Openstaande reviews
  const { data: pendingReviewCount } = useQuery({
    queryKey: ['dpo-rp-pending', orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId!)
        .eq('dpo_review_required', true)
        .is('review_notes', null);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  // --- Sectie 2: Medewerker-tabel ---

  const { data: surveyRuns, isLoading: loadingRuns } = useQuery({
    queryKey: ['dpo-rp-runs', orgId],
    queryFn: async () => {
      // Haal runs op
      const { data: runs } = await supabase
        .from('shadow_survey_runs')
        .select('*')
        .eq('org_id', orgId!)
        .not('survey_completed_at', 'is', null)
        .order('survey_completed_at', { ascending: false });

      if (!runs || runs.length === 0) return [];

      // Haal profielen op
      const userIds = [...new Set(runs.map((r) => r.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, department')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return runs.map((r): SurveyRunWithProfile => {
        const p = r.user_id ? profileMap.get(r.user_id) : null;
        return {
          id: r.id,
          user_id: r.user_id,
          submitted_at: r.submitted_at,
          survey_completed_at: r.survey_completed_at,
          assigned_tier: r.assigned_tier,
          risk_score: r.risk_score,
          dpo_review_required: r.dpo_review_required,
          review_notes: r.review_notes,
          data_classification: r.data_classification,
          primary_use_case: r.primary_use_case,
          primary_concern: r.primary_concern,
          full_name: p?.full_name ?? null,
          email: p?.email ?? null,
          department: p?.department ?? null,
        };
      });
    },
    enabled: !!orgId,
  });

  // Badges per user
  const { data: allBadges } = useQuery({
    queryKey: ['dpo-rp-badges', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges' as any)
        .select('user_id, badge_type, earned_at')
        .eq('org_id', orgId!);
      return (data as any[] | null) ?? [];
    },
    enabled: !!orgId,
  });

  // Tool discoveries (voor detail-paneel en aggregatie)
  const { data: toolDiscoveries, isLoading: loadingTools } = useQuery({
    queryKey: ['dpo-rp-tools', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tool_discoveries')
        .select('*')
        .eq('org_id', orgId!);
      return (data ?? []) as ToolDiscoveryRow[];
    },
    enabled: !!orgId,
  });

  // --- Sectie 3: Tool-aggregatie ---

  const toolAggregation: ToolAggregation[] = (() => {
    if (!toolDiscoveries) return [];
    const map = new Map<string, ToolDiscoveryRow[]>();
    toolDiscoveries.forEach((t) => {
      const key = t.tool_name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });

    return Array.from(map.entries())
      .map(([_key, items]) => {
        // Meest voorkomende waarde helper
        const mode = (arr: (string | null)[]) => {
          const counts: Record<string, number> = {};
          arr.filter(Boolean).forEach((v) => { counts[v!] = (counts[v!] || 0) + 1; });
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          return sorted[0]?.[0] ?? null;
        };

        return {
          tool_name: items[0].tool_name,
          category: items[0].use_case,
          count: items.length,
          mostCommonSensitivity: mode(items.flatMap((i) => i.data_types_used ?? [])),
          mostCommonRiskClass: mode(items.map((i) => i.application_risk_class)),
        };
      })
      .sort((a, b) => b.count - a.count);
  })();

  // --- Mutaties ---

  const saveReviewNotes = useMutation({
    mutationFn: async ({ runId, notes }: { runId: string; notes: string }) => {
      const { error } = await supabase
        .from('shadow_survey_runs')
        .update({ review_notes: notes })
        .eq('id', runId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dpo-rp-runs'] });
    },
  });

  const setReviewRequired = useMutation({
    mutationFn: async ({ runId, required }: { runId: string; required: boolean }) => {
      const update: Record<string, any> = { dpo_review_required: required };
      if (!required) {
        // Bij "markeer als beoordeeld" — niet de notes wissen
      }
      const { error } = await supabase
        .from('shadow_survey_runs')
        .update(update)
        .eq('id', runId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dpo-rp-runs'] });
      queryClient.invalidateQueries({ queryKey: ['dpo-rp-pending'] });
    },
  });

  // --- Helpers ---

  const getBadgesForUser = (userId: string): string[] => {
    return (allBadges ?? [])
      .filter((b: any) => b.user_id === userId)
      .map((b: any) => b.badge_type as string);
  };

  const getToolsForRun = (surveyRunId: string): ToolDiscoveryRow[] => {
    return (toolDiscoveries ?? []).filter((t) => t.survey_run_id === surveyRunId);
  };

  return {
    // Stats
    participationStats: participationStats ?? { invited: 0, completed: 0, percentage: 0 },
    tierDistribution: tierDistribution ?? { standard: 0, advanced: 0, custom: 0 },
    pendingReviewCount: pendingReviewCount ?? 0,
    // Data
    surveyRuns: surveyRuns ?? [],
    toolDiscoveries: toolDiscoveries ?? [],
    toolAggregation,
    allBadges: allBadges ?? [],
    // Mutations
    saveReviewNotes,
    setReviewRequired,
    // Helpers
    getBadgesForUser,
    getToolsForRun,
    // Loading
    isLoading: loadingRuns || loadingTools,
  };
}

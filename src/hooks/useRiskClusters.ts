// Hook voor V8 risico-clusters via dpo_risk_clusters RPC.
// Past k-anonimiteit toe (k=5 default); kleine clusters worden samengevoegd.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RiskCluster {
  cluster_id: string;
  assigned_tier: "standard" | "priority_review" | "toxic_shadow" | string;
  dominant_trigger: string;
  respondent_count: number;
  avg_shadow: number;
  avg_exposure: number;
  avg_priority: number;
  trigger_codes: string[];
}

export function useRiskClusters(orgId: string | undefined) {
  return useQuery({
    queryKey: ["dpo-risk-clusters", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<RiskCluster[]> => {
      const { data, error } = await supabase.rpc("dpo_risk_clusters", {
        p_org_id: orgId!,
      });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        cluster_id: r.cluster_id,
        assigned_tier: r.assigned_tier,
        dominant_trigger: r.dominant_trigger,
        respondent_count: Number(r.respondent_count ?? 0),
        avg_shadow: Number(r.avg_shadow ?? 0),
        avg_exposure: Number(r.avg_exposure ?? 0),
        avg_priority: Number(r.avg_priority ?? 0),
        trigger_codes: r.trigger_codes ?? [],
      }));
    },
  });
}

// KPI-aggregatie afgeleid uit clusters
export function summarizeClusters(clusters: RiskCluster[]) {
  const total = clusters.reduce((s, c) => s + c.respondent_count, 0);
  const toxic = clusters
    .filter((c) => c.assigned_tier === "toxic_shadow")
    .reduce((s, c) => s + c.respondent_count, 0);
  const priority = clusters
    .filter((c) => c.assigned_tier === "priority_review")
    .reduce((s, c) => s + c.respondent_count, 0);
  const standard = clusters
    .filter((c) => c.assigned_tier === "standard")
    .reduce((s, c) => s + c.respondent_count, 0);
  const avgPriority =
    total > 0
      ? clusters.reduce((s, c) => s + c.avg_priority * c.respondent_count, 0) / total
      : 0;
  const hardTriggers = new Set([
    "prohibited_tool",
    "special_category_data",
    "hr_evaluation_context",
    "agentic_usage",
  ]);
  const hard = clusters
    .filter((c) => c.trigger_codes.some((t) => hardTriggers.has(t)))
    .reduce((s, c) => s + c.respondent_count, 0);
  return { total, toxic, priority, standard, avgPriority, hard };
}

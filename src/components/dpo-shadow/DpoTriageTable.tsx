// DPO Triage Review tabel — toont anonieme cases (één rij per voltooide survey_run).
// Filters in de tabelheader, snelfilters erboven, klik op rij → reviewcase drawer.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FilterX, Shield } from "lucide-react";
import { TIER_META, TRIGGER_META, triggerLabel, tierLabel } from "@/lib/dpoTriggerMeta";
import { SelfReportPill } from "./SelfReportPill";
import type { DpoDrawerData } from "./DpoDrawer";

interface TriageRow {
  case_id: string; // korte hash (geen survey_run_id zichtbaar)
  survey_run_id: string;
  assigned_tier: string;
  shadow_score: number;
  exposure_score: number;
  priority_score: number;
  trigger_codes: string[];
  dominant_trigger: string;
  toxic_combination: boolean;
}

function shortHash(uuid: string): string {
  // Korte deterministische case-ID zonder PII
  return "C-" + uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

interface DpoTriageTableProps {
  orgId: string;
  onRowClick: (data: Extract<DpoDrawerData, { mode: "review" }>) => void;
}

export function DpoTriageTable({ orgId, onRowClick }: DpoTriageTableProps) {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["dpo-triage", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<TriageRow[]> => {
      // Query 1: voltooide runs voor deze org
      const { data: runs, error: runsErr } = await supabase
        .from("survey_run")
        .select("id, completed_at")
        .eq("org_id", orgId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });
      if (runsErr) throw runsErr;
      if (!runs?.length) return [];

      const runIds = runs.map((r) => r.id);

      // Query 2: risk_result voor die runs
      const { data: results, error: resErr } = await supabase
        .from("risk_result")
        .select(
          "survey_run_id, assigned_tier, person_score, highest_priority_score, review_trigger_codes, toxic_combination",
        )
        .in("survey_run_id", runIds);
      if (resErr) throw resErr;

      // Query 3: max shadow/exposure per run uit risk_result_tool
      const { data: tools, error: toolsErr } = await supabase
        .from("risk_result_tool")
        .select("survey_run_id, shadow_score, exposure_score")
        .in("survey_run_id", runIds);
      if (toolsErr) throw toolsErr;

      const byRun = new Map<string, { maxShadow: number; maxExposure: number }>();
      (tools ?? []).forEach((t) => {
        const cur = byRun.get(t.survey_run_id) ?? { maxShadow: 0, maxExposure: 0 };
        cur.maxShadow = Math.max(cur.maxShadow, Number(t.shadow_score));
        cur.maxExposure = Math.max(cur.maxExposure, Number(t.exposure_score));
        byRun.set(t.survey_run_id, cur);
      });

      const HARD = ["prohibited_tool", "special_category_data", "hr_evaluation_context", "agentic_usage"];

      return (results ?? [])
        .filter((r) => r.assigned_tier !== "standard")
        .map((r): TriageRow => {
          const triggers = r.review_trigger_codes ?? [];
          const dominant = triggers.find((t: string) => HARD.includes(t)) ?? triggers[0] ?? "none";
          const m = byRun.get(r.survey_run_id) ?? { maxShadow: 0, maxExposure: 0 };
          return {
            case_id: shortHash(r.survey_run_id),
            survey_run_id: r.survey_run_id,
            assigned_tier: r.assigned_tier,
            shadow_score: m.maxShadow,
            exposure_score: m.maxExposure,
            priority_score: Number(r.highest_priority_score ?? r.person_score ?? 0),
            trigger_codes: triggers,
            dominant_trigger: dominant,
            toxic_combination: r.toxic_combination,
          };
        });
    },
  });

  const [quickFilter, setQuickFilter] = useState<"all" | "high" | "priority_review" | "toxic_combo">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [triggerFilter, setTriggerFilter] = useState<string>("all");

  const allTriggers = useMemo(
    () => Array.from(new Set((rows ?? []).flatMap((r) => r.trigger_codes))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    let list = rows ?? [];
    if (quickFilter === "high")
      list = list.filter((r) => r.assigned_tier === "toxic_shadow" || r.priority_score >= 50);
    if (quickFilter === "priority_review") list = list.filter((r) => r.assigned_tier === "priority_review");
    if (quickFilter === "toxic_combo") list = list.filter((r) => r.toxic_combination);
    if (tierFilter !== "all") list = list.filter((r) => r.assigned_tier === tierFilter);
    if (triggerFilter !== "all") list = list.filter((r) => r.trigger_codes.includes(triggerFilter));
    return list.sort((a, b) => b.priority_score - a.priority_score);
  }, [rows, quickFilter, tierFilter, triggerFilter]);

  const reset = () => {
    setQuickFilter("all");
    setTierFilter("all");
    setTriggerFilter("all");
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold">DPO Triage Review</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Selecteer een prioriteit om de triage te starten. Elke case vereist menselijke
              validatie.
            </p>
          </div>
        </div>
        <SelfReportPill />
      </div>

      {/* Snelfilters */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-6 py-3">
        <span className="mr-1 text-[11px] font-bold text-muted-foreground">Snelfilter:</span>
        {(
          [
            ["all", "Alle tiers"],
            ["high", "Hoog risico"],
            ["priority_review", "Review vereist"],
            ["toxic_combo", "Toxic combos"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={quickFilter === key ? "default" : "outline"}
            onClick={() => setQuickFilter(key)}
            className="h-8 rounded-full px-3 text-xs"
          >
            {label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={reset} className="ml-auto h-8 text-xs">
          <FilterX className="mr-1 h-3.5 w-3.5" />
          Filters wissen
        </Button>
      </div>

      <div className="max-h-[440px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted/40 text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Case-ID</th>
              <th className="px-4 py-3">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs font-semibold"
                >
                  <option value="all">Alle tiers</option>
                  {Object.keys(TIER_META).map((t) => (
                    <option key={t} value={t}>
                      {tierLabel(t)}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Shadow</th>
              <th className="px-4 py-3 text-right font-semibold">Exposure</th>
              <th className="px-4 py-3 text-right font-semibold">Priority</th>
              <th className="px-4 py-3">
                <select
                  value={triggerFilter}
                  onChange={(e) => setTriggerFilter(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs font-semibold"
                >
                  <option value="all">Alle triggers</option>
                  {allTriggers.map((t) => (
                    <option key={t} value={t}>
                      {triggerLabel(t)}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 text-center font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Laden…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Geen open reviews binnen deze filterselectie.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const tier = TIER_META[r.assigned_tier];
              const triggerMeta = TRIGGER_META[r.dominant_trigger];
              return (
                <tr
                  key={r.survey_run_id}
                  onClick={() =>
                    onRowClick({
                      mode: "review",
                      caseId: r.case_id,
                      assignedTier: r.assigned_tier,
                      shadowScore: r.shadow_score,
                      exposureScore: r.exposure_score,
                      priorityScore: r.priority_score,
                      triggerCodes: r.trigger_codes,
                    })
                  }
                  className="cursor-pointer border-t transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold">{r.case_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    {tier && (
                      <Badge className={`${tier.bg} ${tier.text} hover:${tier.bg}`}>
                        {tier.label}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{r.shadow_score.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{r.exposure_score.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                    {r.priority_score.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {triggerMeta ? (
                      <Badge variant="outline" className="text-[10px]">
                        {triggerMeta.label}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Open detail">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

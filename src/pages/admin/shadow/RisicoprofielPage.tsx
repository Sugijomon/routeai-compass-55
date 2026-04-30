import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRiskClusters } from "@/hooks/useRiskClusters";
import { RiskKpiRow } from "@/components/dpo-shadow/v2/RiskKpiRow";
import { PriorityMatrixV2 } from "@/components/dpo-shadow/v2/PriorityMatrixV2";
import { RiskRadarV2 } from "@/components/dpo-shadow/v2/RiskRadarV2";
import { RiskAmplifiersV2 } from "@/components/dpo-shadow/v2/RiskAmplifiersV2";
import { DpoTriageReview } from "@/components/dpo-shadow/v2/DpoTriageReview";
import { RiskDrawer, type DrawerMode } from "@/components/dpo-shadow/v2/RiskDrawer";
import { MOCK_CLUSTERS, type RiskClusterRow } from "@/components/dpo-shadow/v2/riskFixture";
import { ScatterChart, Radar, Bolt, AlertCircle } from "@/components/dpo-shadow/v2/icons";

/**
 * Risicoprofiel — DPO Shadow AI dashboard.
 * Visueel 1:1 op basis van HTML-referentie 03_Risicoprofiel_V9.2.
 * Gebruikt mock-fixture zolang er geen voltooide V8-runs zijn.
 */
export default function RisicoprofielPage() {
  const { profile } = useUserProfile();
  const { data: liveClusters = [], isLoading } = useRiskClusters(profile?.org_id);

  // Voor nu: altijd de fixture tonen om de visuele structuur compleet te houden.
  // Zodra `liveClusters` data bevat, mappen we die op het fixture-shape.
  const clusters: RiskClusterRow[] = useMemo(() => {
    if (liveClusters.length === 0) return MOCK_CLUSTERS;
    // Minimaal mappen — UI-velden zoals dept/tool/use_case zijn nog niet beschikbaar
    // in `dpo_risk_clusters`; daarom blijven we bij MOCK_CLUSTERS tot V8 die levert.
    return MOCK_CLUSTERS;
  }, [liveClusters]);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>("cluster");
  const [drawerCluster, setDrawerCluster] = useState<RiskClusterRow | null>(null);

  const openCluster = (c: RiskClusterRow) => {
    setDrawerMode("cluster");
    setDrawerCluster(c);
  };
  const openReview = (c: RiskClusterRow) => {
    setDrawerMode("review");
    setDrawerCluster(c);
  };

  return (
    <AppLayout>
      <div className="bg-[#f7f9fb] text-[#1a2028]">
        <div className="space-y-8 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-3xl font-extrabold tracking-tight">Risicoprofiel</h2>
              <p className="max-w-4xl text-sm font-medium text-[#566166]">
                Triage op basis van V8.1 scoring: shadow-score, exposure-score, priority-score en
                review-triggers. Individuele medewerkers worden niet getoond; clusters met kleine aantallen
                worden samengevoegd.
              </p>
            </div>
            {isLoading && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                Live data wordt geladen…
              </span>
            )}
          </div>

          <RiskKpiRow clusters={clusters} />

          <div className="grid grid-cols-1 gap-6">
            {/* Priority matrix */}
            <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <ScatterChart className="mt-0.5 shrink-0 text-[#0369a1]" size={26} />
                  <div>
                    <h3 className="text-xl font-bold">Priority matrix</h3>
                    <p className="mt-0.5 text-sm text-[#566166]">
                      Shadow-score (Y) × Exposure-score (X). Focus op de Toxic Zone (rechtsboven). Klik
                      op een bol voor details.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <PriorityMatrixV2 clusters={clusters} onBubbleClick={openCluster} />
              </div>
            </section>

            {/* Radar */}
            <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="flex items-start gap-3">
                  <Radar className="mt-0.5 text-[#0369a1]" size={26} />
                  <div>
                    <h3 className="text-xl font-bold">Risicoprofiel radar</h3>
                    <p className="mt-0.5 text-sm text-[#566166]">
                      Welke risicotypes domineren de open reviewdruk?
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 md:inline-flex">
                  0–100 = aandeel reviewdruk
                </span>
              </div>
              <div className="px-6 pb-6">
                <RiskRadarV2 clusters={clusters} />
              </div>
            </section>

            {/* Amplifiers */}
            <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
              <div className="flex items-start gap-3 px-6 pt-6 pb-4">
                <Bolt className="mt-0.5 text-[#C06000]" size={26} />
                <div>
                  <h3 className="text-xl font-bold">Risicoversterkers</h3>
                  <p className="mt-0.5 text-sm text-[#566166]">
                    Welke patronen verklaren de reviewdruk en verhogen de governance-prioriteit?
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <RiskAmplifiersV2 clusters={clusters} />
              </div>
            </section>
          </div>

          {/* DPO Triage Review */}
          <DpoTriageReview clusters={clusters} onRowClick={openReview} />

          <footer className="mt-auto pb-4 pt-8">
            <div className="border-t border-slate-200/60 pt-4">
              <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-400">
                <AlertCircle size={14} className="opacity-70" />
                Deze signalen zijn indicatief van aard en op basis van zelfrapportage. Menselijk oordeel
                blijft leidend.
              </p>
            </div>
          </footer>

          <RiskDrawer
            open={!!drawerCluster}
            onOpenChange={(o) => !o && setDrawerCluster(null)}
            cluster={drawerCluster}
            mode={drawerMode}
          />
        </div>
      </div>
    </AppLayout>
  );
}

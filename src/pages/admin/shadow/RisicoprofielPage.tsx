import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRiskClusters, summarizeClusters } from "@/hooks/useRiskClusters";
import { KpiCard } from "@/components/dpo-shadow/KpiCard";
import { PriorityMatrix } from "@/components/dpo-shadow/PriorityMatrix";
import { RiskRadar } from "@/components/dpo-shadow/RiskRadar";
import { RiskAmplifiers } from "@/components/dpo-shadow/RiskAmplifiers";
import { DpoTriageTable } from "@/components/dpo-shadow/DpoTriageTable";
import { DpoDrawer, type DpoDrawerData } from "@/components/dpo-shadow/DpoDrawer";
import { DashboardFooter } from "@/components/dpo-shadow/DashboardFooter";
import { ScatterChart, Radar, Bolt, Shield } from "lucide-react";

export default function RisicoprofielPage() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;
  const { data: clusters = [], isLoading } = useRiskClusters(orgId);
  const [drawerData, setDrawerData] = useState<DpoDrawerData | null>(null);

  const s = summarizeClusters(clusters);

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        <PageHeader
          title="Risicoprofiel"
          subtitle="Triage op basis van V8.1-scoring: shadow-score, exposure-score, priority-score en review-triggers. Individuele medewerkers worden niet getoond; clusters met minder dan 5 respondenten worden samengevoegd."
        />

        {/* KPI's */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <KpiCard label="Respondenten" value={s.total} sub="voltooide scans" pct={Math.min(s.total, 100)} />
          <KpiCard label="Toxic shadow" value={s.toxic} tone="red" sub="shadow >50 én exposure >50" pct={s.total ? (s.toxic / s.total) * 100 : 0} />
          <KpiCard label="Priority review" value={s.priority} tone="amber" sub="boven priority-drempel" pct={s.total ? (s.priority / s.total) * 100 : 0} />
          <KpiCard label="Gem. priority" value={s.avgPriority.toFixed(1)} tone="amber" sub="gewogen naar clusteromvang" pct={s.avgPriority} />
          <KpiCard label="Hard triggers" value={s.hard} tone="blue" sub="juridisch of technisch hard signaal" pct={s.total ? (s.hard / s.total) * 100 : 0} />
        </div>

        {/* Priority matrix */}
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start gap-3 px-6 pt-6 pb-4">
            <ScatterChart className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">Priority matrix</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Shadow-score (Y) × exposure-score (X). Klik op een bol voor clusterdetail.
              </p>
            </div>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Laden…</p>
            ) : clusters.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nog geen voltooide scans met scoring.
              </p>
            ) : (
              <PriorityMatrix
                clusters={clusters}
                onClusterClick={(c) => setDrawerData({ mode: "cluster", cluster: c })}
              />
            )}
          </div>
        </section>

        {/* Radar */}
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start gap-3 px-6 pt-6 pb-4">
            <Radar className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">Risicoprofiel radar</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Welke risicotypes domineren de open reviewdruk?
              </p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <RiskRadar clusters={clusters} />
          </div>
        </section>

        {/* Versterkers */}
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start gap-3 px-6 pt-6 pb-4">
            <Bolt className="mt-0.5 h-6 w-6 text-amber-600" />
            <div>
              <h3 className="text-lg font-bold">Risicoversterkers</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Welke patronen verklaren de reviewdruk en verhogen de governance-prioriteit?
              </p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <RiskAmplifiers clusters={clusters} />
          </div>
        </section>

        {/* DPO Triage */}
        {orgId && <DpoTriageTable orgId={orgId} onRowClick={(d) => setDrawerData(d)} />}

        <DpoDrawer
          open={!!drawerData}
          onOpenChange={(o) => !o && setDrawerData(null)}
          data={drawerData}
        />

        <DashboardFooter />
      </div>
    </AppLayout>
  );
}

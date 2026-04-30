// KPI-rij voor Risicoprofiel — 5 kaarten met score-track, hex-kleuren 1:1 uit HTML.
import { RiskClusterRow, formatScore } from "./riskFixture";

interface Props {
  clusters: RiskClusterRow[];
}

interface Kpi {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  pct: number;
}

export function RiskKpiRow({ clusters }: Props) {
  const total = clusters.reduce((s, c) => s + c.n, 0) || 1;
  const reviews = clusters.filter((c) => c.assigned_tier !== "standard").reduce((s, c) => s + c.n, 0);
  const toxic = clusters.filter((c) => c.assigned_tier === "toxic_shadow").reduce((s, c) => s + c.n, 0);
  const avgPriority = clusters.reduce((s, c) => s + c.priority * c.n, 0) / total;
  const hard = clusters
    .filter((c) =>
      c.triggers.some((t) =>
        ["prohibited_tool", "special_category_data", "hr_evaluation_context", "agentic_usage"].includes(t),
      ),
    )
    .reduce((s, c) => s + c.n, 0);
  const dataHigh = clusters
    .filter((c) => ["gevoelig_persoonsgegeven", "klantdata", "financiele_data"].includes(c.data))
    .reduce((s, c) => s + c.n, 0);

  const kpis: Kpi[] = [
    { label: "DPO reviews", value: reviews, sub: `van ${total} respondenten`, color: "#b4292d", pct: Math.round((reviews / total) * 100) },
    { label: "Toxic shadow", value: toxic, sub: "shadow >50 en exposure >50", color: "#b4292d", pct: Math.round((toxic / total) * 100) },
    { label: "Gem. priority", value: formatScore(avgPriority), sub: "gewogen naar clusteromvang", color: "#C06000", pct: Math.round(avgPriority) },
    { label: "Hard triggers", value: hard, sub: "juridisch of technisch hard signaal", color: "#0E5A75", pct: Math.round((hard / total) * 100) },
    { label: "Gevoelige data", value: `${Math.round((dataHigh / total) * 100)}%`, sub: "hoogste data_boost in run", color: "#0369a1", pct: Math.round((dataHigh / total) * 100) },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-slate-200/60 bg-white p-5 text-center shadow-[0_8px_24px_rgba(26,32,44,.06)]"
          >
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-tight text-slate-500">
              {k.label}
            </p>
            <h3 className="font-headline text-4xl font-extrabold tabular-nums" style={{ color: k.color }}>
              {k.value}
            </h3>
            <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(k.pct, 100)}%`, background: k.color }}
              />
            </div>
            <p className="mt-1 flex min-h-[2.5em] items-start justify-center text-center text-[10px] text-slate-500">
              {k.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

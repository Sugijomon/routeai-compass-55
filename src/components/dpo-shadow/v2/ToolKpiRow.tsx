// KPI-rij voor Tool Inventaris — 5 kaarten met score-track, hex-kleuren 1:1.
import { ToolRow } from "./toolFixture";

interface Props {
  tools: ToolRow[];
}

interface Kpi {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  pct: number;
}

export function ToolKpiRow({ tools }: Props) {
  const total = tools.length || 1;
  const totalReports = tools.reduce((s, t) => s + t.reports, 0) || 1;
  const prohibited = tools.filter((t) => t.policy === "not_approved").length;
  const high = tools.filter((t) => t.riskClass === "high" || t.riskClass === "unacceptable").length;
  const privateAcc = tools.filter((t) =>
    ["prive_gratis", "prive_betaald", "beide"].includes(t.accountMix),
  ).length;
  const sensitiveReports = tools.reduce(
    (s, t) => s + (t.byData.find((d) => d.data === "gevoelig")?.n ?? 0),
    0,
  );
  const flagged = tools.filter((t) => t.euAiActFlag).length;

  const kpis: Kpi[] = [
    {
      label: "Tools in scan",
      value: total,
      sub: `${totalReports} meldingen totaal`,
      color: "#0E5A75",
      pct: 100,
    },
    {
      label: "EU AI Act-flag",
      value: flagged,
      sub: "indicatieve Annex III / Art. 5",
      color: "#b4292d",
      pct: Math.round((flagged / total) * 100),
    },
    {
      label: "Niet goedgekeurd",
      value: prohibited,
      sub: "buiten huidig beleid",
      color: "#b4292d",
      pct: Math.round((prohibited / total) * 100),
    },
    {
      label: "Hoog risico",
      value: high,
      sub: "high + unacceptable",
      color: "#C06000",
      pct: Math.round((high / total) * 100),
    },
    {
      label: "Niet-zakelijk account",
      value: privateAcc,
      sub: `${Math.round((sensitiveReports / totalReports) * 100)}% gevoelige data`,
      color: "#0369a1",
      pct: Math.round((privateAcc / total) * 100),
    },
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

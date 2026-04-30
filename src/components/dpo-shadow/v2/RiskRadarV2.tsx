// SVG radar — 6 risicotypes berekend uit clusters + zijkaartjes met counts.
import { RiskClusterRow, isOpenReview } from "./riskFixture";

interface Props {
  clusters: RiskClusterRow[];
}

interface RiskType {
  label: string;
  full: string;
  color: string;
  count: number;
  pct: number;
}

function compute(clusters: RiskClusterRow[]): RiskType[] {
  const open = clusters.filter(isOpenReview);
  const totalN = open.reduce((s, c) => s + c.n, 0) || 1;
  const countBy = (pred: (c: RiskClusterRow) => boolean) =>
    open.filter(pred).reduce((s, c) => s + c.n, 0);
  const items = [
    { label: "Verboden", full: "Verboden tool", color: "#b4292d", count: countBy((c) => c.triggers.includes("prohibited_tool") || c.shadow >= 80) },
    { label: "Data", full: "Gevoelige data", color: "#0369a1", count: countBy((c) => c.triggers.includes("special_category_data") || ["gevoelig_persoonsgegeven", "klantdata", "financiele_data", "juridische_documenten"].includes(c.data)) },
    { label: "Juridisch", full: "HR / juridische context", color: "#475569", count: countBy((c) => c.triggers.includes("hr_evaluation_context") || c.context.toLowerCase().includes("hr") || c.context.toLowerCase().includes("juridisch")) },
    { label: "Autonoom", full: "Autonome AI", color: "#be123c", count: countBy((c) => c.triggers.includes("agentic_usage")) },
    { label: "Extensie", full: "Browserextensie", color: "#0e7490", count: countBy((c) => c.triggers.includes("extension_unmanaged")) },
    { label: "Privé", full: "Privéaccount", color: "#C06000", count: countBy((c) => ["prive_gratis", "prive_betaald", "beide"].includes(c.account)) },
  ];
  return items.map((it) => ({ ...it, pct: Math.round((it.count / totalN) * 100) }));
}

export function RiskRadarV2({ clusters }: Props) {
  const items = compute(clusters);
  const cx = 190;
  const cy = 170;
  const radius = 118;
  const angleFor = (i: number) => ((-90 + (360 / items.length) * i) * Math.PI) / 180;
  const point = (i: number, value: number): [number, number] => {
    const a = angleFor(i);
    const r = (radius * Math.max(0, Math.min(value, 100))) / 100;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const polygon = items.map((it, i) => point(i, it.pct).join(",")).join(" ");

  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[420px_1fr]">
      <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <svg viewBox="0 0 380 340" className="w-full max-w-[380px]" role="img" aria-label="Risicoprofiel radar">
          {[25, 50, 75, 100].map((lvl) => {
            const pts = items.map((_, i) => point(i, lvl).join(",")).join(" ");
            return <polygon key={lvl} points={pts} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
          })}
          {items.map((it, i) => {
            const [x, y] = point(i, 100);
            const a = angleFor(i);
            const lx = cx + Math.cos(a) * (radius + 42);
            const ly = cy + Math.sin(a) * (radius + 30);
            const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
            return (
              <g key={it.label}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={lx} y={ly} textAnchor={anchor} className="fill-slate-500" style={{ fontSize: 11, fontWeight: 800 }}>
                  {it.label}
                </text>
                <text x={lx} y={ly + 14} textAnchor={anchor} style={{ fontSize: 10, fontWeight: 800, fill: it.color }}>
                  {it.pct}%
                </text>
              </g>
            );
          })}
          <polygon points={polygon} fill="rgba(14,90,117,0.18)" stroke="#0E5A75" strokeWidth="3" />
          {items.map((it, i) => {
            const [x, y] = point(i, it.pct);
            return <circle key={it.label} cx={x} cy={y} r="5" fill={it.color} stroke="#fff" strokeWidth="2" />;
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-extrabold text-slate-700">{it.full}</p>
                  <p className="font-mono text-[12px] font-extrabold" style={{ color: it.color }}>
                    {it.pct}%
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {it.count} respondenten in open reviewdruk
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

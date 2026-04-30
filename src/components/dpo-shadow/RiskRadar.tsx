// Risicoprofiel radar — vaste 6 risicotypes, dynamisch gevuld op basis van clusters.
import type { RiskCluster } from "@/hooks/useRiskClusters";

interface RiskRadarProps {
  clusters: RiskCluster[];
}

interface RiskType {
  key: string;
  label: string;
  full: string;
  color: string;
  matches: (c: RiskCluster) => boolean;
}

const RISK_TYPES: RiskType[] = [
  {
    key: "prohibited",
    label: "Verboden",
    full: "Verboden tool",
    color: "hsl(var(--destructive))",
    matches: (c) => c.trigger_codes.includes("prohibited_tool") || c.avg_shadow >= 80,
  },
  {
    key: "data",
    label: "Data",
    full: "Gevoelige data",
    color: "hsl(217 91% 40%)",
    matches: (c) => c.trigger_codes.includes("special_category_data"),
  },
  {
    key: "hr",
    label: "HR/Juridisch",
    full: "HR / juridische context",
    color: "hsl(220 9% 35%)",
    matches: (c) => c.trigger_codes.includes("hr_evaluation_context"),
  },
  {
    key: "agentic",
    label: "Autonoom",
    full: "Autonome AI",
    color: "hsl(350 80% 45%)",
    matches: (c) => c.trigger_codes.includes("agentic_usage"),
  },
  {
    key: "extension",
    label: "Extensie",
    full: "Browserextensie",
    color: "hsl(190 80% 35%)",
    matches: (c) => c.trigger_codes.includes("extension_unmanaged"),
  },
  {
    key: "private",
    label: "Privé",
    full: "Privéaccount",
    color: "hsl(28 90% 45%)",
    matches: (c) => c.trigger_codes.includes("automation_unmanaged"),
  },
];

function isOpenReview(c: RiskCluster): boolean {
  return c.assigned_tier !== "standard";
}

export function RiskRadar({ clusters }: RiskRadarProps) {
  const open = clusters.filter(isOpenReview);
  const totalN = open.reduce((s, c) => s + c.respondent_count, 0) || 1;

  const items = RISK_TYPES.map((t) => {
    const count = open
      .filter((c) => t.matches(c))
      .reduce((s, c) => s + c.respondent_count, 0);
    return { ...t, count, pct: Math.round((count / totalN) * 100) };
  });

  const cx = 190;
  const cy = 170;
  const radius = 118;
  const angleFor = (i: number) =>
    ((-90 + (360 / items.length) * i) * Math.PI) / 180;
  const point = (i: number, value: number): [number, number] => {
    const a = angleFor(i);
    const r = (radius * Math.max(0, Math.min(value, 100))) / 100;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const polygon = items.map((it, i) => point(i, it.pct).join(",")).join(" ");
  const rings = [25, 50, 75, 100].map((lvl) => {
    const pts = items.map((_, i) => point(i, lvl).join(",")).join(" ");
    return (
      <polygon
        key={lvl}
        points={pts}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-center">
      <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-center">
        <svg viewBox="0 0 380 340" className="w-full max-w-[380px]" role="img" aria-label="Risicoprofiel radar">
          {rings}
          {items.map((it, i) => {
            const [x, y] = point(i, 100);
            const a = angleFor(i);
            const lx = cx + Math.cos(a) * (radius + 42);
            const ly = cy + Math.sin(a) * (radius + 30);
            const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";
            return (
              <g key={it.key}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />
                <text x={lx} y={ly} textAnchor={anchor} className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 800 }}>
                  {it.label}
                </text>
                <text x={lx} y={ly + 14} textAnchor={anchor} style={{ fontSize: 10, fontWeight: 800, fill: it.color }}>
                  {it.pct}%
                </text>
              </g>
            );
          })}
          <polygon
            points={polygon}
            fill="hsl(var(--primary) / 0.18)"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
          />
          {items.map((it, i) => {
            const [x, y] = point(i, it.pct);
            return (
              <circle
                key={it.key}
                cx={x}
                cy={y}
                r="5"
                fill={it.color}
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.key} className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-extrabold">{it.full}</p>
              <p className="font-mono text-[12px] font-extrabold" style={{ color: it.color }}>
                {it.count}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(it.pct, 100)}%`, background: it.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

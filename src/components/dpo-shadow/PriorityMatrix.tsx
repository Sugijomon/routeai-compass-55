// Priority matrix met shadow (Y) × exposure (X). 4×4 grid met bollen per cluster.
// Custom SVG/HTML — geen externe lib nodig.
import { useMemo } from "react";
import type { RiskCluster } from "@/hooks/useRiskClusters";

interface PriorityMatrixProps {
  clusters: RiskCluster[];
  onClusterClick: (cluster: RiskCluster) => void;
}

const Y_LABELS = [
  { label: "Verboden", value: "80" },
  { label: "Beperkt", value: "40" },
  { label: "Beoordelen", value: "20" },
  { label: "Toegestaan", value: "0" },
];
const X_LABELS = [
  { label: "Laag", range: "0-24" },
  { label: "Verhoogd", range: "25-49" },
  { label: "Hoog", range: "50-74" },
  { label: "Kritiek", range: "75-100" },
];

function shadowBand(score: number): number {
  if (score >= 80) return 0;
  if (score >= 40) return 1;
  if (score >= 20) return 2;
  return 3;
}
function exposureBand(score: number): number {
  if (score >= 75) return 3;
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}
function cellClass(row: number, col: number): string {
  if (row <= 1 && col >= 2) return "bg-red-50";
  if (row <= 2 && col >= 2) return "bg-sky-50";
  if (row <= 1 && col <= 1) return "bg-amber-50";
  return "bg-green-50";
}
function tierColor(tier: string): string {
  if (tier === "toxic_shadow") return "hsl(var(--destructive))";
  if (tier === "priority_review") return "hsl(35 92% 50%)";
  return "hsl(142 70% 35%)";
}

export function PriorityMatrix({ clusters, onClusterClick }: PriorityMatrixProps) {
  const cells = useMemo(() => {
    const grid: RiskCluster[][][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => []),
    );
    clusters.forEach((c) => {
      const r = shadowBand(c.avg_shadow);
      const col = exposureBand(c.avg_exposure);
      grid[r][col].push(c);
    });
    return grid;
  }, [clusters]);

  const counts = clusters.map((c) => c.respondent_count);
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  const bubbleSize = (n: number) => {
    if (max === min) return 38;
    return Math.round(24 + ((n - min) / (max - min)) * 36);
  };

  return (
    <div>
      {/* X-as labels */}
      <div className="ml-[86px] mb-2 grid grid-cols-4 gap-1">
        {X_LABELS.map((x) => (
          <div key={x.label} className="text-center">
            <div className="text-[10px] font-extrabold text-muted-foreground">{x.label}</div>
            <div className="text-[9px] font-semibold text-muted-foreground/70">{x.range}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
        {/* Y-as labels */}
        <div className="grid grid-rows-4 gap-1">
          {Y_LABELS.map((y) => (
            <div
              key={y.label}
              className="flex items-center justify-end pr-2 text-right text-[10px] font-extrabold leading-tight text-muted-foreground"
            >
              {y.label}
              <br />
              {y.value}
            </div>
          ))}
        </div>

        {/* 4×4 grid */}
        <div className="grid grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {cells.flatMap((row, r) =>
            row.map((items, c) => (
              <div
                key={`${r}-${c}`}
                className={`relative flex min-h-[80px] flex-wrap items-center justify-center gap-1.5 p-2 ${cellClass(
                  r,
                  c,
                )}`}
              >
                {items.map((cluster) => {
                  const size = bubbleSize(cluster.respondent_count);
                  return (
                    <button
                      key={cluster.cluster_id}
                      type="button"
                      onClick={() => onClusterClick(cluster)}
                      className="flex items-center justify-center rounded-full border-2 border-card font-mono text-[10px] font-black text-white shadow-md transition-transform hover:scale-110"
                      style={{
                        width: size,
                        height: size,
                        background: tierColor(cluster.assigned_tier),
                      }}
                      title={`${cluster.respondent_count} respondenten · ${cluster.dominant_trigger}`}
                    >
                      {cluster.respondent_count}
                    </button>
                  );
                })}
              </div>
            )),
          )}
        </div>
      </div>

      <div className="ml-[86px] mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: tierColor("toxic_shadow") }} />
          toxic_shadow
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: tierColor("priority_review") }} />
          priority_review
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: tierColor("standard") }} />
          standard
        </span>
      </div>
    </div>
  );
}

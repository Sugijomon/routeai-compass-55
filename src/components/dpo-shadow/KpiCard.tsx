// Herbruikbare KPI-kaart voor DPO Shadow AI dashboards.
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  pct?: number; // 0-100, voor de progress-balk
  tone?: "default" | "amber" | "red" | "green" | "blue";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  amber: "text-amber-600",
  red: "text-red-600",
  green: "text-green-700",
  blue: "text-sky-700",
};

const TONE_BG: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-muted-foreground",
  amber: "bg-amber-500",
  red: "bg-red-500",
  green: "bg-green-600",
  blue: "bg-sky-600",
};

export function KpiCard({ label, value, sub, pct, tone = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-tight text-muted-foreground mb-1">
        {label}
      </p>
      <h3 className={cn("text-3xl font-extrabold tabular-nums", TONE_CLASSES[tone])}>
        {value}
      </h3>
      {typeof pct === "number" && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", TONE_BG[tone])}
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
          />
        </div>
      )}
      {sub && (
        <p className="mt-1 min-h-[2.5em] text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

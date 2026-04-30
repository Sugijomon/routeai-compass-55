// Top vakgebieden — horizontale stacked bar per vakgebied,
// gestapeld op risk class. Geeft snel beeld waar het zwaartepunt zit.
import { useMemo } from "react";
import { ToolRow, RISK_CLASS_META, RiskClass, shortDept } from "./toolFixture";

interface Props {
  tools: ToolRow[];
}

const RISK_ORDER: RiskClass[] = ["unacceptable", "high", "limited", "minimal"];

export function TopDeptChart({ tools }: Props) {
  const data = useMemo(() => {
    const acc: Record<string, Record<RiskClass, number>> = {};
    for (const t of tools) {
      for (const d of t.byDept) {
        acc[d.dept] = acc[d.dept] ?? { unacceptable: 0, high: 0, limited: 0, minimal: 0 };
        acc[d.dept][t.riskClass] += d.n;
      }
    }
    const rows = Object.entries(acc).map(([dept, classes]) => ({
      dept,
      classes,
      total: classes.unacceptable + classes.high + classes.limited + classes.minimal,
    }));
    rows.sort((a, b) => b.total - a.total);
    return rows.slice(0, 8);
  }, [tools]);

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-2.5">
      {data.map((row) => (
        <div key={row.dept} className="flex items-center gap-3">
          <span className="w-44 shrink-0 truncate text-[11.5px] font-bold text-slate-700">
            {shortDept(row.dept)}
          </span>
          <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
            {RISK_ORDER.map((rc) => {
              const v = row.classes[rc];
              const w = (v / max) * 100;
              if (v === 0) return null;
              return (
                <div
                  key={rc}
                  title={`${RISK_CLASS_META[rc].label}: ${v}`}
                  style={{ width: `${w}%`, background: RISK_CLASS_META[rc].dot }}
                  className="grid place-items-center font-mono text-[9.5px] font-extrabold text-white/95"
                >
                  {w >= 8 ? v : ""}
                </div>
              );
            })}
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-[11px] font-extrabold tabular-nums text-slate-600">
            {row.total}
          </span>
        </div>
      ))}
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 pt-3 text-[10.5px]">
        {RISK_ORDER.map((rc) => (
          <span key={rc} className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RISK_CLASS_META[rc].dot }} />
            {RISK_CLASS_META[rc].label}
          </span>
        ))}
      </div>
    </div>
  );
}

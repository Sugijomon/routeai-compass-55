// Beleidsmatrix — heatmap van risk class × beleidsstatus.
// Cellen tonen aantal tools en optellen van meldingen.
import { ToolRow, RISK_CLASS_META, POLICY_META, RiskClass, PolicyStatus } from "./toolFixture";

interface Props {
  tools: ToolRow[];
  onCellClick?: (riskClass: RiskClass, policy: PolicyStatus) => void;
}

const RISK_ORDER: RiskClass[] = ["unacceptable", "high", "limited", "minimal"];
const POLICY_ORDER: PolicyStatus[] = ["not_approved", "under_review", "known_unconfigured", "approved"];

function cellTone(riskClass: RiskClass, policy: PolicyStatus, count: number): string {
  if (count === 0) return "bg-white text-slate-300 border-slate-100";

  // Toxic combo: hoog risico × niet goedgekeurd
  if ((riskClass === "unacceptable" || riskClass === "high") && policy === "not_approved")
    return "bg-[#fdecea] text-[#b4292d] border-[#f5c2c5]";

  // Aandacht: hoog risico × under_review of unconfigured
  if (
    (riskClass === "unacceptable" || riskClass === "high") &&
    (policy === "under_review" || policy === "known_unconfigured")
  )
    return "bg-[#FDE8C4] text-[#C06000] border-[#f0d4a3]";

  // Hoog risico × goedgekeurd: licht waarschuwen (acceptabel maar opletten)
  if ((riskClass === "unacceptable" || riskClass === "high") && policy === "approved")
    return "bg-[#fef3c7] text-[#a16207] border-[#fde68a]";

  // Limited × not_approved
  if (riskClass === "limited" && policy === "not_approved")
    return "bg-[#FDE8C4] text-[#C06000] border-[#f0d4a3]";

  // Goedgekeurd + minimal/limited: groen
  if ((riskClass === "limited" || riskClass === "minimal") && policy === "approved")
    return "bg-[#E8F5E0] text-[#3e6a00] border-[#cfe8b8]";

  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function PolicyMatrix({ tools, onCellClick }: Props) {
  const grid: Record<string, ToolRow[]> = {};
  for (const t of tools) {
    const k = `${t.riskClass}|${t.policy}`;
    grid[k] = grid[k] ?? [];
    grid[k].push(t);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th className="w-[160px] px-2 py-2 text-left text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Risk class ↓ / Beleid →
            </th>
            {POLICY_ORDER.map((p) => (
              <th
                key={p}
                className="px-2 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
              >
                {POLICY_META[p].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RISK_ORDER.map((r) => (
            <tr key={r}>
              <th className="px-2 py-2 text-left">
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10.5px] font-extrabold ${RISK_CLASS_META[r].chip}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: RISK_CLASS_META[r].dot }} />
                  {RISK_CLASS_META[r].label}
                </span>
              </th>
              {POLICY_ORDER.map((p) => {
                const cell = grid[`${r}|${p}`] ?? [];
                const count = cell.length;
                const reports = cell.reduce((s, t) => s + t.reports, 0);
                const tone = cellTone(r, p, count);
                return (
                  <td
                    key={p}
                    onClick={() => count > 0 && onCellClick?.(r, p)}
                    className={`min-h-[68px] cursor-pointer rounded-md border px-2 py-2 text-center transition hover:scale-[1.01] ${tone}`}
                    style={{ height: 68 }}
                  >
                    <div className="font-mono text-2xl font-extrabold tabular-nums leading-none">
                      {count}
                    </div>
                    <div className="mt-1 text-[10px] font-bold opacity-80">
                      {count === 0 ? "—" : `${reports} meldingen`}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

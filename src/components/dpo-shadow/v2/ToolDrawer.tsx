// Toolprofiel-drawer voor Tool Inventaris.
// Toont metadata, risk + beleid, accountverdeling, dataverdeling, vakgebieden, triggers.
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  ToolRow,
  RISK_CLASS_META,
  POLICY_META,
  ACCOUNT_META,
  DATA_META,
  shortDept,
  trendLabel,
  trendColor,
} from "./toolFixture";
import { TRIGGER_META_V2 } from "./riskFixture";
import { Shield, X, Info } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: ToolRow | null;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-tight text-slate-500">{label}</span>
      <span className="text-right text-[12.5px] font-bold text-slate-800">{value}</span>
    </div>
  );
}

function StackedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map((seg) => {
          const w = (seg.value / total) * 100;
          if (seg.value === 0) return null;
          return (
            <div
              key={seg.label}
              style={{ width: `${w}%`, background: seg.color }}
              title={`${seg.label}: ${seg.value}`}
              className="h-full"
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10.5px] text-slate-500">
        {segments.map((seg) => (
          <span key={seg.label} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: seg.color }} />
            {seg.label}{" "}
            <span className="font-mono font-extrabold tabular-nums text-slate-700">{seg.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ToolDrawer({ open, onOpenChange, tool }: Props) {
  if (!tool) return null;
  const rc = RISK_CLASS_META[tool.riskClass];
  const pol = POLICY_META[tool.policy];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-[#f7f9fb] p-0 sm:max-w-[520px]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-[12px] font-extrabold uppercase text-slate-500">
                {tool.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold text-[#1a2028]">{tool.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {tool.vendor} · {tool.category}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded px-2 py-0.5 text-[10.5px] font-extrabold ${rc.chip}`}>
                    {rc.label}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[10.5px] font-extrabold ${pol.chip}`}>
                    {pol.label}
                  </span>
                  {tool.euAiActFlag && (
                    <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-[#fdecea] px-1.5 py-0.5 font-mono text-[9.5px] font-extrabold text-[#b4292d]">
                      <Shield size={10} /> EU AI Act-flag
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Sluiten"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Kerncijfers */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Kerncijfers
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-mono text-2xl font-extrabold tabular-nums text-[#0E5A75]">
                  {tool.reports}
                </div>
                <div className="text-[10px] text-slate-500">meldingen</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-extrabold tabular-nums text-[#0E5A75]">
                  {tool.uniqueDepts}
                </div>
                <div className="text-[10px] text-slate-500">vakgebieden</div>
              </div>
              <div>
                <div
                  className="font-mono text-2xl font-extrabold tabular-nums"
                  style={{ color: trendColor(tool.trend) }}
                >
                  {trendLabel(tool.trend)}
                </div>
                <div className="text-[10px] text-slate-500">trend t.o.v. vorige scan</div>
              </div>
            </div>
          </section>

          {/* Metadata */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Toolprofiel
            </h4>
            <div className="divide-y divide-slate-100">
              <MetaRow label="Categorie" value={tool.category} />
              <MetaRow label="Hosting" value={tool.hostingLocation} />
              <MetaRow label="Top use case" value={tool.topUseCase} />
              <MetaRow label="Top vakgebied" value={shortDept(tool.topDept)} />
              <MetaRow
                label="Contract"
                value={tool.hasContract ? "Aanwezig" : <span className="text-[#b4292d]">Geen</span>}
              />
              <MetaRow
                label="Verwerkersovereenkomst"
                value={tool.hasDpa ? "Aanwezig" : <span className="text-[#b4292d]">Geen</span>}
              />
            </div>
          </section>

          {/* Verdelingen */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Accounttype
            </h4>
            <StackedBar
              segments={tool.byAccount.map((a) => ({
                label: ACCOUNT_META[a.account].label,
                value: a.n,
                color:
                  a.account === "zakelijke_licentie"
                    ? "#3e6a00"
                    : a.account === "prive_betaald"
                    ? "#b4292d"
                    : a.account === "prive_gratis"
                    ? "#C06000"
                    : "#6d28d9",
              }))}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Dataclassificatie
            </h4>
            <StackedBar
              segments={tool.byData.map((d) => ({
                label: DATA_META[d.data].label,
                value: d.n,
                color: d.data === "gevoelig" ? "#b4292d" : d.data === "intern" ? "#0369a1" : "#94a3b8",
              }))}
            />
          </section>

          {/* Vakgebieden */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Verdeling per vakgebied
            </h4>
            <div className="space-y-1.5">
              {tool.byDept
                .slice()
                .sort((a, b) => b.n - a.n)
                .map((d) => {
                  const max = Math.max(...tool.byDept.map((x) => x.n));
                  const pct = (d.n / max) * 100;
                  return (
                    <div key={d.dept} className="flex items-center gap-3 text-[11px]">
                      <span className="w-32 shrink-0 truncate text-slate-600">{shortDept(d.dept)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0E5A75]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono font-extrabold tabular-nums text-slate-700">
                        {d.n}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Triggers */}
          {tool.triggers.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(26,32,44,.04)]">
              <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Risico-triggers
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tool.triggers.map((code) => {
                  const meta = TRIGGER_META_V2[code];
                  if (!meta) return null;
                  const cls =
                    meta.cls === "hard"
                      ? "bg-[#fdecea] text-[#b4292d]"
                      : meta.cls === "warn"
                      ? "bg-[#fff7ed] text-[#b45309]"
                      : "bg-[#eff6ff] text-[#1d4ed8]";
                  return (
                    <span
                      key={code}
                      className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 font-mono text-[10px] font-extrabold tracking-[.02em] ${cls}`}
                    >
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[11px] leading-relaxed text-blue-900/80">
            <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
            <span>
              Deze toolclassificatie is indicatief en gebaseerd op zelfrapportage in de Shadow AI Scan.
              Definitieve EU AI Act-classificatie volgt uit een AI Check in RouteAI.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

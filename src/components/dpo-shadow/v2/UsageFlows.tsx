// Gebruiksstromen — Sankey-stijl visualisatie volgens 02_Tool_Inventaris.html.
// Toont stromen tussen tools, doeleinden en accounttype op basis van gefilterde tooldata.
import { useMemo, useState } from "react";
import { ToolRow, ACCOUNT_META, RISK_CLASS_META, shortDept } from "./toolFixture";

interface Props {
  tools: ToolRow[]; // gefilterd
  isFiltered: boolean;
}

type View = "uses" | "accounts" | "full";

const TABS: { key: View; label: string }[] = [
  { key: "uses", label: "Tools → Toepassingen" },
  { key: "accounts", label: "Tools → Accounttype" },
  { key: "full", label: "Volledig (3 lagen)" },
];

const STATUS_COLOR: Record<string, string> = {
  approved: "#5A8F19",
  under_review: "#59728A",
  not_approved: "#D13F3F",
  known_unconfigured: "#94a3b8",
};

const LEGEND = [
  { label: "Toegestaan", color: "#5A8F19" },
  { label: "Beperkt", color: "#D08212" },
  { label: "In beoordeling", color: "#59728A" },
  { label: "Verboden", color: "#D13F3F" },
];

export function UsageFlows({ tools, isFiltered }: Props) {
  const [view, setView] = useState<View>("uses");

  const flows = useMemo(() => buildFlows(tools, view), [tools, view]);
  const isEmpty = tools.length === 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-2">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 flex-shrink-0 text-sky-500"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <path d="M12 7.5v4M7 17l3.5-5.5M17 17l-3.5-5.5" />
          </svg>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Gebruiksstromen</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Risico-indicatie op basis van gerapporteerd gebruikersgedrag.
              {isFiltered && " Gebruikt huidige selectie uit het AI-toolregister."}
            </p>
          </div>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-amber-700">
          Op basis van zelfrapportage
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-2">
        <div className="flex items-center gap-2">
          {TABS.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition ${
                  active
                    ? "border-[#00658b] bg-[#00658b] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LEGEND.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
              style={{ background: `${l.color}14`, color: l.color, borderColor: `${l.color}30` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        {isEmpty ? <FlowsEmpty /> : <FlowsView flows={flows} />}
      </div>
    </section>
  );
}

interface FlowItem {
  tool: ToolRow;
  rights: { label: string; n: number; color: string }[];
}

function buildFlows(tools: ToolRow[], view: View): FlowItem[] {
  return tools.map((t) => {
    let rights: { label: string; n: number; color: string }[] = [];
    if (view === "accounts") {
      rights = t.byAccount.map((a) => ({
        label: ACCOUNT_META[a.account].label,
        n: a.n,
        color: STATUS_COLOR[t.policy] ?? "#59728A",
      }));
    } else if (view === "uses") {
      rights = t.byDept.slice(0, 4).map((d) => ({
        label: shortDept(d.dept),
        n: d.n,
        color: STATUS_COLOR[t.policy] ?? "#59728A",
      }));
    } else {
      // full: combineer top-dept + accounttype
      rights = [
        ...t.byDept.slice(0, 2).map((d) => ({
          label: shortDept(d.dept),
          n: d.n,
          color: STATUS_COLOR[t.policy] ?? "#59728A",
        })),
        ...t.byAccount.slice(0, 2).map((a) => ({
          label: ACCOUNT_META[a.account].label,
          n: a.n,
          color: STATUS_COLOR[t.policy] ?? "#59728A",
        })),
      ];
    }
    return { tool: t, rights };
  });
}

function FlowsView({ flows }: { flows: FlowItem[] }) {
  const maxN = Math.max(1, ...flows.flatMap((f) => f.rights.map((r) => r.n)));
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
      {flows.slice(0, 8).map(({ tool, rights }) => (
        <div
          key={tool.id}
          className="grid grid-cols-[180px_1fr] items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: RISK_CLASS_META[tool.riskClass].dot }}
            />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold text-slate-800">{tool.name}</div>
              <div className="text-[10px] text-slate-500">
                {tool.reports} meldingen · {RISK_CLASS_META[tool.riskClass].label}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {rights.map((r, i) => (
              <div
                key={`${r.label}-${i}`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold"
                style={{
                  background: `${r.color}14`,
                  color: r.color,
                  width: `${Math.max(80, (r.n / maxN) * 220)}px`,
                }}
                title={`${r.label} · ${r.n} meldingen`}
              >
                <span className="truncate">{r.label}</span>
                <span className="ml-auto font-mono tabular-nums">{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {flows.length > 8 && (
        <p className="px-2 pt-1 text-[11px] text-slate-500">
          Top 8 van {flows.length} tools getoond. Verfijn de filters voor specifiekere stromen.
        </p>
      )}
    </div>
  );
}

function FlowsEmpty() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-slate-700">Stromen nog niet beschikbaar</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Zodra medewerkers tools en accounttype invullen in de Shadow AI Scan, verschijnt hier het
          stromen-diagram tussen tools, toepassingen en accounttype.
        </p>
      </div>
    </div>
  );
}

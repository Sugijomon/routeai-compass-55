// Gebruiksstromen — visuele shell volgens 02_Tool_Inventaris.html.
// Sankey-stijl tabs (Tools → Toepassingen / Tools → Accounttype / Volledig 3 lagen).
// Zonder echte aggregaten tonen we een nette empty state binnen dezelfde structuur.
import { useState } from "react";
import { ToolRow } from "./toolFixture";

interface Props {
  tools: ToolRow[];
}

type View = "uses" | "accounts" | "full";

const TABS: { key: View; label: string }[] = [
  { key: "uses", label: "Tools → Toepassingen" },
  { key: "accounts", label: "Tools → Accounttype" },
  { key: "full", label: "Volledig (3 lagen)" },
];

const LEGEND = [
  { label: "Toegestaan", color: "#5A8F19" },
  { label: "Beperkt", color: "#D08212" },
  { label: "In beoordeling", color: "#59728A" },
  { label: "Verboden", color: "#D13F3F" },
];

export function UsageFlows({ tools }: Props) {
  const [view, setView] = useState<View>("uses");
  const isEmpty = tools.length === 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-3">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 flex-shrink-0 text-sky-500" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <path d="M12 7.5v4M7 17l3.5-5.5M17 17l-3.5-5.5" />
          </svg>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gebruiksstromen</h2>
            <p className="mt-1 text-sm text-slate-500">
              Risico-indicatie op basis van gerapporteerd gebruikersgedrag. Klik op de filters.
            </p>
          </div>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-amber-700">
          Op basis van zelfrapportage
        </span>
      </div>

      {/* Tab toggle + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-3">
        <div className="flex items-center gap-2">
          {TABS.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`rounded-lg border px-3.5 py-1.5 text-[12px] font-bold transition ${
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

      {/* Diagram area */}
      <div className="px-6 pb-6">
        {isEmpty ? (
          <FlowsEmpty />
        ) : (
          <FlowsEmpty /* echte sankey-render later koppelen */ />
        )}
      </div>
    </section>
  );
}

function FlowsEmpty() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm">
          <svg className="text-slate-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="12" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <path d="M8.2 7.2 15.8 11M8.2 16.8 15.8 13" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-700">Stromen nog niet beschikbaar</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Zodra medewerkers tools en accounttype invullen in de Shadow AI Scan, verschijnt hier het
          Sankey-diagram met de stromen tussen tools, toepassingen en accounttype.
        </p>
      </div>
    </div>
  );
}

// DPO-matrix — visuele structuur volgens 02_Tool_Inventaris.html.
// Toont AI-tools × doeleinden in een matrix met risico-indicatie per cel.
// Op deze pagina: visuele shell met empty state (geen data-aggregaten beschikbaar).
import { ToolRow } from "./toolFixture";

interface Props {
  tools: ToolRow[];
}

const SORT_OPTIONS_TOOLS = [
  { value: "risico", label: "Hoogste risico", sub: "Kritikaliteit × eigen × shadow" },
  { value: "gebruik", label: "Meest gebruikt", sub: "Aantal respondenten" },
  { value: "euai", label: "EU AI Act eerst", sub: "Art. 5 / Annex III boven" },
];

const SORT_OPTIONS_UC = [
  { value: "risico", label: "Hoogste kritikaliteit", sub: "Impactfactor 2.0× voor 1.5×" },
  { value: "gebruik", label: "Meest gebruikt", sub: "Respondenten per doeleinde" },
  { value: "shadow", label: "Meeste shadow hits", sub: "Risicovolle cellen" },
];

export function DpoMatrix({ tools }: Props) {
  const isEmpty = tools.length === 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 pt-6 pb-5">
        <div className="mb-2 flex items-center gap-3">
          <svg className="text-sky-500" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800">DPO-matrix</h2>
        </div>
        <p className="max-w-4xl text-sm text-slate-500">
          Analyseer AI-gebruik op risico's en juridische aandachtspunten. De matrix selecteert uit
          de gehele set aan tools en toepassingen vanuit de Tool Inventaris. Koppelen aan de filters
          benut automatisch selecties zoals vakgebied en beleidsstatus in de analyse.
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-[22px]">
          {/* Hoofdmatrix */}
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-[#eef2f7] bg-gradient-to-b from-white to-[#fbfdff] p-[18px_18px_16px]">
            {isEmpty ? (
              <EmptyMatrix />
            ) : (
              <EmptyMatrix /* hook in real grid later */ />
            )}

            {/* Legenda */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
              <LegendDot color="#E24B4A" label="Hoog risico" />
              <LegendDot color="#EF9F27" label="Gemiddeld risico" />
              <LegendDot color="#97C459" label="Geborgd" />
              <span className="inline-flex items-center gap-1.5">
                <span className="h-[11px] w-[11px] rounded-full border border-dashed border-slate-300" />
                Niet van toepassing
              </span>
              <span className="h-3 w-px bg-[#dbe3ec]" />
              <span className="inline-flex items-center gap-1.5">
                <span className="grid h-3 w-3 place-items-center rounded-full bg-white">
                  <svg viewBox="0 0 16 16" className="h-3 w-3">
                    <circle cx="8" cy="8" r="6.2" fill="#fff" stroke="#FF5A6B" strokeWidth="1.8" />
                    <path d="M4.2 4.2 11.8 11.8" stroke="#FF5A6B" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                Art. 5 signaal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 16 16" className="h-[15px] w-[15px]">
                  <path d="M8 1.9 14.7 13.8H1.3L8 1.9Z" fill="#FF3B30" />
                  <rect x="7.2" y="5.7" width="1.6" height="4.4" rx=".8" fill="#fff" />
                  <circle cx="8" cy="12" r=".95" fill="#fff" />
                </svg>
                Annex III
              </span>
            </div>

            <div className="mt-2.5 flex justify-end">
              <span className="inline-flex items-center rounded-full border border-[#dbe3ec] bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Use-cases in scope: 0
              </span>
            </div>
          </div>

          {/* Sidecards: sorteer-opties + auditmode */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SideCard label="Sorteer tools op">
              {SORT_OPTIONS_TOOLS.map((opt, i) => (
                <RadioRow key={opt.value} name="dpoToolSort" defaultChecked={i === 0} {...opt} />
              ))}
            </SideCard>

            <SideCard label="Sorteer doeleinden op">
              {SORT_OPTIONS_UC.map((opt, i) => (
                <RadioRow key={opt.value} name="dpoUcSort" defaultChecked={i === 0} {...opt} />
              ))}
            </SideCard>

            <SideCard label="Auditmode">
              <ToggleRow label="EU AI Act only" sub="Verberg niet-relevante items" />
              <ToggleRow label="Koppel aan filters" sub="Gebruik zichtbare tools uit Tool Inventaris" />
              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dbe3ec] bg-white px-3 py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                Filters wissen
              </button>
            </SideCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyMatrix() {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-4 py-10 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100">
          <svg className="text-slate-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-700">Matrix nog niet beschikbaar</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          Zodra er voldoende ingevulde Shadow AI Scans zijn, verschijnt hier de tools × doeleinden
          matrix met risico-indicatie en EU AI Act-signalen.
        </p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-[11px] w-[11px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_10px_24px_rgba(15,23,42,.04)]">
      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      {children}
    </div>
  );
}

function RadioRow({
  name,
  label,
  sub,
  value,
  defaultChecked,
}: {
  name: string;
  label: string;
  sub: string;
  value: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="mb-2.5 flex cursor-pointer items-start gap-2.5 py-0.5">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer accent-[#0E5A75]"
      />
      <span className="text-[12px] font-semibold leading-snug text-slate-800">
        {label}
        <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{sub}</span>
      </span>
    </label>
  );
}

function ToggleRow({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <span className="text-[12px] font-semibold text-slate-800">
        {label}
        <span className="block text-[10px] font-medium text-slate-500">{sub}</span>
      </span>
      <label className="relative inline-flex h-5 w-[38px] flex-shrink-0 cursor-pointer items-center">
        <input type="checkbox" className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#0E5A75]" />
        <span className="absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white transition peer-checked:translate-x-[18px]" />
      </label>
    </div>
  );
}

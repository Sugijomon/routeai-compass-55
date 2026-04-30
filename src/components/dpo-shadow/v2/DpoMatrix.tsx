// DPO-matrix — tools × doeleinden (use-cases) op basis van gefilterde tooldata.
// Visuele structuur volgens 02_Tool_Inventaris.html: matrixgrid + legenda + sidecards.
import { useMemo, useState } from "react";
import { ToolRow, RISK_CLASS_META } from "./toolFixture";

interface Props {
  tools: ToolRow[]; // reeds gefilterd via gedeelde filterstate
  isFiltered: boolean;
  onResetFilters: () => void;
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

type ToolSort = "risico" | "gebruik" | "euai";
type UcSort = "risico" | "gebruik" | "shadow";

// Risk-naar-kleur mapping voor cellen
const CELL_COLOR: Record<string, { bg: string; ring: string; label: string }> = {
  unacceptable: { bg: "#FBD9DA", ring: "#E24B4A", label: "Hoog risico" },
  high: { bg: "#FDE3C9", ring: "#EF9F27", label: "Gemiddeld risico" },
  limited: { bg: "#FFF1C9", ring: "#E0B400", label: "Aandachtspunt" },
  minimal: { bg: "#E6F2D6", ring: "#97C459", label: "Geborgd" },
};

export function DpoMatrix({ tools, isFiltered, onResetFilters }: Props) {
  const [toolSort, setToolSort] = useState<ToolSort>("risico");
  const [ucSort, setUcSort] = useState<UcSort>("risico");
  const [auditOnly, setAuditOnly] = useState(false);

  // Bouw de set use-cases op basis van tool.category (proxy voor doeleind in V8 fixture / discoveries)
  const matrix = useMemo(() => {
    const useCases = Array.from(new Set(tools.map((t) => t.category).filter(Boolean)));

    const ucStats = useCases.map((uc) => {
      const cellTools = tools.filter((t) => t.category === uc);
      const reports = cellTools.reduce((s, t) => s + t.reports, 0);
      const shadow = cellTools.filter((t) => ["high", "unacceptable"].includes(t.riskClass)).length;
      const worst = cellTools
        .map((t) => RISK_CLASS_META[t.riskClass].sort)
        .sort((a, b) => a - b)[0];
      return { uc, reports, shadow, worst };
    });

    const sortedUc = [...ucStats].sort((a, b) => {
      if (ucSort === "gebruik") return b.reports - a.reports;
      if (ucSort === "shadow") return b.shadow - a.shadow;
      return (a.worst ?? 99) - (b.worst ?? 99);
    });

    const sortedTools = [...tools].sort((a, b) => {
      if (toolSort === "gebruik") return b.reports - a.reports;
      if (toolSort === "euai") {
        if (a.euAiActFlag !== b.euAiActFlag) return a.euAiActFlag ? -1 : 1;
        return RISK_CLASS_META[a.riskClass].sort - RISK_CLASS_META[b.riskClass].sort;
      }
      return RISK_CLASS_META[a.riskClass].sort - RISK_CLASS_META[b.riskClass].sort;
    });

    const visibleTools = auditOnly ? sortedTools.filter((t) => t.euAiActFlag) : sortedTools;
    const visibleUc = auditOnly
      ? sortedUc.filter((u) => u.shadow > 0)
      : sortedUc;

    return { tools: visibleTools, useCases: visibleUc.map((u) => u.uc) };
  }, [tools, toolSort, ucSort, auditOnly]);

  const isEmpty = matrix.tools.length === 0 || matrix.useCases.length === 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 pt-5 pb-3">
        <div className="mb-1.5 flex items-center gap-3">
          <svg
            className="text-sky-500"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h2 className="text-lg font-bold text-slate-800">DPO-matrix</h2>
          {isFiltered && (
            <span className="ml-1 rounded-full border border-[#0E5A75]/20 bg-[#0E5A75]/5 px-2 py-0.5 text-[10px] font-bold text-[#0E5A75]">
              Filters actief
            </span>
          )}
        </div>
        <p className="max-w-4xl text-[12.5px] text-slate-500">
          Tools × doeleinden uit de Tool Inventaris. De matrix gebruikt automatisch dezelfde selectie
          als de filters in het AI-toolregister hierboven.
        </p>
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-[#eef2f7] bg-gradient-to-b from-white to-[#fbfdff] p-[14px_14px_12px]">
            {isEmpty ? (
              <EmptyMatrix isFiltered={isFiltered} onReset={onResetFilters} />
            ) : (
              <MatrixGrid tools={matrix.tools} useCases={matrix.useCases} />
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
                <svg viewBox="0 0 16 16" className="h-[15px] w-[15px]">
                  <path d="M8 1.9 14.7 13.8H1.3L8 1.9Z" fill="#FF3B30" />
                  <rect x="7.2" y="5.7" width="1.6" height="4.4" rx=".8" fill="#fff" />
                  <circle cx="8" cy="12" r=".95" fill="#fff" />
                </svg>
                Annex III / Art. 5
              </span>
            </div>

            <div className="mt-2 flex justify-end">
              <span className="inline-flex items-center rounded-full border border-[#dbe3ec] bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Use-cases in scope: {matrix.useCases.length}
              </span>
            </div>
          </div>

          {/* Sidecards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SideCard label="Sorteer tools op">
              {SORT_OPTIONS_TOOLS.map((opt) => (
                <RadioRow
                  key={opt.value}
                  name="dpoToolSort"
                  value={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  checked={toolSort === opt.value}
                  onChange={() => setToolSort(opt.value as ToolSort)}
                />
              ))}
            </SideCard>

            <SideCard label="Sorteer doeleinden op">
              {SORT_OPTIONS_UC.map((opt) => (
                <RadioRow
                  key={opt.value}
                  name="dpoUcSort"
                  value={opt.value}
                  label={opt.label}
                  sub={opt.sub}
                  checked={ucSort === opt.value}
                  onChange={() => setUcSort(opt.value as UcSort)}
                />
              ))}
            </SideCard>

            <SideCard label="Auditmode">
              <ToggleRow
                label="EU AI Act only"
                sub="Verberg niet-relevante items"
                checked={auditOnly}
                onChange={setAuditOnly}
              />
              <button
                type="button"
                onClick={onResetFilters}
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

function MatrixGrid({ tools, useCases }: { tools: ToolRow[]; useCases: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[180px] bg-transparent p-1 text-left text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Tool / Doeleinde
            </th>
            {useCases.map((uc) => (
              <th
                key={uc}
                className="min-w-[110px] p-1 text-left align-bottom text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
              >
                <div className="line-clamp-2 leading-tight">{uc}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => (
            <tr key={t.id}>
              <td className="sticky left-0 z-10 min-w-[180px] bg-white p-1">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: RISK_CLASS_META[t.riskClass].dot }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold text-slate-800">{t.name}</div>
                    <div className="truncate text-[10px] text-slate-500">{t.vendor}</div>
                  </div>
                  {t.euAiActFlag && (
                    <svg viewBox="0 0 16 16" className="ml-auto h-3.5 w-3.5 flex-shrink-0">
                      <path d="M8 1.9 14.7 13.8H1.3L8 1.9Z" fill="#FF3B30" />
                      <rect x="7.2" y="5.7" width="1.6" height="4.4" rx=".8" fill="#fff" />
                      <circle cx="8" cy="12" r=".95" fill="#fff" />
                    </svg>
                  )}
                </div>
              </td>
              {useCases.map((uc) => {
                const match = t.category === uc;
                if (!match) {
                  return (
                    <td key={uc} className="p-1">
                      <div className="h-9 rounded-lg border border-dashed border-slate-200" />
                    </td>
                  );
                }
                const cell = CELL_COLOR[t.riskClass];
                return (
                  <td key={uc} className="p-1">
                    <div
                      title={`${t.name} · ${uc} · ${cell.label}`}
                      className="flex h-9 items-center justify-center rounded-lg text-[10px] font-extrabold"
                      style={{ background: cell.bg, color: cell.ring, boxShadow: `inset 0 0 0 1px ${cell.ring}33` }}
                    >
                      {t.reports}
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

function EmptyMatrix({ isFiltered, onReset }: { isFiltered: boolean; onReset: () => void }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center px-4 py-8 text-center">
      <div className="max-w-md">
        <h4 className="text-sm font-bold text-slate-700">
          {isFiltered ? "Geen tools binnen huidige filters" : "Matrix nog niet beschikbaar"}
        </h4>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          {isFiltered
            ? "Pas de filters in het AI-toolregister aan om meer tools en doeleinden in de matrix te zien."
            : "Zodra er voldoende ingevulde Shadow AI Scans zijn, verschijnt hier de tools × doeleinden matrix."}
        </p>
        {isFiltered && (
          <button
            onClick={onReset}
            className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-slate-300"
          >
            Filters wissen
          </button>
        )}
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
  checked,
  onChange,
}: {
  name: string;
  label: string;
  sub: string;
  value: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="mb-2.5 flex cursor-pointer items-start gap-2.5 py-0.5">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 cursor-pointer accent-[#0E5A75]"
      />
      <span className="text-[12px] font-semibold leading-snug text-slate-800">
        {label}
        <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{sub}</span>
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <span className="text-[12px] font-semibold text-slate-800">
        {label}
        <span className="block text-[10px] font-medium text-slate-500">{sub}</span>
      </span>
      <label className="relative inline-flex h-5 w-[38px] flex-shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#0E5A75]" />
        <span className="absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white transition peer-checked:translate-x-[18px]" />
      </label>
    </div>
  );
}

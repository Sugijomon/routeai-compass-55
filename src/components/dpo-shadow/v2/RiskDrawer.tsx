// Gedeelde drawer met cluster- en review-modus.
// Visueel identiek; tekst en velden verschillen per modus.
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  RiskClusterRow,
  formatScore,
  tierLabelV2,
  tierClassV2,
  tierColorV2,
  accountLabelV2,
  shortDept,
  riskNarrativeFor,
  TRIGGER_META_V2,
  THRESHOLD,
} from "./riskFixture";

export type DrawerMode = "cluster" | "review";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cluster: RiskClusterRow | null;
  mode: DrawerMode;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600">{label}</span>
        <span className="font-mono text-[11px] font-extrabold">{formatScore(value)}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function TriggerTag({ code }: { code: string }) {
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
      className={`inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 font-mono text-[9px] font-extrabold tracking-[.02em] ${cls}`}
    >
      {meta.label}
    </span>
  );
}

export function RiskDrawer({ open, onOpenChange, cluster, mode }: Props) {
  if (!cluster) return null;
  const isReview = mode === "review";
  const c = cluster;

  const toxicBoost = c.shadow > THRESHOLD.toxic_shadow && c.exposure > THRESHOLD.toxic_exposure ? 20 : 0;
  const priorityCalc = 0.45 * c.shadow + 0.45 * c.exposure + toxicBoost;

  const fields: [string, string | number][] = isReview
    ? [
        ["Case-ID", c.id.toLowerCase()],
        ["Vakgebied", c.dept],
        ["Tool", c.tool],
        ["Use case", c.useCase],
        ["Context", c.context],
        ["Accounttype", accountLabelV2(c.account)],
        ["Datatype", c.data],
        ["Respondenten in cluster", c.n],
      ]
    : [
        ["Tool", c.tool],
        ["Vakgebied", c.dept],
        ["Respondenten", c.n],
        ["Use case", c.useCase],
        ["Context", c.context],
        ["Accounttype", accountLabelV2(c.account)],
        ["Datatype", c.data],
        ["Cluster-ID", c.id.toLowerCase()],
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[540px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {isReview ? "DPO reviewcase" : "Cluster detail"}
            </p>
            <h3 className="mt-0.5 text-lg font-extrabold text-slate-800">
              {isReview ? `${c.tool} — ${shortDept(c.dept)}` : `${c.tool} — ${c.dept}`}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isReview
                ? `${c.id.toLowerCase()} · anonieme case · ${c.useCase}`
                : `${c.n} respondenten · ${c.useCase}`}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${tierClassV2(c.assigned_tier)}`}>
              {tierLabelV2(c.assigned_tier)}
            </span>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Score-overzicht
            </p>
            <div className="space-y-3">
              <ScoreBar label="Shadow score" value={c.shadow} color="#C06000" />
              <ScoreBar label="Exposure score" value={c.exposure} color="#D13F3F" />
              <ScoreBar label="Priority score" value={c.priority} color={tierColorV2(c.assigned_tier)} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[10px] text-slate-600">
              0.45·{c.shadow} + 0.45·{c.exposure}
              {toxicBoost ? " + toxic_boost(+20)" : ""} = {formatScore(priorityCalc)}
              {c.priority >= 100 ? " → capped at 100" : ""}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Combinatie
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {fields.map(([k, v]) => (
                <div key={k}>
                  <p className="mb-0.5 text-[10px] text-slate-400">{k}</p>
                  <p className="text-[13px] font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Review triggers
            </p>
            <div className="flex flex-wrap gap-1.5">
              {c.triggers.length === 0 ? (
                <span className="text-xs text-slate-400">Geen actieve review triggers.</span>
              ) : (
                c.triggers.map((t) => <TriggerTag key={t} code={t} />)
              )}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
              Risicoverklaring
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              {riskNarrativeFor(c)}{" "}
              {isReview
                ? "Deze case vraagt menselijke validatie voordat er een formele governance-actie wordt vastgelegd."
                : "Dit cluster helpt bepalen waar reviewcapaciteit of beleid eerst nodig is."}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] leading-relaxed text-amber-700">
              <strong>Let op:</strong> Dit is een prioriteringssignaal. Controleer beleid, context en datatype voordat
              je een formele governance-beslissing neemt.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-[12px] font-bold text-white hover:bg-slate-800"
          >
            {isReview ? "Review openen" : "Cluster analyseren"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            {isReview ? "Case export" : "Cluster export"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

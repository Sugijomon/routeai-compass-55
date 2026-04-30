// DPO Triage Review tabel — chips + 6 kolomfilters + hoverable rows.
// Klik op een rij opent reviewcase-drawer.
import { useMemo, useState } from "react";
import { Apps, AlertTriangle, ClipboardList, Flame, UserCog, FilterX, ExternalLink, Shield, Info } from "./icons";
import {
  RiskClusterRow,
  isOpenReview,
  isHardReview,
  isPrivateAccount,
  shortDept,
  dataLabel,
  accountLabelV2,
  primaryTrigger,
  tierLabelV2,
  tierClassV2,
  TRIGGER_META_V2,
  THRESHOLD,
} from "./riskFixture";

interface Props {
  clusters: RiskClusterRow[];
  onRowClick: (c: RiskClusterRow) => void;
}

type QuickFilter = "all" | "high" | "priority_review" | "toxic_combo" | "private_account";

function accountBadge(c: RiskClusterRow) {
  const styles: Record<string, string> = {
    prive_betaald: "bg-red-50 text-[#b4292d]",
    prive_gratis: "bg-orange-50 text-[#C06000]",
    beide: "bg-violet-50 text-violet-700",
    zakelijke_licentie: "bg-green-50 text-[#3e6a00]",
  };
  return (
    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${styles[c.account] ?? "bg-slate-100 text-slate-600"}`}>
      {accountLabelV2(c.account)}
    </span>
  );
}

function TriggerTag({ code }: { code: string }) {
  const meta = TRIGGER_META_V2[code];
  if (!meta) return <span className="text-[10px] text-slate-300">—</span>;
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

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: typeof Apps }[] = [
  { key: "all", label: "Alle tiers", icon: Apps },
  { key: "high", label: "Hoog risico", icon: AlertTriangle },
  { key: "priority_review", label: "Review vereist", icon: ClipboardList },
  { key: "toxic_combo", label: "Toxic combos", icon: Flame },
  { key: "private_account", label: "Privéaccount", icon: UserCog },
];

export function DpoTriageReview({ clusters, onRowClick }: Props) {
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [dept, setDept] = useState("all");
  const [tool, setTool] = useState("all");
  const [account, setAccount] = useState("all");
  const [data, setData] = useState("all");
  const [tier, setTier] = useState("all");
  const [trigger, setTrigger] = useState("all");

  const open = useMemo(() => clusters.filter(isOpenReview), [clusters]);

  const opts = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr)).sort();
    return {
      depts: uniq(open.map((c) => c.dept)),
      tools: uniq(open.map((c) => c.tool)),
      accounts: uniq(open.map((c) => c.account)),
      datas: uniq(open.map((c) => dataLabel(c.data))),
      tiers: uniq(open.map((c) => c.assigned_tier)),
      triggers: uniq(open.flatMap((c) => c.triggers)),
    };
  }, [open]);

  const rows = useMemo(() => {
    let r = open.slice();
    if (quick === "high") r = r.filter((c) => c.assigned_tier === "toxic_shadow" || c.priority >= 50 || isHardReview(c));
    if (quick === "priority_review") r = r.filter((c) => c.assigned_tier !== "standard");
    if (quick === "toxic_combo")
      r = r.filter((c) => c.shadow > THRESHOLD.toxic_shadow && c.exposure > THRESHOLD.toxic_exposure);
    if (quick === "private_account") r = r.filter(isPrivateAccount);
    if (dept !== "all") r = r.filter((c) => c.dept === dept);
    if (tool !== "all") r = r.filter((c) => c.tool === tool);
    if (account !== "all") r = r.filter((c) => c.account === account);
    if (data !== "all") r = r.filter((c) => dataLabel(c.data) === data);
    if (tier !== "all") r = r.filter((c) => c.assigned_tier === tier);
    if (trigger !== "all") r = r.filter((c) => c.triggers.includes(trigger));
    return r.sort((a, b) => b.priority - a.priority || b.n - a.n);
  }, [open, quick, dept, tool, account, data, tier, trigger]);

  const reset = () => {
    setQuick("all");
    setDept("all");
    setTool("all");
    setAccount("all");
    setData("all");
    setTier("all");
    setTrigger("all");
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
      <div className="flex items-start gap-4 px-6 pt-6 pb-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Shield className="mt-0.5 shrink-0 text-[#0369a1]" size={28} />
          <div>
            <h3 className="text-xl font-bold">DPO Triage Review</h3>
            <p className="mt-0.5 text-sm text-[#566166]">
              Selecteer een prioriteit om de triage te starten. Elke case vereist een menselijke validatie.
            </p>
          </div>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.04em] text-sky-700">
          <Info size={14} />
          Op basis van zelfrapportage
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white px-6 pb-5">
        <span className="mr-1 text-[11px] font-bold text-slate-400">Snelfilter:</span>
        {QUICK_FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setQuick(key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
              quick === key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
        >
          <FilterX size={14} />
          Filters wissen
        </button>
      </div>

      <div className="max-h-[440px] overflow-auto">
        <table className="w-full table-fixed text-left" style={{ minWidth: 860 }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-6 py-3">
                <FilterSelect value={dept} onChange={setDept} firstLabel="Alle vakgebieden" options={opts.depts.map((d) => [d, shortDept(d)])} />
              </th>
              <th className="px-4 py-3">
                <FilterSelect value={tool} onChange={setTool} firstLabel="Alle tools" options={opts.tools.map((t) => [t, t])} />
              </th>
              <th className="px-4 py-3">
                <FilterSelect value={account} onChange={setAccount} firstLabel="Account" options={opts.accounts.map((a) => [a, accountLabelV2(a)])} />
              </th>
              <th className="px-4 py-3">
                <FilterSelect value={data} onChange={setData} firstLabel="Data" options={opts.datas.map((d) => [d, d])} />
              </th>
              <th className="px-4 py-3">
                <FilterSelect value={tier} onChange={setTier} firstLabel="Tier" options={opts.tiers.map((t) => [t, tierLabelV2(t)])} />
              </th>
              <th className="px-4 py-3">
                <FilterSelect
                  value={trigger}
                  onChange={setTrigger}
                  firstLabel="Trigger"
                  options={opts.triggers.map((t) => [t, TRIGGER_META_V2[t]?.label ?? t])}
                />
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm font-semibold text-slate-400">
                  Geen open reviews binnen deze filterselectie.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const t = primaryTrigger(c);
              return (
                <tr
                  key={c.id}
                  onClick={() => onRowClick(c)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-extrabold text-slate-700">{shortDept(c.dept)}</p>
                    <p className="mt-1 font-mono text-[10px] font-extrabold tracking-normal text-slate-600 lowercase">
                      {c.id.toLowerCase()}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{c.tool}</td>
                  <td className="px-4 py-4">{accountBadge(c)}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-500">{dataLabel(c.data)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${tierClassV2(c.assigned_tier)}`}>
                      {tierLabelV2(c.assigned_tier)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {t === "-" ? <span className="text-[10px] text-slate-300">—</span> : <TriggerTag code={t} />}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      aria-label="Open details"
                      title="Open details"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-[#0E5A75]"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">
        <p className="text-[11px] text-slate-400">
          Menselijke validatie vereist op anonieme case-ID's voor alle actieve triage-verzoeken.
        </p>
      </div>
    </section>
  );
}

function FilterSelect({
  value,
  onChange,
  firstLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  firstLabel: string;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
    >
      <option value="all">{firstLabel}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

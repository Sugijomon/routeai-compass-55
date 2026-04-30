// Tool Register — uitgebreide tabel met chips, quick-filters en kolomfilters.
// Klik op een rij opent toolprofiel-drawer.
import { useMemo, useState } from "react";
import { LayoutGrid as Apps, TriangleAlert as AlertTriangle, ClipboardList, Flame, UserCog, FilterX, Shield, Search } from "lucide-react";
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

interface Props {
  tools: ToolRow[];
  onRowClick: (t: ToolRow) => void;
}

type QuickFilter = "all" | "flagged" | "not_approved" | "private_account" | "high_risk";

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: typeof Apps }[] = [
  { key: "all", label: "Alle tools", icon: Apps },
  { key: "flagged", label: "EU AI Act-flag", icon: Shield },
  { key: "not_approved", label: "Niet goedgekeurd", icon: AlertTriangle },
  { key: "private_account", label: "Privéaccount", icon: UserCog },
  { key: "high_risk", label: "Hoog risico", icon: Flame },
];

export function ToolRegisterTable({ tools, onRowClick }: Props) {
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");
  const [riskClass, setRiskClass] = useState("all");
  const [policy, setPolicy] = useState("all");
  const [account, setAccount] = useState("all");
  const [data, setData] = useState("all");

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (quick === "flagged" && !t.euAiActFlag) return false;
      if (quick === "not_approved" && t.policy !== "not_approved") return false;
      if (quick === "private_account" && !["prive_gratis", "prive_betaald", "beide"].includes(t.accountMix))
        return false;
      if (quick === "high_risk" && !["high", "unacceptable"].includes(t.riskClass)) return false;
      if (riskClass !== "all" && t.riskClass !== riskClass) return false;
      if (policy !== "all" && t.policy !== policy) return false;
      if (account !== "all" && t.accountMix !== account) return false;
      if (data !== "all" && t.dataMix !== data) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.vendor.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tools, quick, query, riskClass, policy, account, data]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const r = RISK_CLASS_META[a.riskClass].sort - RISK_CLASS_META[b.riskClass].sort;
        if (r !== 0) return r;
        return b.reports - a.reports;
      }),
    [filtered],
  );

  const resetFilters = () => {
    setQuick("all");
    setQuery("");
    setRiskClass("all");
    setPolicy("all");
    setAccount("all");
    setData("all");
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ClipboardList className="mt-0.5 shrink-0 text-[#0369a1]" size={26} />
          <div>
            <h3 className="text-xl font-bold">AI-toolregister</h3>
            <p className="mt-0.5 text-sm text-[#566166]">
              Alle tools die in de Shadow AI Scan zijn gemeld, met indicatieve EU AI Act-classificatie en
              beleidsstatus. Klik op een rij voor het toolprofiel.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500">
          {sorted.length} van {tools.length} tools
        </span>
      </div>

      {/* Quick filters + search */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 pb-4">
        {QUICK_FILTERS.map(({ key, label, icon: Icon }) => {
          const active = quick === key;
          return (
            <button
              key={key}
              onClick={() => setQuick(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                active
                  ? "border-[#0E5A75] bg-[#0E5A75] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Zoek tool, vendor, categorie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-[#0E5A75]"
            />
          </div>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:border-slate-300"
          >
            <FilterX size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="bg-slate-50/60 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-extrabold">Tool</th>
              <th className="px-4 py-3 font-extrabold">
                <select
                  value={riskClass}
                  onChange={(e) => setRiskClass(e.target.value)}
                  className="bg-transparent text-[10px] font-extrabold uppercase outline-none"
                >
                  <option value="all">Risk class</option>
                  {Object.entries(RISK_CLASS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 font-extrabold">
                <select
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                  className="bg-transparent text-[10px] font-extrabold uppercase outline-none"
                >
                  <option value="all">Beleid</option>
                  {Object.entries(POLICY_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 font-extrabold">
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="bg-transparent text-[10px] font-extrabold uppercase outline-none"
                >
                  <option value="all">Account</option>
                  {Object.entries(ACCOUNT_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 font-extrabold">
                <select
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-transparent text-[10px] font-extrabold uppercase outline-none"
                >
                  <option value="all">Data</option>
                  {Object.entries(DATA_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-3 font-extrabold">Top vakgebied</th>
              <th className="px-4 py-3 text-right font-extrabold">Meldingen</th>
              <th className="px-4 py-3 text-right font-extrabold">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">
                  Geen tools die voldoen aan de huidige filters.
                </td>
              </tr>
            )}
            {sorted.map((t) => {
              const rc = RISK_CLASS_META[t.riskClass];
              const pol = POLICY_META[t.policy];
              const acc = ACCOUNT_META[t.accountMix];
              const dat = DATA_META[t.dataMix];
              return (
                <tr
                  key={t.id}
                  onClick={() => onRowClick(t)}
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-[10px] font-extrabold uppercase text-slate-500"
                        aria-hidden
                      >
                        {t.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{t.name}</span>
                          {t.euAiActFlag && (
                            <span
                              title="EU AI Act flag"
                              className="inline-flex items-center gap-0.5 rounded-[4px] bg-[#fdecea] px-1 py-0.5 font-mono text-[9px] font-extrabold tracking-wide text-[#b4292d]"
                            >
                              <Shield size={9} /> EU
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          {t.vendor} · {t.category} · {t.hostingLocation}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${rc.chip}`}>
                      {rc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${pol.chip}`}>
                      {pol.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${acc.chip}`}>
                      {acc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded px-2 py-1 text-[11px] font-extrabold ${dat.chip}`}>
                      {dat.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-slate-600">
                    {shortDept(t.topDept)}{" "}
                    <span className="text-slate-400">·{t.uniqueDepts}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-extrabold tabular-nums text-slate-700">
                    {t.reports}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right font-mono text-[11px] font-extrabold tabular-nums"
                    style={{ color: trendColor(t.trend) }}
                  >
                    {trendLabel(t.trend)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

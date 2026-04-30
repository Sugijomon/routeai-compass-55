// 6 risicoversterkers — kaartjes met counts en progress bar.
import { Lock, UserCog, Puzzle, Settings2, Ban, Gavel, type LucideIcon } from "lucide-react";
import { RiskClusterRow } from "./riskFixture";

interface Props {
  clusters: RiskClusterRow[];
}

interface Item {
  label: string;
  note: string;
  icon: LucideIcon;
  color: string;
  matches: (c: RiskClusterRow) => boolean;
}

const ITEMS: Item[] = [
  { label: "Gevoelige data", note: "Bijzondere, klant-, financiële of juridische data", icon: Lock, color: "#0369a1",
    matches: (c) => ["gevoelig_persoonsgegeven", "klantdata", "financiele_data", "juridische_documenten"].includes(c.data) },
  { label: "Privéaccount", note: "Gebruik buiten zakelijke licentie of SSO", icon: UserCog, color: "#C06000",
    matches: (c) => ["prive_gratis", "prive_betaald", "beide"].includes(c.account) },
  { label: "Browserextensie", note: "AI via extensielaag of onbeheerde browserflow", icon: Puzzle, color: "#0e7490",
    matches: (c) => c.triggers.includes("extension_unmanaged") },
  { label: "Automatisering / autonome AI", note: "Workflow, agentic gebruik of verwerking buiten chat", icon: Settings2, color: "#b45309",
    matches: (c) => c.triggers.includes("automation_unmanaged") || c.triggers.includes("agentic_usage") },
  { label: "Verboden of beperkt", note: "Beleidsstatus restricted/prohibited of harde stop", icon: Ban, color: "#b4292d",
    matches: (c) => c.shadow >= 40 || c.triggers.includes("prohibited_tool") },
  { label: "HR / juridische context", note: "HR-evaluatie, bijzondere data of juridisch signaal", icon: Gavel, color: "#475569",
    matches: (c) => c.triggers.includes("hr_evaluation_context") || c.triggers.includes("special_category_data") },
];

export function RiskAmplifiersV2({ clusters }: Props) {
  const totalN = clusters.reduce((s, c) => s + c.n, 0) || 1;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const count = clusters.filter(it.matches).reduce((s, c) => s + c.n, 0);
        const pct = Math.round((count / totalN) * 100);
        return (
          <div key={it.label} className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${it.color}14` }}
              >
                <Icon className="h-[17px] w-[17px]" style={{ color: it.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-extrabold text-slate-700">{it.label}</p>
                  <p className="font-mono text-[12px] font-extrabold" style={{ color: it.color }}>
                    {count}
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">{it.note}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, background: it.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

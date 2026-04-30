// Risicoversterkers: 6 kaarten die laten zien welke patronen de reviewdruk verhogen.
import type { RiskCluster } from "@/hooks/useRiskClusters";
import {
  Lock,
  UserCog,
  Puzzle,
  Settings2,
  Ban,
  Gavel,
  type LucideIcon,
} from "lucide-react";

interface RiskAmplifiersProps {
  clusters: RiskCluster[];
}

interface Amplifier {
  key: string;
  label: string;
  note: string;
  icon: LucideIcon;
  color: string;
  matches: (c: RiskCluster) => boolean;
}

const AMPLIFIERS: Amplifier[] = [
  {
    key: "data",
    label: "Gevoelige data",
    note: "Bijzondere, klant-, financiële of juridische data",
    icon: Lock,
    color: "hsl(217 91% 40%)",
    matches: (c) => c.trigger_codes.includes("special_category_data"),
  },
  {
    key: "private",
    label: "Privéaccount",
    note: "Gebruik buiten zakelijke licentie of SSO",
    icon: UserCog,
    color: "hsl(28 90% 45%)",
    matches: (c) => c.trigger_codes.includes("automation_unmanaged"),
  },
  {
    key: "extension",
    label: "Browserextensie",
    note: "AI via extensielaag of onbeheerde browserflow",
    icon: Puzzle,
    color: "hsl(190 80% 35%)",
    matches: (c) => c.trigger_codes.includes("extension_unmanaged"),
  },
  {
    key: "automation",
    label: "Automatisering / autonome AI",
    note: "Workflow, agentic gebruik of verwerking buiten chat",
    icon: Settings2,
    color: "hsl(35 92% 35%)",
    matches: (c) =>
      c.trigger_codes.includes("automation_unmanaged") ||
      c.trigger_codes.includes("agentic_usage"),
  },
  {
    key: "prohibited",
    label: "Verboden of beperkt",
    note: "Beleidsstatus restricted/prohibited of harde stop",
    icon: Ban,
    color: "hsl(var(--destructive))",
    matches: (c) => c.avg_shadow >= 40 || c.trigger_codes.includes("prohibited_tool"),
  },
  {
    key: "hr",
    label: "HR / juridische context",
    note: "HR-evaluatie, bijzondere data of juridisch signaal",
    icon: Gavel,
    color: "hsl(220 9% 35%)",
    matches: (c) =>
      c.trigger_codes.includes("hr_evaluation_context") ||
      c.trigger_codes.includes("special_category_data"),
  },
];

export function RiskAmplifiers({ clusters }: RiskAmplifiersProps) {
  const totalN = clusters.reduce((s, c) => s + c.respondent_count, 0) || 1;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {AMPLIFIERS.map((a) => {
        const Icon = a.icon;
        const count = clusters
          .filter((c) => a.matches(c))
          .reduce((s, c) => s + c.respondent_count, 0);
        const pct = Math.round((count / totalN) * 100);
        return (
          <div key={a.key} className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${a.color}1a` }}
              >
                <Icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-extrabold">{a.label}</p>
                  <p className="font-mono text-[12px] font-extrabold" style={{ color: a.color }}>
                    {count}
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{a.note}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, background: a.color }}
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

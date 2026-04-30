import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDpoDashboard } from "@/hooks/useDpoDashboard";
import { KpiCard } from "@/components/dpo-shadow/KpiCard";
import { DashboardFooter } from "@/components/dpo-shadow/DashboardFooter";
import { SelfReportPill } from "@/components/dpo-shadow/SelfReportPill";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  unacceptable: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  limited: "bg-yellow-100 text-yellow-800",
  minimal: "bg-green-100 text-green-800",
};

export default function ToolInventarisPage() {
  const { profile } = useUserProfile();
  const { toolDiscoveries, isLoading } = useDpoDashboard();
  const [query, setQuery] = useState("");

  const tools = useMemo(() => {
    if (!query.trim()) return toolDiscoveries;
    const q = query.toLowerCase();
    return toolDiscoveries.filter((t: any) =>
      (t.tool_name || "").toLowerCase().includes(q),
    );
  }, [toolDiscoveries, query]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { unacceptable: 0, high: 0, limited: 0, minimal: 0 };
    toolDiscoveries.forEach((t: any) => {
      const c = t.application_risk_class;
      if (c && c in acc) acc[c]++;
    });
    return acc;
  }, [toolDiscoveries]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        <PageHeader
          title="Tool Inventaris"
          subtitle="Welke AI-tools worden gemeld in de Shadow AI Scan? Filter op toolnaam, gebruik, beleidsstatus, vakgebied en accounttype."
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Tools totaal" value={toolDiscoveries.length} sub="ontdekt via scan" />
          <KpiCard label="Onacceptabel" value={counts.unacceptable} tone="red" sub="EU AI Act risk class" />
          <KpiCard label="Hoog risico" value={counts.high} tone="amber" sub="EU AI Act risk class" />
          <KpiCard label="Beperkt/Minimaal" value={counts.limited + counts.minimal} tone="green" sub="EU AI Act risk class" />
        </div>

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div>
              <h3 className="text-lg font-bold">AI-toolregister</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Gemelde tools met indicatieve EU AI Act-classificatie. Klik later voor toolprofiel.
              </p>
            </div>
            <SelfReportPill />
          </div>

          <div className="px-6 pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek toolnaam…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tool</th>
                  <th className="px-4 py-3 font-semibold">Risk class</th>
                  <th className="px-4 py-3 font-semibold">Use case</th>
                  <th className="px-4 py-3 text-right font-semibold">Meldingen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Laden…
                    </td>
                  </tr>
                )}
                {!isLoading && tools.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Geen tools gevonden.
                    </td>
                  </tr>
                )}
                {tools.map((t: any) => (
                  <tr key={t.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">{t.tool_name}</td>
                    <td className="px-4 py-3">
                      {t.application_risk_class ? (
                        <Badge className={RISK_BADGE[t.application_risk_class] ?? "bg-muted"}>
                          {t.application_risk_class}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">onbekend</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {t.use_case_description || t.use_case || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">DPO-matrix</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Per tool: beleidsstatus × EU AI Act-flag. Wordt aangesloten op V8 <code>survey_tool</code>{" "}
            zodra koppeling actief is.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Component-skeleton voorbereid voor V8-data; nog niet gevuld.
          </p>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Gebruiksstromen</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sankey-achtige visualisatie van vakgebied → tool → accounttype. Aansluiting op V8{" "}
            <code>risk_result_tool</code> volgt.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Component-skeleton voorbereid voor V8-data; nog niet gevuld.
          </p>
        </section>

        <DashboardFooter />
      </div>
    </AppLayout>
  );
}

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDpoDashboard } from "@/hooks/useDpoDashboard";
import { ToolKpiRow } from "@/components/dpo-shadow/v2/ToolKpiRow";
import { ToolRegisterTable } from "@/components/dpo-shadow/v2/ToolRegisterTable";
import { PolicyMatrix } from "@/components/dpo-shadow/v2/PolicyMatrix";
import { TopDeptChart } from "@/components/dpo-shadow/v2/TopDeptChart";
import { ToolDrawer } from "@/components/dpo-shadow/v2/ToolDrawer";
import { MOCK_TOOLS, type ToolRow } from "@/components/dpo-shadow/v2/toolFixture";
import { ClipboardList, LayoutGrid, BarChart3, AlertCircle } from "lucide-react";

/**
 * Tool Inventaris — DPO Shadow AI dashboard.
 * Visueel 1:1 in lijn met de Risicoprofiel-pagina (V9.2-stijl).
 * Gebruikt mock-fixture zolang er geen voltooide V8 tool-aggregaten zijn.
 */
export default function ToolInventarisPage() {
  const { profile } = useUserProfile();
  const { toolDiscoveries, isLoading } = useDpoDashboard();

  // Fixture als fallback om de visuele structuur compleet te houden.
  // Zodra V8-aggregaten toolDiscoveries voldoende verrijken, mappen we die hier.
  const tools: ToolRow[] = useMemo(() => {
    if (!toolDiscoveries || toolDiscoveries.length === 0) return MOCK_TOOLS;
    return MOCK_TOOLS;
  }, [toolDiscoveries]);

  const [drawerTool, setDrawerTool] = useState<ToolRow | null>(null);

  return (
    <AppLayout>
      <div className="bg-[#f7f9fb] text-[#1a2028]">
        <div className="space-y-8 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-3xl font-extrabold tracking-tight">Tool Inventaris</h2>
              <p className="max-w-4xl text-sm font-medium text-[#566166]">
                Welke AI-tools worden in de Shadow AI Scan gemeld, hoe verhouden ze zich tot huidig
                beleid, en waar zit het zwaartepunt qua vakgebied, accounttype en data? Klik op een rij
                voor het toolprofiel.
              </p>
            </div>
            {isLoading && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                Live data wordt geladen…
              </span>
            )}
          </div>

          <ToolKpiRow tools={tools} />

          <div className="grid grid-cols-1 gap-6">
            {/* Beleidsmatrix */}
            <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <LayoutGrid className="mt-0.5 shrink-0 text-[#0369a1]" size={26} />
                  <div>
                    <h3 className="text-xl font-bold">Beleidsmatrix</h3>
                    <p className="mt-0.5 text-sm text-[#566166]">
                      Risk class (rij) × Beleidsstatus (kolom). Rode cellen rechtsboven = toxic combos,
                      groene cellen rechtsonder = beheerst.
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 md:inline-flex">
                  cellen tonen aantal tools + meldingen
                </span>
              </div>
              <div className="px-6 pb-6">
                <PolicyMatrix tools={tools} />
              </div>
            </section>

            {/* Top vakgebieden */}
            <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(26,32,44,.06)]">
              <div className="flex items-start gap-3 px-6 pt-6 pb-4">
                <BarChart3 className="mt-0.5 text-[#C06000]" size={26} />
                <div>
                  <h3 className="text-xl font-bold">Top vakgebieden</h3>
                  <p className="mt-0.5 text-sm text-[#566166]">
                    Welke vakgebieden melden de meeste tools, en hoe is het risk-profiel verdeeld?
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <TopDeptChart tools={tools} />
              </div>
            </section>
          </div>

          {/* AI-toolregister */}
          <ToolRegisterTable tools={tools} onRowClick={setDrawerTool} />

          <footer className="mt-auto pb-4 pt-8">
            <div className="border-t border-slate-200/60 pt-4">
              <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-400">
                <AlertCircle size={14} className="opacity-70" />
                Deze signalen zijn indicatief van aard en op basis van zelfrapportage. EU AI
                Act-classificatie volgt definitief uit een AI Check in RouteAI.
              </p>
            </div>
          </footer>

          <ToolDrawer
            open={!!drawerTool}
            onOpenChange={(o) => !o && setDrawerTool(null)}
            tool={drawerTool}
          />
        </div>
      </div>
    </AppLayout>
  );
}

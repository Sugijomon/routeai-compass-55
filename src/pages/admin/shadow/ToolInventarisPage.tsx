import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDpoDashboard } from "@/hooks/useDpoDashboard";
import { ToolKpiRow } from "@/components/dpo-shadow/v2/ToolKpiRow";
import { ToolRegisterTable } from "@/components/dpo-shadow/v2/ToolRegisterTable";
import { DpoMatrix } from "@/components/dpo-shadow/v2/DpoMatrix";
import { UsageFlows } from "@/components/dpo-shadow/v2/UsageFlows";
import { ToolDrawer } from "@/components/dpo-shadow/v2/ToolDrawer";
import { MOCK_TOOLS, type ToolRow } from "@/components/dpo-shadow/v2/toolFixture";
import { mapDiscoveriesToToolRows } from "@/components/dpo-shadow/v2/toolMapper";
import { useToolFilters } from "@/components/dpo-shadow/v2/useToolFilters";
import { AlertCircle, Beaker } from "lucide-react";

/**
 * Tool Inventaris — DPO Shadow AI dashboard.
 * Structuur volgt 02_Tool_Inventaris.html:
 *   1) KPI-rij
 *   2) AI-toolregister (filterbron)
 *   3) DPO-matrix (consumeert filters)
 *   4) Gebruiksstromen (consumeert filters)
 *   5) Footer
 */
export default function ToolInventarisPage() {
  useUserProfile();
  const { toolDiscoveries, isLoading } = useDpoDashboard();

  // Live data wanneer aanwezig, anders MOCK_TOOLS als demo-fallback
  const { tools, isDemoData } = useMemo(() => {
    if (toolDiscoveries && toolDiscoveries.length > 0) {
      return { tools: mapDiscoveriesToToolRows(toolDiscoveries as never), isDemoData: false };
    }
    return { tools: MOCK_TOOLS, isDemoData: true };
  }, [toolDiscoveries]);

  // Eén bron van filters voor alle drie onderstaande secties
  const { state, set, reset, filtered, isActive } = useToolFilters(tools);

  const [drawerTool, setDrawerTool] = useState<ToolRow | null>(null);

  return (
    <AppLayout>
      <div className="bg-[#f7f9fb] text-[#1a2028]">
        <div className="space-y-6 p-6 md:p-8">
          {/* Page intro */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="mb-1 text-2xl font-extrabold tracking-tight md:text-3xl">
                Tool Inventaris
              </h2>
              <p className="max-w-4xl text-[13px] font-medium text-[#566166]">
                Bekijk welke AI-tools in gebruik zijn, hoe ze in de catalogus staan en welk beleid
                ervoor geldt. De analyse is gegroepeerd op tools en clusters; individuele
                medewerkers worden niet getoond.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isLoading && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                  Live data wordt geladen…
                </span>
              )}
              {isDemoData && !isLoading && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
                  <Beaker size={12} />
                  Demo-data — nog geen live tooldata
                </span>
              )}
            </div>
          </div>

          {/* 1. KPI-rij */}
          <ToolKpiRow tools={filtered.length ? filtered : tools} />

          {/* 2. AI-toolregister */}
          <ToolRegisterTable
            totalCount={tools.length}
            filtered={filtered}
            state={state}
            setFilter={set}
            resetFilters={reset}
            onRowClick={setDrawerTool}
          />

          {/* 3. DPO-matrix — gedeelde filters */}
          <DpoMatrix tools={filtered} isFiltered={isActive} onResetFilters={reset} />

          {/* 4. Gebruiksstromen — gedeelde filters */}
          <UsageFlows tools={filtered} isFiltered={isActive} />

          {/* 5. Footer */}
          <footer className="mt-auto pb-2 pt-6">
            <div className="border-t border-slate-200/60 pt-3">
              <p className="flex items-center gap-1.5 text-[11px] leading-relaxed text-slate-400">
                <AlertCircle size={14} className="opacity-70" />
                Deze signalen zijn indicatief van aard en op basis van zelfrapportage. Menselijk
                oordeel blijft leidend.
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

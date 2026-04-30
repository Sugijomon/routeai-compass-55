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
import { AlertCircle } from "lucide-react";

/**
 * Tool Inventaris — DPO Shadow AI dashboard.
 * Structuur volgt 02_Tool_Inventaris.html:
 *   1) KPI-rij
 *   2) AI-toolregister
 *   3) DPO-matrix
 *   4) Gebruiksstromen
 *   5) Footer
 */
export default function ToolInventarisPage() {
  const { profile } = useUserProfile();
  const { toolDiscoveries, isLoading } = useDpoDashboard();

  // Fixture als visuele basis. Vervangen zodra V8-aggregaten beschikbaar zijn.
  const tools: ToolRow[] = useMemo(() => {
    if (!toolDiscoveries || toolDiscoveries.length === 0) return MOCK_TOOLS;
    return MOCK_TOOLS;
  }, [toolDiscoveries]);

  const [drawerTool, setDrawerTool] = useState<ToolRow | null>(null);

  return (
    <AppLayout>
      <div className="bg-[#f7f9fb] text-[#1a2028]">
        <div className="space-y-8 p-8">
          {/* Page intro */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-3xl font-extrabold tracking-tight">Tool Inventaris</h2>
              <p className="max-w-4xl text-sm font-medium text-[#566166]">
                Bekijk welke AI-tools in gebruik zijn, hoe ze in de catalogus staan en welk beleid
                ervoor geldt. De analyse is gegroepeerd op tools en clusters; individuele
                medewerkers worden niet getoond.
              </p>
            </div>
            {isLoading && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                Live data wordt geladen…
              </span>
            )}
          </div>

          {/* 1. KPI-rij */}
          <ToolKpiRow tools={tools} />

          {/* 2. AI-toolregister */}
          <ToolRegisterTable tools={tools} onRowClick={setDrawerTool} />

          {/* 3. DPO-matrix */}
          <DpoMatrix tools={tools} />

          {/* 4. Gebruiksstromen */}
          <UsageFlows tools={tools} />

          {/* 5. Footer */}
          <footer className="mt-auto pb-4 pt-8">
            <div className="border-t border-slate-200/60 pt-4">
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

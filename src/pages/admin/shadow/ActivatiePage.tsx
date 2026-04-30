import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDpoDashboard } from "@/hooks/useDpoDashboard";
import { KpiCard } from "@/components/dpo-shadow/KpiCard";
import { DashboardFooter } from "@/components/dpo-shadow/DashboardFooter";
import ScanConfigTab from "@/components/org-admin/ScanConfigTab";

export default function ActivatiePage() {
  const { profile } = useUserProfile();
  const { completedCount, pendingReviews, isLoading } = useDpoDashboard();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        <PageHeader
          title="Activatie"
          subtitle="Activeer de scan, nodig medewerkers uit en volg de respons. Inhoudelijke scanantwoorden worden hier niet op persoonsniveau getoond."
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            label="Voltooide scans"
            value={isLoading ? "…" : completedCount}
            sub="totaal afgeronde shadow AI-scans"
            tone="green"
          />
          <KpiCard
            label="Openstaande reviews"
            value={isLoading ? "…" : pendingReviews.length}
            sub="vereist DPO-aandacht"
            tone="amber"
          />
          <KpiCard label="Organisatie" value={profile?.org_id ? "actief" : "—"} sub="huidige context" />
          <KpiCard label="Status" value="Open" sub="scanperiode loopt" tone="blue" />
        </div>

        {/* Hergebruik bestaande config-tab voor uitnodigingen, amnesty en medewerkers */}
        <ScanConfigTab />

        <DashboardFooter />
      </div>
    </AppLayout>
  );
}

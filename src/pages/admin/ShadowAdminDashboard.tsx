import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import RouteAITransferSection from '@/components/admin/RouteAITransferSection';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ShadowAdminDashboard() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Shadow AI Survey — Beheer"
          description="Beheer de Shadow AI Survey voor je organisatie."
        />

        <Card>
          <CardContent className="pt-6">
            <RouteAITransferSection />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

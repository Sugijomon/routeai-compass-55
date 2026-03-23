import { useNavigate } from 'react-router-dom';
import { Settings, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import RouteAITransferSection from '@/components/admin/RouteAITransferSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ShadowAdminDashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Shadow AI Scan — Beheer"
          subtitle="Configureer de scan en bekijk de resultaten van je organisatie."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Kaart 1 — Scan configuratie */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Scan configuratie
              </CardTitle>
              <CardDescription>
                Configureer het amnestievenster, voeg bekende tools toe en nodig medewerkers uit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate('/admin?tab=scan-config')}
              >
                Configureren →
              </Button>
            </CardContent>
          </Card>

          {/* Kaart 2 — DPO dashboard */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                DPO Dashboard
              </CardTitle>
              <CardDescription>
                Bekijk risicoprofielen, tool-inventaris en compliance-exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate('/admin?tab=risk-profiles')}
              >
                Openen →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RouteAI Transfer sectie */}
        <Card>
          <CardContent className="pt-6">
            <RouteAITransferSection />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

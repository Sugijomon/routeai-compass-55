import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings, BarChart3, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ScanConfigTab from '@/components/org-admin/ScanConfigTab';
import DpoRiskProfilesTab from '@/components/org-admin/DpoRiskProfilesTab';
import { DpoNotificationBar } from '@/components/admin/DpoNotificationBar';
import ShadowScoreboard from '@/components/admin/ShadowScoreboard';
import RouteAITransferSection from '@/components/admin/RouteAITransferSection';
import { Card, CardContent } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOrgPlanType } from '@/hooks/useOrgPlanType';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ShadowAdminDashboard() {
  const location = useLocation();
  const { profile } = useUserProfile();
  const { planType } = useOrgPlanType();
  const orgId = profile?.org_id;

  // Bepaal of scan geconfigureerd is (amnesty_activated_at aanwezig)
  const { data: orgSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['shadow-admin-org-settings', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .maybeSingle();
      return data?.settings as Record<string, unknown> | null;
    },
    enabled: !!orgId,
  });

  // Bepaal of er scan-data is
  const { data: hasData } = useQuery({
    queryKey: ['shadow-admin-has-data', orgId],
    queryFn: async () => {
      if (!orgId) return false;
      const { count } = await supabase
        .from('shadow_survey_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .not('survey_completed_at', 'is', null);
      return (count ?? 0) > 0;
    },
    enabled: !!orgId,
  });

  // Hash-based tab
  const hashTab = location.hash.replace('#', '');
  const validTabs = ['instellingen', 'overzicht', 'scoreboard'];

  // Bepaal default tab
  const getDefaultTab = () => {
    if (hashTab && validTabs.includes(hashTab)) return hashTab;
    const isConfigured = !!orgSettings?.amnesty_activated_at;
    if (isConfigured && hasData) return 'overzicht';
    return 'instellingen';
  };

  const [activeTab, setActiveTab] = useState<string>('instellingen');

  // Update tab wanneer data geladen is
  useEffect(() => {
    if (!settingsLoading) {
      setActiveTab(getDefaultTab());
    }
  }, [settingsLoading, hasData, hashTab]);

  // Update URL hash bij tab-wissel
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  // Scoreboard tab altijd tonen — component toont upgrade-prompt indien nodig

  if (settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Shadow AI Scan — Beheer"
          subtitle="Configureer de scan en bekijk de resultaten van je organisatie."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start rounded-2xl bg-muted/60 p-1">
            <TabsTrigger
              value="instellingen"
              className="rounded-xl gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Instellingen
            </TabsTrigger>
            <TabsTrigger
              value="overzicht"
              className="rounded-xl gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger
              value="scoreboard"
              className="rounded-xl gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Trophy className="h-4 w-4" />
              Scoreboard
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Instellingen */}
          <TabsContent value="instellingen" className="mt-6">
            <ScanConfigTab />
          </TabsContent>

          {/* Tab 2: Overzicht */}
          <TabsContent value="overzicht" className="mt-6 space-y-6">
            {orgId && <DpoNotificationBar orgId={orgId} />}
            <DpoRiskProfilesTab />
          </TabsContent>

          {/* Tab 3: Scoreboard */}
          <TabsContent value="scoreboard" className="mt-6">
            <ShadowScoreboard />
          </TabsContent>
        </Tabs>

        {/* RouteAI Transfer sectie — altijd zichtbaar onder de tabs */}
        <Card>
          <CardContent className="pt-6">
            <RouteAITransferSection />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

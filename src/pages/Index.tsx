import { Shield, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LicenseStatusCard } from '@/components/dashboard/LicenseStatusCard';
import { TrainingProgressCard } from '@/components/dashboard/TrainingProgressCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { AdminStatsCard } from '@/components/dashboard/AdminStatsCard';
import { useAppStore } from '@/stores/useAppStore';

const Index = () => {
  const { currentRole, getCurrentUser, getCurrentUserProgress } = useAppStore();
  const user = getCurrentUser();
  const progress = getCurrentUserProgress();
  const isAdmin = currentRole === 'org_admin';

  return (
    <AppLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welkom terug, {user?.name?.split(' ')[0] || 'Gebruiker'}!
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Beheer het AI-gebruik binnen je organisatie'
                : 'Bekijk je AI authority en toegestane activiteiten'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin View */}
      {isAdmin && (
        <div className="mb-8">
          <AdminStatsCard />
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* License Status - Full width on mobile, 2 cols on desktop */}
        <div className="lg:col-span-2">
          <LicenseStatusCard license={user?.license || null} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActionsCard />
        </div>

        {/* Training Progress */}
        <div className="lg:col-span-2">
          <TrainingProgressCard progress={progress} />
        </div>

        {/* Info Card */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">RouteAI Framework</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dit platform helpt je organisatie om AI verantwoord te gebruiken volgens de vereisten van de EU AI Act.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Expliciete capabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span>Duidelijke grenzen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span>Automatische compliance</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;

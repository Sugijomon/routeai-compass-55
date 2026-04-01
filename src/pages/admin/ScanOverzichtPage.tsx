import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DpoNotificationBar } from '@/components/admin/DpoNotificationBar';
import DpoRiskProfilesTab from '@/components/org-admin/DpoRiskProfilesTab';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ScanOverzichtPage() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Overzicht"
          subtitle="Resultaten en risicoprofielen van je organisatie."
        />
        {orgId && <DpoNotificationBar orgId={orgId} />}
        <DpoRiskProfilesTab />
      </div>
    </AppLayout>
  );
}

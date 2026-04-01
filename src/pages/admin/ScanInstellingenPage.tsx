import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import ScanConfigTab from '@/components/org-admin/ScanConfigTab';

export default function ScanInstellingenPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Instellingen"
          subtitle="Configureer de scan en beheer medewerkers."
        />
        <ScanConfigTab />
      </div>
    </AppLayout>
  );
}

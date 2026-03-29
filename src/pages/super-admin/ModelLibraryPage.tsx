import { useState } from 'react';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypekaartenTab } from '@/components/super-admin/model-library/TypekaartenTab';
import { PendingUpdatesTab } from '@/components/super-admin/model-library/PendingUpdatesTab';
import { AlertsTab } from '@/components/super-admin/model-library/AlertsTab';
import { ChangelogTab } from '@/components/super-admin/model-library/ChangelogTab';

export default function ModelLibraryPage() {
  const [activeTab, setActiveTab] = useState('typekaarten');

  return (
    <AdminPageLayout
      title="Model Library"
      breadcrumbs={[
        { label: 'Platform', href: '/super-admin' },
        { label: 'Model Library' },
      ]}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="typekaarten">Typekaarten</TabsTrigger>
          <TabsTrigger value="pending">Pending updates</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="typekaarten">
          <TypekaartenTab />
        </TabsContent>

        <TabsContent value="pending">
          <PendingUpdatesTab />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogTab />
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import ShadowScoreboard from '@/components/admin/ShadowScoreboard';

export default function ScanScoreboardPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <PageHeader
          title="Scoreboard"
          subtitle="Publiceer je AI-transparantie naar je team."
        />
        <ShadowScoreboard />
      </div>
    </AppLayout>
  );
}

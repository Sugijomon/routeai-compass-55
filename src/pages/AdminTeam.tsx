import { Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminTeam = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Team Overzicht</h1>
            <p className="text-muted-foreground">
              Beheer de AI licenties van je teamleden
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teamleden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Teamgegevens worden geladen vanuit de database. Ga naar het Org Admin dashboard voor gebruikersbeheer.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AdminTeam;

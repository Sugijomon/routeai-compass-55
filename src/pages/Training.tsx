import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Training = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Literacy Training</h1>
            <p className="text-muted-foreground">
              Leer verantwoord omgaan met AI in je dagelijkse werk
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 text-center py-12">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Ga naar het leerplatform voor beschikbare trainingen en cursussen.
          </p>
          <Button asChild>
            <Link to="/learn">Naar Leerplatform</Link>
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Training;

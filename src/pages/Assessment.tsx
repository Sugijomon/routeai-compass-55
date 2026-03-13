import { ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Assessment = () => {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl text-center py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
          <ClipboardCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-4">AI Literacy Examen</h1>
        <p className="text-muted-foreground mb-8">
          Het examen is beschikbaar via het onboarding-traject. Ga naar het leerplatform om je examen af te leggen.
        </p>
        <Button asChild>
          <Link to="/learn">Naar Leerplatform</Link>
        </Button>
      </div>
    </AppLayout>
  );
};

export default Assessment;

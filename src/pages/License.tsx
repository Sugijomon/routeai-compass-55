import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';

const License = () => {
  const { hasAiRijbewijs } = useUserProfile();

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl text-center py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/10 mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h1 className="text-2xl font-bold mb-4">
          {hasAiRijbewijs ? 'AI-Rijbewijs Behaald' : 'Geen AI-Rijbewijs'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {hasAiRijbewijs
            ? 'Je hebt je AI-Rijbewijs behaald. Je hebt toegang tot de AI functies van RouteAI.'
            : 'Je hebt nog geen AI-Rijbewijs. Voltooi de AI Literacy training en leg het examen af om je rijbewijs te behalen.'}
        </p>
        {!hasAiRijbewijs && (
          <Button asChild size="lg">
            <Link to="/learn">
              Start Training
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default License;

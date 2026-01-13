import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { TRAINING_MODULES } from '@/data/trainingData';

export default function TrainingFlow() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">AI Training Modules</h1>
            <p className="text-muted-foreground">
              Voltooi alle modules om je AI-rijbewijs assessment te kunnen starten.
            </p>
          </div>

          <div className="grid gap-4">
            {TRAINING_MODULES.map((module, index) => (
              <Card key={module.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Module {index + 1}: {module.title}
                      </CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {module.durationMinutes} min
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Training module interactie wordt in een volgende versie toegevoegd.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

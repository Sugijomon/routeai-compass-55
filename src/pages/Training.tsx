import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Circle, Play, ChevronRight, Clock, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trainingModules } from '@/data/training';
import { useAppStore } from '@/stores/useAppStore';

const Training = () => {
  const { getCurrentUserProgress, getCurrentUser, completeModule } = useAppStore();
  const progress = getCurrentUserProgress();
  const user = getCurrentUser();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const completedCount = progress?.trainingProgress.filter(p => p.completed).length || 0;
  const totalModules = trainingModules.length;
  const allModulesCompleted = completedCount === totalModules;
  const hasLicense = user?.license?.status === 'active';

  const isModuleCompleted = (moduleId: string) => {
    return progress?.trainingProgress.find(p => p.moduleId === moduleId && p.completed);
  };

  const handleCompleteModule = (moduleId: string) => {
    completeModule(moduleId);
    setActiveModule(null);
  };

  return (
    <AppLayout>
      {/* Header */}
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

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voortgang</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} van {totalModules} modules voltooid
                </span>
              </div>
              <Progress value={(completedCount / totalModules) * 100} className="h-3" />
            </div>
            {allModulesCompleted && !hasLicense && (
              <Button asChild size="lg" className="gap-2">
                <Link to="/assessment">
                  <Award className="h-5 w-5" />
                  Start Scenario-Toets
                </Link>
              </Button>
            )}
            {hasLicense && (
              <Badge variant="outline" className="status-approved text-sm px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Licentie Behaald
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {trainingModules.map((module, index) => {
          const completed = isModuleCompleted(module.id);
          const isActive = activeModule === module.id;
          const isLocked = index > 0 && !isModuleCompleted(trainingModules[index - 1].id) && !completed;

          return (
            <Card 
              key={module.id} 
              className={`transition-all ${
                isActive ? 'ring-2 ring-primary' : ''
              } ${isLocked ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      completed ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {module.durationMinutes} minuten
                      </div>
                    </div>
                  </div>
                  {completed && (
                    <Badge variant="outline" className="status-approved">
                      Voltooid
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                
                {isActive ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-secondary p-4 text-sm prose prose-sm max-w-none">
                      {module.content.split('\n').slice(0, 10).map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))}
                      <p className="text-muted-foreground italic">... (scroll voor meer)</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleCompleteModule(module.id)} className="flex-1">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Markeer als Voltooid
                      </Button>
                      <Button variant="outline" onClick={() => setActiveModule(null)}>
                        Sluiten
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={completed ? "outline" : "default"}
                    className="w-full"
                    disabled={isLocked}
                    onClick={() => setActiveModule(module.id)}
                  >
                    {isLocked ? (
                      'Voltooi eerst de vorige module'
                    ) : completed ? (
                      <>
                        Bekijk Opnieuw
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Module
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assessment CTA */}
      {allModulesCompleted && !hasLicense && (
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Klaar voor de Toets!</h3>
                <p className="text-muted-foreground">
                  Je hebt alle modules voltooid. Leg nu de scenario-toets af om je AI Licentie te behalen.
                </p>
              </div>
              <Button asChild size="lg">
                <Link to="/assessment">
                  Start Toets
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Training;

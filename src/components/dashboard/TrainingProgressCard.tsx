import { GraduationCap, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { trainingModules } from '@/data/training';
import { UserProgress } from '@/types';

interface TrainingProgressCardProps {
  progress: UserProgress | undefined;
}

export function TrainingProgressCard({ progress }: TrainingProgressCardProps) {
  const completedCount = progress?.trainingProgress.filter(p => p.completed).length || 0;
  const totalModules = trainingModules.length;
  const progressPercentage = (completedCount / totalModules) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
          AI Literacy Training
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Voortgang</span>
            <span className="font-medium">{completedCount} / {totalModules} modules</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {trainingModules.map((module) => {
            const isCompleted = progress?.trainingProgress.find(
              p => p.moduleId === module.id && p.completed
            );
            
            return (
              <div
                key={module.id}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {module.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{module.durationMinutes} min</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button className="w-full" asChild>
          <Link to="/training">
            {completedCount === totalModules ? 'Start Toets' : 'Verder met Training'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

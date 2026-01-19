import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ArrowRight, GraduationCap, BookOpen } from 'lucide-react';
import { useOnboardingCourse } from '@/hooks/useOnboardingCourse';

interface OnboardingBannerProps {
  hasAiRijbewijs: boolean;
}

export function OnboardingBanner({ hasAiRijbewijs }: OnboardingBannerProps) {
  const navigate = useNavigate();
  const { onboardingCourse, progressPercentage, isLoading } = useOnboardingCourse();

  // Don't show if user has AI Rijbewijs
  if (hasAiRijbewijs) return null;

  // Don't show if no onboarding course exists
  if (!isLoading && !onboardingCourse) return null;

  const hasStarted = progressPercentage > 0;

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-400 text-lg font-semibold">
        ⚠️ Welkom bij RouteAI!
      </AlertTitle>
      <AlertDescription className="mt-3">
        <p className="text-amber-700 dark:text-amber-300 mb-4">
          Om AI-assessments te kunnen starten, moet je eerst de{' '}
          <strong>AI Rijbewijs cursus</strong> voltooien.
        </p>

        {hasStarted && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Jouw voortgang
              </span>
              <span className="font-medium text-amber-800 dark:text-amber-400">
                {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <Button
          onClick={() => navigate(`/learn/course/${onboardingCourse?.id}`)}
          className="gap-2"
          disabled={!onboardingCourse}
        >
          <GraduationCap className="h-4 w-4" />
          {hasStarted ? 'Hervat AI Rijbewijs Cursus' : 'Start AI Rijbewijs Cursus'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}

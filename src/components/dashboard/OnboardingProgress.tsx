import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboardingStatus, type OnboardingStatus } from '@/hooks/useOnboardingStatus';
import { CheckCircle, ChevronRight, GraduationCap, Shield, ScanSearch, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 'scan_pending', label: 'Shadow AI Scan', icon: ScanSearch },
  { id: 'learning', label: 'AI Literacy cursus', icon: GraduationCap },
  { id: 'exam_ready', label: 'Examen afleggen', icon: GraduationCap },
  { id: 'rijbewijs_done', label: 'AI-Rijbewijs behaald', icon: Shield },
] as const;

const CTA: Record<OnboardingStatus['step'], { label: string; href: string }> = {
  scan_pending: { label: 'Shadow AI Scan starten', href: '/shadow-survey' },
  learning: { label: 'Verder met de cursus', href: '/learn' },
  exam_ready: { label: 'Examen starten', href: '/onboarding/examen' },
  rijbewijs_done: { label: 'Eerste AI Check starten', href: '/assessments/new' },
  first_check_done: { label: 'AI Checks bekijken', href: '/assessments' },
};

export function OnboardingProgress() {
  const navigate = useNavigate();
  const status = useOnboardingStatus();

  // Verberg na eerste succesvolle check
  if (status.step === 'first_check_done' && status.hasFirstAssessment) {
    return null;
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === status.step);

  const subtitles: Record<OnboardingStatus['step'], string> = {
    scan_pending: 'Start met de Shadow AI Scan om inzicht te krijgen in je AI-gebruik.',
    learning: 'Voltooi de AI Literacy cursus om je AI-Rijbewijs te behalen.',
    exam_ready: 'Je bent klaar voor het examen — nog één stap naar je rijbewijs.',
    rijbewijs_done: 'Rijbewijs behaald! Start je eerste AI Check.',
    first_check_done: '',
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Aan de slag
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtitles[status.step]}
              </p>
            </div>

            {/* Voortgangsbalk */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Voortgang onboarding</span>
                <span className="font-medium">{status.percentage}%</span>
              </div>
              <Progress value={status.percentage} className="h-2" />
            </div>

            {/* Stap-indicatoren */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((step, i) => {
                const isDone = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.id} className="flex items-center gap-1.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        isDone
                          ? 'bg-primary text-primary-foreground'
                          : isCurrent
                          ? 'border-2 border-primary text-primary bg-primary/10'
                          : 'border border-border text-muted-foreground bg-muted'
                      }`}
                    >
                      {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-4 rounded-full transition-colors ${
                          isDone ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate(CTA[status.step].href)}
            size="sm"
            className="shrink-0 gap-2"
          >
            {CTA[status.step].label}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

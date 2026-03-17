import { cn } from '@/lib/utils';
import { Check, ClipboardList, ShieldCheck, GraduationCap, Award } from 'lucide-react';

interface Step {
  label: string;
  icon: React.ElementType;
  status: 'done' | 'active' | 'upcoming';
}

interface Props {
  currentStep: 'tools' | 'risk' | 'training' | 'license';
}

export default function SurveyJourneyProgress({ currentStep }: Props) {
  const stepDefs: { key: string; label: string; icon: React.ElementType }[] = [
    { key: 'tools', label: 'Tools in kaart', icon: ClipboardList },
    { key: 'risk', label: 'Risicoprofiel', icon: ShieldCheck },
    { key: 'training', label: 'Training', icon: GraduationCap },
    { key: 'license', label: 'Licentie activeren', icon: Award },
  ];

  const currentIndex = stepDefs.findIndex((s) => s.key === currentStep);

  const steps: Step[] = stepDefs.map((s, i) => ({
    label: s.label,
    icon: s.icon,
    status: i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'upcoming',
  }));

  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Stap-indicator */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                  step.status === 'done' && 'border-primary bg-primary text-primary-foreground',
                  step.status === 'active' && 'border-primary bg-primary/10 text-primary',
                  step.status === 'upcoming' && 'border-muted-foreground/30 bg-muted text-muted-foreground/50',
                )}
              >
                {step.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs text-center max-w-[80px] leading-tight',
                  step.status === 'done' && 'text-primary font-medium',
                  step.status === 'active' && 'text-primary font-semibold',
                  step.status === 'upcoming' && 'text-muted-foreground/60',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector lijn */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-20px]',
                  i < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

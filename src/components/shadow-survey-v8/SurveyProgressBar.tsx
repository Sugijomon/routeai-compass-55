/**
 * SurveyProgressBar — Herbruikbare voortgangsbalk voor Shadow AI Scan v8.1.
 *
 * Toont een rij van segmenten waar actieve segmenten gevuld zijn (#00658b)
 * en inactieve segmenten grijs (#e5e9eb). Rechts een label "Stap X van Y",
 * of de optionele `completedLabel` (bijv. "Voltooid") als die is opgegeven.
 */

interface SurveyProgressBarProps {
  currentStep: number; // 1-gebaseerd
  totalSteps: number;
  /** Vervangt het numerieke "Stap X van Y" label, bijvoorbeeld "Voltooid". */
  completedLabel?: string;
}

export function SurveyProgressBar({
  currentStep,
  totalSteps,
  completedLabel,
}: SurveyProgressBarProps) {
  const safeTotal = Math.max(1, totalSteps);
  const safeCurrent = Math.max(1, Math.min(currentStep, safeTotal));

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: safeTotal }).map((_, idx) => {
          const isActive = idx < safeCurrent;
          return (
            <div
              key={idx}
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: isActive ? "#00658b" : "#e5e9eb" }}
            />
          );
        })}
      </div>
      <span
        className="whitespace-nowrap text-[12px]"
        style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#40484e" }}
      >
        {completedLabel ?? `Stap ${safeCurrent} van ${safeTotal}`}
      </span>
    </div>
  );
}

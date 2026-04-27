/**
 * Shadow AI Scan V8.1 — Scherm 01: Disclosure / Amnestie
 *
 * Eerste scherm van de vragenlijst. Legt uit hoe de scan werkt en dat
 * antwoorden anoniem worden verwerkt. Bij klik op de startknop wordt
 * een nieuwe survey_run aangemaakt en het surveyRunId teruggegeven aan
 * de parent.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createSurveyRun } from "@/lib/shadowSurveyEngineV8";
import { useToast } from "@/hooks/use-toast";

interface Step01DisclosureProps {
  /** Organisatie waarvoor de scan wordt uitgevoerd. */
  orgId: string;
  /** Optionele scan-wave (campagne-ronde). */
  waveId?: string;
  /** Wordt aangeroepen zodra de survey_run is aangemaakt. */
  onSurveyRunCreated: (surveyRunId: string) => void;
  /** Wordt aangeroepen na succesvolle aanmaak om door te gaan naar scherm 02. */
  onContinue: () => void;
}

export function Step01Disclosure({
  orgId,
  waveId,
  onSurveyRunCreated,
  onContinue,
}: Step01DisclosureProps) {
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const surveyRunId = await createSurveyRun(orgId, waveId);
      onSurveyRunCreated(surveyRunId);
      onContinue();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Onbekende fout";
      toast({
        title: "Kon de scan niet starten",
        description: message,
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Card>
        <CardContent className="space-y-6 p-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welkom bij de AI-scan
            </h1>
            <p className="text-sm text-muted-foreground">
              Duurt ongeveer 5 tot 10 minuten.
            </p>
          </header>

          <div className="space-y-4 text-base leading-relaxed text-foreground">
            <p>
              Deze scan brengt in kaart welk AI-gebruik er in onze organisatie
              plaatsvindt. Jouw antwoorden worden anoniem verwerkt — we zien
              wél dat jij hebt deelgenomen, maar niet wat jij invult.
            </p>
            <p>
              Er is geen sprake van beoordeling of sanctie. We gebruiken de
              uitkomsten om betere tools, training en beleid te ontwikkelen.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              className="w-full"
              onClick={handleStart}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scan wordt gestart...
                </>
              ) : (
                "Ik begrijp dit, start de scan"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Step01Disclosure;

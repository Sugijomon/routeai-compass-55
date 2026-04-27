/**
 * Shadow AI Scan V8.1 — Wizard wrapper.
 *
 * Houdt surveyRunId en currentStep in state. Persisteert surveyRunId in
 * sessionStorage onder een org/wave-specifieke sleutel zodat een refresh
 * de bestaande run hervat (alleen als orgId + waveId overeenkomen).
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Step01Intro } from "@/components/shadow-survey-v8/Step01Intro";
import { Step02Werkplek } from "@/components/shadow-survey-v8/Step02Werkplek";
import { Step03Frequentie } from "@/components/shadow-survey-v8/Step03Frequentie";
import { Step04Toolpicker } from "@/components/shadow-survey-v8/Step04Toolpicker";
import { Step05Datatype } from "@/components/shadow-survey-v8/Step05Datatype";
import { Step06AccountMatrix } from "@/components/shadow-survey-v8/Step06AccountMatrix";
import { Step07VaardigheidSpelregels } from "@/components/shadow-survey-v8/Step07VaardigheidSpelregels";

function storageKey(orgId: string, waveId: string | undefined) {
  return `sai_v8_run_id:${orgId}:${waveId ?? "default"}`;
}

export default function ShadowSurveyV8Page() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orgId = params.get("org") ?? "";
  const waveId = params.get("wave") ?? undefined;
  const waveClosesAt = params.get("closes_at") ?? undefined;

  const [surveyRunId, setSurveyRunId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savedToolIds, setSavedToolIds] = useState<string[]>([]);

  // Hervat bestaande run uit sessionStorage als org/wave matchen.
  useEffect(() => {
    if (!orgId) return;
    try {
      const existing = sessionStorage.getItem(storageKey(orgId, waveId));
      if (existing) {
        setSurveyRunId(existing);
        setCurrentStep(2);
      }
    } catch {
      // sessionStorage niet beschikbaar — negeren.
    }
  }, [orgId, waveId]);

  const handleStart = (newSurveyRunId: string) => {
    setSurveyRunId(newSurveyRunId);
    try {
      sessionStorage.setItem(storageKey(orgId, waveId), newSurveyRunId);
    } catch {
      // sessionStorage niet beschikbaar — negeren.
    }
    setCurrentStep(2);
  };

  // Stap 1: Intro
  if (currentStep === 1 || !surveyRunId) {
    return (
      <Step01Intro
        orgId={orgId}
        waveId={waveId}
        waveClosesAt={waveClosesAt}
        onStart={handleStart}
      />
    );
  }

  // Stap 2: Werkplek (afdeling)
  if (currentStep === 2) {
    return (
      <Step02Werkplek
        surveyRunId={surveyRunId}
        onContinue={() => setCurrentStep(3)}
        onBack={() => setCurrentStep(1)}
      />
    );
  }

  // Stap 3: Gebruik & frequentie (kan vertakken naar exitpad → stap 9)
  if (currentStep === 3) {
    return (
      <Step03Frequentie
        surveyRunId={surveyRunId}
        onContinue={() => setCurrentStep(4)}
        onBack={() => setCurrentStep(2)}
        onExit={() => setCurrentStep(9)}
      />
    );
  }

  // Stap 4: Toolpicker
  if (currentStep === 4) {
    return (
      <Step04Toolpicker
        surveyRunId={surveyRunId}
        orgId={orgId}
        onContinue={(ids) => {
          setSavedToolIds(ids);
          setCurrentStep(5);
        }}
        onBack={() => setCurrentStep(3)}
      />
    );
  }

  // Stap 5: Datatype + awareness + anonimisering
  if (currentStep === 5) {
    return (
      <Step05Datatype
        surveyRunId={surveyRunId}
        onContinue={() => setCurrentStep(6)}
        onBack={() => setCurrentStep(4)}
      />
    );
  }

  // Stap 6: Account-matrix + browserextensies + automatisering
  if (currentStep === 6) {
    if (savedToolIds.length === 0) {
      // Tools-state ging verloren (refresh op stap 6) — terug naar tool-picker.
      setCurrentStep(4);
      return null;
    }
    return (
      <Step06AccountMatrix
        surveyRunId={surveyRunId}
        savedToolIds={savedToolIds}
        onContinue={() => setCurrentStep(7)}
        onBack={() => setCurrentStep(5)}
      />
    );
  }

  // Stap 7: Vaardigheid & Spelregels
  if (currentStep === 7) {
    return (
      <Step07VaardigheidSpelregels
        surveyRunId={surveyRunId}
        onContinue={() => setCurrentStep(8)}
        onBack={() => setCurrentStep(6)}
      />
    );
  }

  // Tijdelijke placeholder voor vervolgstappen (worden later gebouwd).
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        className="max-w-md rounded-[1.25rem] bg-white/85 p-8 text-center shadow-sm"
        style={{ border: "1px solid rgba(255,255,255,0.8)", backdropFilter: "blur(16px)" }}
      >
        <h2
          className="mb-2 text-xl"
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#00658b" }}
        >
          Stap {currentStep}
        </h2>
        <p style={{ color: "#40484e", fontSize: 14 }}>
          Survey run gestart. Vervolgstappen worden in een volgende sessie toegevoegd.
        </p>
        <p className="mt-3 text-xs" style={{ color: "#6993aa" }}>
          Run-ID: <code>{surveyRunId}</code>
        </p>
        {savedToolIds.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: "#6993aa" }}>
            Tools opgeslagen: {savedToolIds.length}
          </p>
        )}
      </div>
    </div>
  );
}

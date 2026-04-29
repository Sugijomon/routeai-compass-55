/**
 * Shadow AI Scan V8.1 — Stap 9: Afronding.
 *
 * - Roept bij mount completeSurveyRun aan (zet alleen completed_at, raakt
 *   ambassador-velden NIET aan; die blijven null tot expliciete keuze).
 * - Verwijdert de sessionStorage-sleutel voor deze run.
 * - Toont ambassador-keuze (Ja/Nee). Pas bij geldig e-mailadres of expliciete
 *   "Nee" wordt updateAmbassador aangeroepen.
 * - Sluit-knop probeert window.close() en toont een hint als dat niet werkt.
 */

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import {
  completeSurveyRun,
  updateAmbassador,
} from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Props
// ============================================================================

interface Step09AfrondingProps {
  surveyRunId: string;
  orgId: string;
  waveId?: string;
}

function storageKey(orgId: string, waveId: string | undefined) {
  return `sai_v8_run_id:${orgId}:${waveId ?? "default"}`;
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  // Bewust simpele check: niet leeg en bevat een @.
  return trimmed.includes("@");
}

// ============================================================================
// Hoofdcomponent
// ============================================================================

export function Step09Afronding({
  surveyRunId,
  orgId,
  waveId,
}: Step09AfrondingProps) {
  const [isCompleting, setIsCompleting] = useState(true);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [ambassadorChoice, setAmbassadorChoice] = useState<"ja" | "nee" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [neeSaving, setNeeSaving] = useState(false);
  const [neeError, setNeeError] = useState<string | null>(null);
  const [showCloseHint, setShowCloseHint] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Heeft de respondent ingetypt e-mail dat nog niet is opgeslagen?
  const hasUnsavedEmail =
    ambassadorChoice === "ja" && emailInput.trim().length > 0 && !emailSaved;
  const emailValid = isValidEmail(emailInput);

  // Bij mount: zet completed_at en ruim sessionStorage op.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await completeSurveyRun(surveyRunId);
        if (cancelled) return;
        try {
          sessionStorage.removeItem(storageKey(orgId, waveId));
        } catch {
          // sessionStorage niet beschikbaar — negeren.
        }
        setIsCompleting(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Onbekende fout";
        setCompleteError(message);
        setIsCompleting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surveyRunId, orgId, waveId]);

  async function handleJaClick() {
    setAmbassadorChoice("ja");
    setNeeError(null);
    // Wacht op opslaan e-mail — geen DB-call nu.
  }

  async function handleNeeClick() {
    if (neeSaving) return;
    setAmbassadorChoice("nee");
    setEmailSaved(false);
    setEmailError(null);
    setNeeError(null);
    setNeeSaving(true);
    try {
      await updateAmbassador(surveyRunId, false, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setNeeError(`Opslaan mislukt: ${message}`);
    } finally {
      setNeeSaving(false);
    }
  }

  async function handleEmailSave() {
    if (emailSaving) return;
    if (!isValidEmail(emailInput)) {
      setEmailError("Voer een geldig e-mailadres in");
      return;
    }
    setEmailError(null);
    setEmailSaving(true);
    try {
      await updateAmbassador(surveyRunId, true, emailInput.trim());
      setEmailSaved(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setEmailError(`Opslaan mislukt: ${message}`);
    } finally {
      setEmailSaving(false);
    }
  }

  function handleClose() {
    try {
      window.close();
    } catch {
      // negeer
    }
    // Fallback: window.close() werkt alleen voor script-geopende tabbladen.
    setTimeout(() => {
      setShowCloseHint(true);
    }, 300);
  }

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <SurveyProgressBar currentStep={5} totalSteps={5} completedLabel="Voltooid" />
        </div>

        <div
          className="glass-card rounded-[2rem] p-8 md:p-10 text-center"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 8px 40px rgba(0, 101, 139, 0.08)",
          }}
        >
          {isCompleting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00658b" }} />
              <p className="mt-4 text-sm" style={{ color: "#40484e" }}>
                Antwoorden opslaan...
              </p>
            </div>
          ) : (
            <>
              {completeError && (
                <div
                  className="mb-6 rounded-lg border px-4 py-3 text-sm text-left"
                  style={{
                    background: "#fffbeb",
                    borderColor: "#fde68a",
                    color: "#92400e",
                  }}
                >
                  Je antwoorden zijn waarschijnlijk opgeslagen, maar er is iets misgegaan
                  bij het afsluiten. Neem contact op als je twijfelt.
                </div>
              )}

              {/* Verificatie-cirkel */}
              <div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: "#e8f6d6",
                  border: "1px solid #cfe8ab",
                }}
              >
                <CheckCircle2
                  style={{ width: 44, height: 44, color: "#4d7f13" }}
                  strokeWidth={2}
                />
              </div>

              {/* Status badge */}
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{ background: "#eef8df", border: "1px solid #d7edb8" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#6fa81f" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#3d6c09" }}
                >
                  Scan afgerond
                </span>
              </div>

              <h2
                className="mb-3"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.875rem",
                  color: "#00658b",
                  lineHeight: 1.2,
                }}
              >
                Bedankt voor je deelname!
              </h2>
              <p className="mb-6" style={{ fontSize: 15, color: "#40484e" }}>
                Je antwoorden zijn veilig en anoniem opgeslagen.
              </p>

              <hr
                className="my-10 w-full"
                style={{ border: 0, borderTop: "1px solid rgba(191,199,207,0.4)" }}
              />

              {/* Ambassador-sectie — alleen als surveyRunId aanwezig */}
              {surveyRunId && (
                <div className="text-center">
                  <h3
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      color: "#00658b",
                    }}
                  >
                    Meebouwen als AI-ambassadeur?
                  </h3>
                  <p
                    className="mt-1 mb-5"
                    style={{ fontSize: 14, color: "#40484e" }}
                  >
                    We zoeken enthousiaste collega's om mee te denken over nieuwe tools,
                    slimme prompts en best practices. Iets voor jou?
                  </p>

                  <div className="mb-6 flex gap-3">
                    <MoptButton
                      variant="ja"
                      selected={ambassadorChoice === "ja"}
                      onClick={handleJaClick}
                    >
                      Ja, lijkt me leuk
                    </MoptButton>
                    <MoptButton
                      variant="nee"
                      selected={ambassadorChoice === "nee"}
                      onClick={handleNeeClick}
                      disabled={neeSaving}
                    >
                      {neeSaving ? "Opslaan..." : "Nee, liever niet"}
                    </MoptButton>
                  </div>

                  {neeError && (
                    <p
                      className="mb-4 text-left"
                      style={{ fontSize: 12, color: "#e11d48" }}
                    >
                      {neeError}
                    </p>
                  )}

                  {/* E-mail reveal */}
                  <div
                    style={{
                      maxHeight: ambassadorChoice === "ja" ? 180 : 0,
                      opacity: ambassadorChoice === "ja" ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 300ms ease, opacity 300ms ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(255,255,255,0.9)",
                        border: "1.5px solid #bfc7cf",
                        borderRadius: 9999,
                        padding: "6px 6px 6px 12px",
                      }}
                    >
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailSaved(false);
                          setEmailError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEmailSave();
                          }
                        }}
                        placeholder="E-mailadres"
                        disabled={emailSaving}
                        style={{
                          width: "100%",
                          padding: 8,
                          border: 0,
                          fontSize: 13,
                          color: "#181c1e",
                          background: "transparent",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleEmailSave}
                        disabled={emailSaving}
                        aria-label="E-mailadres opslaan"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9999,
                          border: "1.5px solid #00658b",
                          background: emailSaving ? "#004c6a" : "#00658b",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: emailSaving ? "not-allowed" : "pointer",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (!emailSaving)
                            e.currentTarget.style.background = "#004c6a";
                        }}
                        onMouseLeave={(e) => {
                          if (!emailSaving)
                            e.currentTarget.style.background = "#00658b";
                        }}
                      >
                        {emailSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check style={{ width: 18, height: 18 }} />
                        )}
                      </button>
                    </div>

                    {emailSaved && !emailError && (
                      <p
                        className="text-left"
                        style={{ fontSize: 12, color: "#00658b", marginTop: 8 }}
                      >
                        E-mailadres opgeslagen.
                      </p>
                    )}
                    {emailError && (
                      <p
                        className="text-left"
                        style={{ fontSize: 12, color: "#e11d48", marginTop: 6 }}
                      >
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sluit-knop */}
              <div className="mt-10 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ color: "#40484e", background: "transparent", border: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#00658b")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#40484e")}
                >
                  <X style={{ width: 18, height: 18 }} />
                  Sluiten
                </button>
                {showCloseHint && (
                  <p className="mt-2" style={{ fontSize: 13, color: "#40484e" }}>
                    Je kunt dit tabblad nu sluiten.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponent — .mopt knop
// ============================================================================

interface MoptButtonProps {
  variant: "ja" | "nee";
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function MoptButton({
  variant,
  selected,
  onClick,
  disabled,
  children,
}: MoptButtonProps) {
  const base: React.CSSProperties = {
    flex: 1,
    padding: "14px 12px",
    borderRadius: "1rem",
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    textAlign: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 180ms ease",
    borderStyle: "solid",
    borderWidth: 1.5,
  };

  let style: React.CSSProperties;
  if (variant === "ja") {
    style = selected
      ? {
          ...base,
          borderColor: "#004c6a",
          background: "rgba(197,231,255,0.38)",
          color: "#004c6a",
        }
      : {
          ...base,
          borderColor: "#cfe8f7",
          background: "#eef8ff",
          color: "#0b5f81",
        };
  } else {
    style = selected
      ? {
          ...base,
          borderColor: "#bfc7cf",
          background: "#f1f4f6",
          color: "#70787f",
        }
      : {
          ...base,
          borderColor: "#bfc7cf",
          background: "rgba(255,255,255,0.72)",
          color: "#40484e",
        };
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseEnter={(e) => {
        if (!selected && !disabled) {
          e.currentTarget.style.borderColor = "#00658b";
          if (variant === "ja") {
            e.currentTarget.style.background = "rgba(197,231,255,0.2)";
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !disabled) {
          if (variant === "ja") {
            e.currentTarget.style.borderColor = "#cfe8f7";
            e.currentTarget.style.background = "#eef8ff";
          } else {
            e.currentTarget.style.borderColor = "#bfc7cf";
            e.currentTarget.style.background = "rgba(255,255,255,0.72)";
          }
        }
      }}
    >
      {children}
    </button>
  );
}

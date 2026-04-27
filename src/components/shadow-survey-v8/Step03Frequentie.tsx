/**
 * Shadow AI Scan V8.1 — Scherm 03: Gebruik & frequentie
 *
 * Visueel gebaseerd op screen-03-frequentie.html. Vertakt in:
 *  - Normaal pad: frequentie + multi-select motivaties → onContinue()
 *  - Exitpad ("nooit" gekozen): frequentie + reden → onExit()
 *
 * Schrijft `survey_profile` via upsert (ai_frequency_code,
 * eventueel no_ai_reason_code) en op het normale pad ook
 * `survey_motivation` (delete + insert) met optionele other_text
 * voor de "Anders..."-motivatie.
 */

import { useEffect, useRef, useState } from "react";
import { saveSurveyProfile, saveMotivations } from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

interface Step03FrequentieProps {
  surveyRunId: string;
  onContinue: () => void; // normaal pad → stap 4
  onBack: () => void;
  onExit: () => void; // exitpad → stap 9 (afronding)
}

interface FreqOption {
  code: "dagelijks" | "wekelijks" | "maandelijks" | "nooit";
  label: string;
  isExit: boolean;
}

const FREQ_OPTIONS: FreqOption[] = [
  { code: "dagelijks", label: "Dagelijks (meerdere keren per dag)", isExit: false },
  { code: "wekelijks", label: "Wekelijks (een paar keer per week)", isExit: false },
  { code: "maandelijks", label: "Maandelijks (incidenteel)", isExit: false },
  { code: "nooit", label: "Ik gebruik momenteel geen AI-tools", isExit: true },
];

interface ExitOption {
  code: "geen_behoefte" | "mag_niet" | "weet_niet_hoe";
  label: string;
}

const EXIT_OPTIONS: ExitOption[] = [
  { code: "geen_behoefte", label: "Ik zie de toegevoegde waarde nog niet" },
  { code: "mag_niet", label: "Het is expliciet verboden op mijn afdeling" },
  { code: "weet_niet_hoe", label: "Ik weet niet hoe ik moet beginnen" },
];

interface MotOption {
  code: string;
  label: string;
}

const MOT_OPTIONS: MotOption[] = [
  { code: "tijdswinst", label: "Tijdswinst — Ik krijg mijn taken sneller af." },
  { code: "kwaliteit", label: "Kwaliteitsverbetering — De output is beter, creatiever of foutlozer." },
  { code: "complexe_taken", label: "Complexe taken — Het helpt me bij zaken die ik (vrijwel) niet zelf kan." },
  { code: "inspiratie", label: "Inspiratie & Brainstormen — Het helpt me om over een 'leeg vel' heen te komen." },
  { code: "experimenteren", label: "Experimenteren — Ik wil ontdekken wat de techniek voor mijn rol kan betekenen." },
  { code: "anders_mot", label: "Anders..." },
];

function Icon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

// Radio-rij — exact zoals scherm 02 (radio_ring + radio_dot).
function RadioRow({
  selected,
  onClick,
  children,
  size = "md",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "md" | "sm";
}) {
  const ringSize = size === "sm" ? 16 : 22;
  const dotSize = size === "sm" ? 8 : 10;
  const padding = size === "sm" ? "10px 16px" : "16px 20px";

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#00658b";
          e.currentTarget.style.background = "rgba(196,231,255,0.2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#bfc7cf";
          e.currentTarget.style.background = "rgba(255,255,255,0.72)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding,
        borderRadius: "1rem",
        border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
        background: selected ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
        cursor: "pointer",
        transition: "all .2s ease",
        marginBottom: size === "sm" ? 0 : 10,
        outline: "none",
      }}
    >
      <div
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `2px solid ${selected ? "#00658b" : "#bfc7cf"}`,
          background: "white",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: selected ? "#00658b" : "transparent",
            transition: "all .2s ease",
          }}
        />
      </div>
      <span
        style={{
          color: "#181c1e",
          fontSize: size === "sm" ? 14 : 15,
          fontWeight: selected ? 600 : 500,
          lineHeight: 1.35,
        }}
      >
        {children}
      </span>
    </div>
  );
}

// Multi-select checkbox-rij voor motivaties (.mot-opt).
function CheckboxRow({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#00658b";
          e.currentTarget.style.background = "rgba(196,231,255,0.2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#bfc7cf";
          e.currentTarget.style.background = "rgba(255,255,255,0.72)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: "1rem",
        border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
        background: selected ? "rgba(196,231,255,0.35)" : "rgba(255,255,255,0.72)",
        cursor: "pointer",
        transition: "all .2s ease",
        outline: "none",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${selected ? "#00658b" : "#bfc7cf"}`,
          background: "white",
          flexShrink: 0,
          position: "relative",
          transition: "all .2s ease",
        }}
      >
        {selected && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 5,
              top: 1,
              width: 6,
              height: 11,
              borderRight: "2px solid #00658b",
              borderBottom: "2px solid #00658b",
              transform: "rotate(45deg)",
            }}
          />
        )}
      </div>
      <span style={{ fontSize: 15, lineHeight: 1.35, color: "#181c1e" }}>{children}</span>
    </div>
  );
}

export function Step03Frequentie({
  surveyRunId,
  onContinue,
  onBack,
  onExit,
}: Step03FrequentieProps) {
  const [freqSelected, setFreqSelected] = useState<string | null>(null);
  const [isExitPath, setIsExitPath] = useState(false);
  const [exitReason, setExitReason] = useState<string | null>(null);
  const [motivaties, setMotivaties] = useState<Set<string>>(new Set());
  const [andersMotText, setAndersMotText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const andersInputRef = useRef<HTMLInputElement | null>(null);

  const andersMotSelected = motivaties.has("anders_mot");

  // Auto-focus "Anders"-toelichtingsveld zodra het uitschuift.
  useEffect(() => {
    if (!andersMotSelected) return;
    const t = setTimeout(() => andersInputRef.current?.focus(), 270);
    return () => clearTimeout(t);
  }, [andersMotSelected]);

  const selectFreq = (opt: FreqOption) => {
    setFreqSelected(opt.code);
    setIsExitPath(opt.isExit);
    if (opt.isExit) {
      // Exitpad: motivaties zijn niet relevant.
      setMotivaties(new Set());
      setAndersMotText("");
    } else {
      // Normaal pad: exitreden wissen.
      setExitReason(null);
    }
    if (error) setError(null);
  };

  const toggleMot = (code: string) => {
    setMotivaties((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    if (error) setError(null);
  };

  const submitDisabled = (() => {
    if (isLoading) return true;
    if (!freqSelected) return true;
    if (isExitPath) return !exitReason;
    return motivaties.size === 0;
  })();

  const handleSubmit = async () => {
    if (submitDisabled) return;
    setIsLoading(true);
    setError(null);

    try {
      if (isExitPath) {
        await saveSurveyProfile(surveyRunId, {
          ai_frequency_code: "nooit",
          no_ai_reason_code: exitReason,
        });
        onExit();
        return;
      }

      // Normaal pad
      await saveSurveyProfile(surveyRunId, {
        ai_frequency_code: freqSelected,
        no_ai_reason_code: null,
      });

      const trimmed = andersMotText.trim();
      const motivationPayload = [...motivaties].map((code) => ({
        code,
        other_text: code === "anders_mot" && trimmed.length > 0 ? trimmed : null,
      }));

      await saveMotivations(surveyRunId, motivationPayload);
      onContinue();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Opslaan mislukt. Probeer het opnieuw.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Decoratieve nebula-blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
          style={{ background: "#7dd0ff", filter: "blur(80px)", opacity: 0.25 }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
          style={{ background: "#bae6ff", filter: "blur(80px)", opacity: 0.25 }}
        />
      </div>

      <div className="relative mx-auto max-w-2xl px-6">
        {/* Header */}
        <header className="flex items-start justify-between pb-4 pt-[30px]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "#00658b" }}
            >
              <Icon name="shield_lock" style={{ fontSize: 32, color: "white" }} />
            </div>
            <div className="leading-tight">
              <div
                className="text-2xl"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#181c1e" }}
              >
                Shadow AI Scan
              </div>
              <div className="text-[13px]" style={{ color: "#6993aa" }}>
                Veilig innoveren met AI
              </div>
            </div>
          </div>
          <span
            className="whitespace-nowrap rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm"
            style={{
              background: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderColor: "rgba(191,199,207,0.4)",
              color: "#40484e",
            }}
          >
            Vertrouwelijk &amp; anoniem
          </span>
        </header>

        {/* Voortgangsbalk */}
        <div className="mb-6">
          <SurveyProgressBar currentStep={2} totalSteps={5} />
        </div>

        {/* Card */}
        <section
          className="mb-10 p-8 md:p-10"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.70)",
            borderRadius: "2rem",
            boxShadow: "0 8px 40px rgba(0,101,139,0.06)",
          }}
        >
          {/* Card header + uitleg-toggle */}
          <div className="mb-8">
            <div
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,101,139,0.7)" }}
            >
              <Icon name="update" style={{ fontSize: 15 }} />
              <span>Gebruik &amp; frequentie</span>
            </div>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
              }}
            >
              Hoe vaak gebruik je AI-tools voor je werk?
            </h2>

            {/* Info-collapse */}
            <div
              className="mb-4 mt-3 p-3"
              style={{
                background: "#f1f4f6",
                border: "1px solid rgba(191,199,207,0.3)",
                borderRadius: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                aria-expanded={infoOpen}
                className="flex w-full cursor-pointer items-center gap-2 px-1 py-0.5 text-left"
                style={{ background: "transparent", border: "none" }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Icon name="info" style={{ fontSize: 18, color: "#00658b" }} />
                </div>
                <span
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: "#00658b" }}
                >
                  Wat zijn AI-tools en toepassingen?
                </span>
                <Icon
                  name="expand_more"
                  style={{
                    fontSize: 18,
                    color: "#00658b",
                    transform: infoOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform .22s ease",
                  }}
                />
              </button>
              <div
                style={{
                  maxHeight: infoOpen ? 400 : 0,
                  opacity: infoOpen ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height .3s ease, opacity .25s ease",
                }}
              >
                <div
                  className="mt-3 space-y-2 border-t pt-3 text-[13px] leading-relaxed"
                  style={{ borderColor: "rgba(191,199,207,0.2)", color: "#40484e" }}
                >
                  <p>
                    Onder AI-tools verstaan we slimme software die tekst, afbeeldingen, code of
                    berekeningen voor je kan genereren of verbeteren. Het gaat niet alleen om grote
                    projecten; ook het af en toe herschrijven van een e-mail, het samenvatten van
                    een vergadering of het vertalen van een kort tekstblok via tools als ChatGPT,
                    Gemini of Grammarly telt als AI-gebruik.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequentie-opties */}
          <div role="radiogroup" aria-label="Gebruiksfrequentie" className="flex flex-col">
            {FREQ_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.code}
                selected={freqSelected === opt.code}
                onClick={() => selectFreq(opt)}
              >
                {opt.label}
              </RadioRow>
            ))}
          </div>

          {/* Exit-blok */}
          <div
            style={{
              maxHeight: isExitPath ? 500 : 0,
              opacity: isExitPath ? 1 : 0,
              overflow: "hidden",
              transition: "max-height .4s ease, opacity .4s ease, margin-top .4s ease",
              marginTop: isExitPath ? 20 : 0,
            }}
          >
            <div
              className="p-3"
              style={{
                background: "rgba(0,101,139,0.05)",
                border: "1px solid rgba(0,101,139,0.10)",
                borderRadius: "1rem",
              }}
            >
              <h3
                className="mb-2 text-xs uppercase leading-tight tracking-wider"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#00658b" }}
              >
                Wat is de belangrijkste reden?
              </h3>
              <div role="radiogroup" aria-label="Reden" className="grid grid-cols-1 gap-1.5">
                {EXIT_OPTIONS.map((opt) => (
                  <RadioRow
                    key={opt.code}
                    selected={exitReason === opt.code}
                    onClick={() => {
                      setExitReason(opt.code);
                      if (error) setError(null);
                    }}
                    size="sm"
                  >
                    {opt.label}
                  </RadioRow>
                ))}
              </div>
            </div>
          </div>

          {/* Motivatie-blok — verborgen op exitpad */}
          {!isExitPath && (
            <div className="mt-[18px]">
              <h3
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  lineHeight: 1.25,
                  color: "#00658b",
                  marginBottom: "0.45rem",
                }}
              >
                Waarom gebruik je AI-tools in je werk?
              </h3>
              <p
                className="mb-3 inline-block"
                style={{
                  fontSize: "0.875rem",
                  color: "#40484e",
                  background: "#f1f4f6",
                  border: "1px solid rgba(191,199,207,0.7)",
                  borderRadius: 9999,
                  padding: "6px 12px",
                }}
              >
                Meerdere antwoorden mogelijk.
              </p>

              <div role="group" aria-label="Motivaties" className="grid grid-cols-1 gap-[10px]">
                {MOT_OPTIONS.map((opt) => (
                  <div key={opt.code}>
                    <CheckboxRow
                      selected={motivaties.has(opt.code)}
                      onClick={() => toggleMot(opt.code)}
                    >
                      {opt.label}
                    </CheckboxRow>

                    {opt.code === "anders_mot" && (
                      <div
                        style={{
                          maxHeight: andersMotSelected ? 80 : 0,
                          opacity: andersMotSelected ? 1 : 0,
                          overflow: "hidden",
                          transition: "max-height .25s ease, opacity .25s ease, margin-top .25s ease",
                          marginTop: andersMotSelected ? 8 : 0,
                        }}
                      >
                        <input
                          ref={andersInputRef}
                          type="text"
                          value={andersMotText}
                          onChange={(e) => setAndersMotText(e.target.value)}
                          placeholder="Toelichting..."
                          aria-label="Andere motivatie"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#00658b";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,101,139,0.14)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "#bfc7cf";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          style={{
                            width: "100%",
                            border: "1.5px solid #bfc7cf",
                            borderRadius: "0.85rem",
                            padding: "10px 12px",
                            fontSize: 14,
                            color: "#181c1e",
                            background: "#fff",
                            outline: "none",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            transition: "border-color .15s ease, box-shadow .15s ease",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="mt-4 flex items-center justify-between pt-8"
            style={{ borderTop: "1px solid rgba(191,199,207,0.2)" }}
          >
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{
                fontFamily: "'Manrope', sans-serif",
                color: "#40484e",
                background: "transparent",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.color = "#00658b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#40484e";
              }}
            >
              <Icon
                name="arrow_back"
                style={{ fontSize: 20, transition: "transform .2s ease" }}
                className="group-hover:-translate-x-0.5"
              />
              Vorige
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:-translate-y-0.5"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: submitDisabled ? "#7aa3b6" : "#00658b",
              }}
              onMouseEnter={(e) => {
                if (!submitDisabled) e.currentTarget.style.background = "#004c6a";
              }}
              onMouseLeave={(e) => {
                if (!submitDisabled) e.currentTarget.style.background = "#00658b";
              }}
            >
              {isLoading ? (
                <>
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Opslaan...
                </>
              ) : (
                <>
                  Volgende
                  <Icon
                    name="arrow_forward"
                    style={{ fontSize: 20, transition: "transform .2s ease" }}
                    className="group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-right text-sm" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Shadow AI Scan V8.1 — Stap 8: Toekomst & ambities.
 *
 * Schrijft naar:
 *   - survey_top_concern (delete + insert per surveyRunId, single-select → één rij)
 *   - survey_support_need (delete + insert per surveyRunId, multi-select)
 *   - survey_profile (upsert: top_concern_other_text, future_usecases_text)
 *     — overschrijft geen andere profielvelden
 *
 * Validatie:
 *   - zorgen verplicht
 *   - bij zorgen === 'anders' is andersZorgenText verplicht
 *   - minstens één supportNeed verplicht
 *   - innovatieText is optioneel
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Rocket, Send } from "lucide-react";
import {
  saveSupportNeeds,
  saveSurveyProfile,
  saveTopConcerns,
} from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Props
// ============================================================================

interface Step08ToekomstProps {
  surveyRunId: string;
  onContinue: () => void;
  onBack: () => void;
  /** True wanneer respondent via stap 3 'geen AI-gebruik' hier is geland.
   * In dat geval verbergen we tekst die AI-gebruik veronderstelt. */
  isExitPath?: boolean;
}

// ============================================================================
// Configuratie
// ============================================================================

const ZORGEN_OPTIONS: { code: string; label: string }[] = [
  { code: "leercurve", label: "Leercurve - het kost me te veel tijd om het goed te leren" },
  { code: "accuratesse", label: "Accuratesse - ik vertrouw de uitkomsten niet altijd" },
  { code: "kosten", label: "Kosten - ik wil geen privégeld uitgeven aan zakelijke tools" },
  { code: "privacy", label: "Privacy & security - ik weet niet of mijn data veilig is" },
  { code: "geen_zorg", label: "Geen bijzondere zorgen" },
  { code: "anders", label: "Anders..." },
];

const SUPPORT_OPTIONS: { code: string; label: string }[] = [
  {
    code: "duidelijke_spelregels",
    label: "Duidelijke spelregels - heldere richtlijnen over wat wel en niet mag.",
  },
  {
    code: "inspiratie_voorbeelden",
    label:
      "Inspiratie & voorbeelden - concrete use cases van collega's of andere organisaties.",
  },
  {
    code: "opleiding_training",
    label:
      "Opleiding & training - praktische workshops om beter te leren prompten of tools te doorgronden.",
  },
  {
    code: "samen_oefenen",
    label:
      "Samen oefenen - een klankbordgroep of 'AI-café' om ervaringen uit te wisselen.",
  },
  {
    code: "officiele_licenties",
    label: "Officiële licenties - toegang tot betaalde/zakelijke versies van tools.",
  },
  {
    code: "technisch_advies",
    label: "Technisch advies - hulp bij het veilig inrichten van AI-workflows.",
  },
];

const MAX_TEXT = 500;

// ============================================================================
// Subcomponenten
// ============================================================================

interface RadioCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

function RadioCard({ label, selected, onClick, children }: RadioCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "block",
        padding: "16px 20px",
        borderRadius: "1rem",
        border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
        background: selected ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
        marginBottom: 10,
        cursor: "pointer",
        transition: "all 180ms ease",
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
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "9999px",
            border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
            background: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "9999px",
              background: selected ? "#00658b" : "transparent",
              transition: "background 180ms ease",
            }}
          />
        </span>
        <span style={{ fontSize: 15, color: "#1a1f24", lineHeight: 1.4 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

interface CheckCardProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function CheckCard({ label, checked, onToggle }: CheckCardProps) {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
        borderRadius: "1rem",
        border: `1.5px solid ${checked ? "#00658b" : "#bfc7cf"}`,
        background: checked ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
        marginBottom: 10,
        cursor: "pointer",
        transition: "all 180ms ease",
      }}
      onMouseEnter={(e) => {
        if (!checked) {
          e.currentTarget.style.borderColor = "#00658b";
          e.currentTarget.style.background = "rgba(196,231,255,0.2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!checked) {
          e.currentTarget.style.borderColor = "#bfc7cf";
          e.currentTarget.style.background = "rgba(255,255,255,0.72)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${checked ? "#00658b" : "#bfc7cf"}`,
          background: "#fff",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {checked && (
          <span
            style={{
              position: "absolute",
              left: 5,
              top: 1,
              width: 6,
              height: 11,
              border: "solid #00658b",
              borderWidth: "0 2px 2px 0",
              transform: "rotate(45deg)",
            }}
          />
        )}
      </span>
      <span style={{ fontSize: 15, color: "#1a1f24", lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

// ============================================================================
// Hoofdcomponent
// ============================================================================

export function Step08Toekomst({
  surveyRunId,
  onContinue,
  onBack,
  isExitPath = false,
}: Step08ToekomstProps) {
  const [zorgen, setZorgen] = useState<string | null>(null);
  const [andersZorgenText, setAndersZorgenText] = useState("");
  const [innovatieText, setInnovatieText] = useState("");
  const [supportNeeds, setSupportNeeds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAndersWarning, setShowAndersWarning] = useState(false);

  const andersInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus op anders-veld na 220ms zodra anders gekozen wordt.
  useEffect(() => {
    if (zorgen === "anders") {
      const t = setTimeout(() => {
        andersInputRef.current?.focus();
      }, 220);
      return () => clearTimeout(t);
    }
    // Wis warning als gebruiker anders weer deselecteert.
    setShowAndersWarning(false);
  }, [zorgen]);

  function toggleSupport(code: string) {
    setSupportNeeds((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const andersOk = zorgen !== "anders" || andersZorgenText.trim().length > 0;
  const canContinue =
    zorgen !== null && andersOk && supportNeeds.size > 0 && !isLoading;

  async function handleSubmit() {
    if (zorgen === null || supportNeeds.size === 0) return;
    if (zorgen === "anders" && andersZorgenText.trim().length === 0) {
      setShowAndersWarning(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await saveTopConcerns(surveyRunId, [zorgen]);
      await saveSupportNeeds(surveyRunId, Array.from(supportNeeds));
      await saveSurveyProfile(surveyRunId, {
        top_concern_other_text:
          zorgen === "anders" ? andersZorgenText.trim() || null : null,
        future_usecases_text: innovatieText.trim() || null,
      });
      onContinue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setError(`Opslaan mislukt: ${message}`);
      setIsLoading(false);
    }
  }

  const charCount = innovatieText.length;
  const charColor = charCount > 0 ? "#40484e" : "#bfc7cf";

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <SurveyProgressBar currentStep={5} totalSteps={5} />
        </div>

        <div
          className="glass-card rounded-[2rem] p-8 md:p-10"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 8px 40px rgba(0, 101, 139, 0.08)",
          }}
        >
          {/* Eyebrow */}
          <div
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(0, 101, 139, 0.7)" }}
          >
            <Rocket className="h-4 w-4" />
            Toekomst &amp; ambities
          </div>

          {/* Vraag 1 — Zorgen */}
          <div className="mb-6">
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
                marginBottom: "0.45rem",
              }}
            >
              Wat is jouw grootste zorg bij AI-tools op het werk?
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.9rem",
              }}
            >
              Selecteer een optie.
            </p>

            {ZORGEN_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.code}
                label={opt.label}
                selected={zorgen === opt.code}
                onClick={() => setZorgen(opt.code)}
              >
                {opt.code === "anders" && (
                  <div
                    style={{
                      maxHeight: zorgen === "anders" ? 90 : 0,
                      opacity: zorgen === "anders" ? 1 : 0,
                      overflow: "hidden",
                      transition:
                        "max-height 300ms ease, opacity 300ms ease",
                    }}
                  >
                    <input
                      ref={andersInputRef}
                      type="text"
                      value={andersZorgenText}
                      onChange={(e) => {
                        setAndersZorgenText(e.target.value);
                        if (e.target.value.trim().length > 0) {
                          setShowAndersWarning(false);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Beschrijf je zorg..."
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: "12px 14px",
                        border: "1.5px solid #bfc7cf",
                        borderRadius: "0.35rem",
                        fontSize: 16,
                        background: "rgba(255,255,255,0.9)",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#00658b";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(0,101,139,0.14)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#bfc7cf";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    {showAndersWarning && (
                      <p className="mt-1 text-sm" style={{ color: "#d97706" }}>
                        Vul je zorg in
                      </p>
                    )}
                  </div>
                )}
              </RadioCard>
            ))}
          </div>

          {/* Vraag 2 — Toekomstige toepassingen (mid-focus-wrap) */}
          <div
            style={{
              padding: 16,
              borderRadius: "1.25rem",
              background: "#f1f4f6",
              border: "1px solid rgba(191,199,207,0.55)",
              margin: "1.25rem 0",
            }}
          >
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
                marginBottom: "0.45rem",
              }}
            >
              Welke werkzaamheden lenen zich volgens jou goed voor AI-ondersteuning?
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.9rem",
              }}
            >
              We verzamelen ideeën om te onderzoeken waar AI de meeste waarde kan
              toevoegen aan onze dagelijkse processen.
            </p>
            <textarea
              value={innovatieText}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TEXT) {
                  setInnovatieText(e.target.value);
                }
              }}
              maxLength={MAX_TEXT}
              placeholder="Bijvoorbeeld: vergaderverslagen opstellen, standaard klantvragen beantwoorden, lange rapporten samenvatten..."
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid #bfc7cf",
                borderRadius: "1rem",
                fontSize: 14,
                background: "rgba(255,255,255,0.8)",
                resize: "vertical",
                minHeight: 100,
                lineHeight: 1.6,
                fontFamily: "'Inter', system-ui, sans-serif",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#004c6a";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(0,76,106,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#bfc7cf";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: charColor,
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {charCount} / {MAX_TEXT}
            </div>
          </div>

          {/* Vraag 3 — Ondersteuning */}
          <div className="mb-6">
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
                marginBottom: "0.45rem",
              }}
            >
              Hoe kunnen we je het beste ondersteunen?
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.75rem",
              }}
            >
              Wat heb jij nodig om AI op een veilige en effectieve manier in te
              zetten voor je werk?
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.875rem",
                color: "#40484e",
                background: "#f1f4f6",
                border: "1px solid rgba(191,199,207,0.7)",
                borderRadius: 9999,
                padding: "6px 12px",
                marginBottom: 12,
              }}
            >
              Meerdere antwoorden mogelijk.
            </span>

            {SUPPORT_OPTIONS.map((opt) => (
              <CheckCard
                key={opt.code}
                label={opt.label}
                checked={supportNeeds.has(opt.code)}
                onToggle={() => toggleSupport(opt.code)}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-8 mt-6"
            style={{ borderTop: "1px solid rgba(191,199,207,0.2)" }}
          >
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="text-sm font-medium"
              style={{
                color: "#40484e",
                background: "transparent",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                padding: "12px 20px",
              }}
            >
              ← Vorige
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: canContinue ? "#00658b" : "#bfc7cf",
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "background 180ms ease",
              }}
              onMouseEnter={(e) => {
                if (canContinue) e.currentTarget.style.background = "#004c6a";
              }}
              onMouseLeave={(e) => {
                if (canContinue) e.currentTarget.style.background = "#00658b";
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  Scan afronden
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-right text-sm" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

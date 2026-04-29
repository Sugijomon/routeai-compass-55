/**
 * Shadow AI Scan V8.1 — Stap 7: Vaardigheid & Spelregels.
 *
 * Schrijft naar:
 *   - survey_profile (upsert: ai_policy_awareness_code, ai_skill_level_code,
 *     processing_output_code) — overschrijft geen andere profielvelden
 *   - survey_tool_preference_reason (delete + insert per surveyRunId)
 *
 * Alle vier vragen zijn verplicht voordat "Volgende" enabled wordt.
 */

import { useMemo, useState } from "react";
import {
  Brain,
  Building2,
  ChevronDown,
  GraduationCap,
  Info,
  Loader2,
  Rocket,
  Trophy,
} from "lucide-react";
import {
  saveSurveyProfile,
  saveToolPreferenceReasons,
} from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Props
// ============================================================================

interface Step07VaardigheidSpelregelsProps {
  surveyRunId: string;
  onContinue: () => void;
  onBack: () => void;
}

// ============================================================================
// Configuratie
// ============================================================================

const BELEID_OPTIONS: { code: string; label: string }[] = [
  { code: "ja_goed", label: "Ja, ik weet goed wat er wel en niet mag" },
  { code: "vaag", label: "Vaag bekend - ik heb er iets over gehoord" },
  { code: "nee", label: "Nee, ik weet niet of er al afspraken zijn" },
  { code: "geen_beleid", label: "Voor zover ik weet is er (nog) geen officieel beleid" },
];

const TOOL_REDEN_OPTIONS: { code: string; label: string }[] = [
  {
    code: "snelheid",
    label: "Snelheid: het werkt sneller dan de huidige officiële alternatieven.",
  },
  {
    code: "functionaliteit",
    label:
      "Functionaliteit: de tool kan dingen die andere software binnen de organisatie niet kan.",
  },
  {
    code: "kwaliteit",
    label: "Kwaliteit: ik vind de resultaten (output) simpelweg beter.",
  },
  {
    code: "gemak",
    label: "Gemak: ik heb er al een (privé)account en ben er aan gewend.",
  },
  {
    code: "samenwerking",
    label:
      "Samenwerking: mijn directe collega's of externe partners gebruiken deze tool ook.",
  },
];

interface SkillOption {
  code: string;
  name: string;
  desc: string;
  Icon: typeof GraduationCap;
}

const SKILL_OPTIONS: SkillOption[] = [
  {
    code: "beginner",
    name: "Beginner",
    desc: "Ik probeer het af en toe, vind het nog lastig",
    Icon: GraduationCap,
  },
  {
    code: "gemiddeld",
    name: "Gemiddeld",
    desc: "Ik gebruik het regelmatig voor standaard-taken",
    Icon: Building2,
  },
  {
    code: "gevorderd",
    name: "Gevorderd",
    desc: "Ik schrijf goede prompts en ken de mogelijkheden goed",
    Icon: Rocket,
  },
  {
    code: "expert",
    name: "Expert",
    desc: "Ik experimenteer actief en help collega's ermee",
    Icon: Trophy,
  },
];

const OUTPUT_OPTIONS: { code: string; label: string }[] = [
  { code: "direct_overnemen", label: "Ik neem de resultaten meestal direct over." },
  {
    code: "controle_handmatig",
    label: "Ik controleer de feiten en informatie handmatig voordat ik het gebruik.",
  },
  {
    code: "ruwe_opzet_inspiratie",
    label:
      "Ik gebruik de output alleen als ruwe opzet of inspiratie en schrijf de definitieve tekst zelf.",
  },
];

// ============================================================================
// Reusable inner sub-components
// ============================================================================

function RadioCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
        borderRadius: "1rem",
        border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
        background: selected ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
        marginBottom: 10,
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      <div
        className="shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${selected ? "#00658b" : "#bfc7cf"}`,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: selected ? "#00658b" : "transparent",
            transition: "all 0.2s ease",
          }}
        />
      </div>
      <span
        style={{ flex: 1, fontSize: 16, color: "#181c1e", lineHeight: 1.35 }}
      >
        {children}
      </span>
    </button>
  );
}

function CheckboxCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
        borderRadius: "1rem",
        border: `1.5px solid ${selected ? "#00658b" : "#bfc7cf"}`,
        background: selected ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
        marginBottom: 10,
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      <div
        className="shrink-0"
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${selected ? "#00658b" : "#bfc7cf"}`,
          background: selected ? "#00658b" : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
      >
        {selected && (
          <div
            style={{
              width: 10,
              height: 6,
              borderLeft: "2.5px solid white",
              borderBottom: "2.5px solid white",
              transform: "rotate(-45deg) translate(1px, -1px)",
            }}
          />
        )}
      </div>
      <span
        style={{ flex: 1, fontSize: 16, color: "#181c1e", lineHeight: 1.35 }}
      >
        {children}
      </span>
    </button>
  );
}

// ============================================================================
// Hoofdcomponent
// ============================================================================

export function Step07VaardigheidSpelregels({
  surveyRunId,
  onContinue,
  onBack,
}: Step07VaardigheidSpelregelsProps) {
  const [beleid, setBeleid] = useState<string | null>(null);
  const [toolRedenen, setToolRedenen] = useState<Set<string>>(new Set());
  const [skill, setSkill] = useState<string | null>(null);
  const [outputVerwerking, setOutputVerwerking] = useState<string | null>(null);
  // Info-blok gebruikt native <details>; geen lokale state nodig.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () =>
      beleid !== null &&
      toolRedenen.size > 0 &&
      skill !== null &&
      outputVerwerking !== null &&
      !isLoading,
    [beleid, toolRedenen, skill, outputVerwerking, isLoading],
  );

  function toggleReden(code: string) {
    setToolRedenen((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleSubmit() {
    if (!canContinue) return;
    setIsLoading(true);
    setError(null);
    try {
      await saveSurveyProfile(surveyRunId, {
        ai_policy_awareness_code: beleid,
        ai_skill_level_code: skill,
        processing_output_code: outputVerwerking,
      });
      await saveToolPreferenceReasons(surveyRunId, Array.from(toolRedenen));
      onContinue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setError(`Opslaan mislukt: ${message}`);
      setIsLoading(false);
    }
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
            <Brain className="h-4 w-4" />
            Vaardigheid &amp; Spelregels
          </div>

          {/* Vraag 1 — Beleidsbekendheid */}
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
              Spelregels voor AI-gebruik
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.9rem",
              }}
            >
              Ben je bekend met de afspraken en het AI-beleid binnen onze organisatie?
            </p>
            {BELEID_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.code}
                selected={beleid === opt.code}
                onClick={() => setBeleid(opt.code)}
              >
                {opt.label}
              </RadioCard>
            ))}
          </div>

          {/* Vraag 2 — Toolvoorkeur (multi-select) — mid-focus-wrap */}
          <div
            style={{
              margin: "1.25rem 0",
              padding: 16,
              borderRadius: "1.25rem",
              background: "#f1f4f6",
              border: "1px solid rgba(191,199,207,0.55)",
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
              Jouw voorkeur voor specifieke tools
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.6rem",
              }}
            >
              Soms werkt een tool buiten onze standaardpakketten simpelweg het best voor jouw
              taken. Wat zijn voor jou de belangrijkste redenen om zelf voor een specifieke
              AI-tool te kiezen?
            </p>
            <div
              className="mb-3 inline-block"
              style={{
                background: "#ebeef0",
                border: "1px solid rgba(191,199,207,0.7)",
                borderRadius: "9999px",
                padding: "4px 12px",
                fontSize: 13,
                color: "#40484e",
              }}
            >
              Meerdere antwoorden mogelijk.
            </div>
            {TOOL_REDEN_OPTIONS.map((opt) => (
              <CheckboxCard
                key={opt.code}
                selected={toolRedenen.has(opt.code)}
                onClick={() => toggleReden(opt.code)}
              >
                {opt.label}
              </CheckboxCard>
            ))}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e9eb", margin: "1.75rem 0" }} />

          {/* Vraag 3 — Vaardigheidsniveau */}
          <div>
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
              Hoe schat je je eigen AI-vaardigheid in?
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: "#40484e",
                lineHeight: 1.5,
                marginBottom: "0.9rem",
              }}
            >
              Van nieuwsgierige beginner tot pro: help ons het kennisniveau binnen de organisatie
              in kaart te brengen
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
              className="max-sm:!grid-cols-2"
            >
              {SKILL_OPTIONS.map((opt) => {
                const isSelected = skill === opt.code;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setSkill(opt.code)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "14px 10px",
                      borderRadius: "1rem",
                      border: `1.5px solid ${isSelected ? "#00658b" : "#bfc7cf"}`,
                      background: isSelected
                        ? "rgba(196,231,255,0.38)"
                        : "rgba(255,255,255,0.72)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9999,
                        background: "#ffffff",
                        border: "1px solid rgba(191,199,207,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#00658b" }} />
                    </div>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#181c1e",
                        lineHeight: 1.2,
                      }}
                    >
                      {opt.name}
                    </span>
                    <span style={{ fontSize: 14, color: "#40484e", lineHeight: 1.35 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e9eb", margin: "1.75rem 0" }} />

          {/* Vraag 4 — Outputverwerking */}
          <div>
            <h3
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
                marginBottom: "0.9rem",
              }}
            >
              Hoe verwerk je de resultaten (output) van de AI-tool meestal in je werk?
            </h3>
            {OUTPUT_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.code}
                selected={outputVerwerking === opt.code}
                onClick={() => setOutputVerwerking(opt.code)}
              >
                {opt.label}
              </RadioCard>
            ))}
          </div>

          {/* Uitklapbaar informatieblok — styling identiek aan Step05 (Data & Risico). */}
          <details
            className="step07-details mb-2 mt-6 p-4"
            style={{
              background: "#f1f4f6",
              border: "1px solid rgba(191,199,207,0.3)",
              borderRadius: "1.25rem",
            }}
          >
            <summary className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <Info className="h-[18px] w-[18px]" style={{ color: "#00658b" }} />
              </div>
              <span
                className="flex-1 text-[13px] font-semibold"
                style={{ color: "#00658b" }}
              >
                Hou zelf de regie: vertrouwen is goed, controleren is beter
              </span>
              <ChevronDown
                className="step07-chev h-[18px] w-[18px]"
                style={{ color: "#00658b" }}
              />
            </summary>
            <div
              className="mt-3 border-t pt-3 text-[13px] leading-relaxed"
              style={{ borderColor: "rgba(191,199,207,0.2)", color: "#40484e" }}
            >
              AI kan overtuigend klinken, maar ook feiten verzinnen (hallucineren) of
              onbewuste vooroordelen (bias) bevatten. Controle op juistheid is essentieel om
              de kwaliteit te waarborgen en te voorkomen dat onjuiste informatie je werk
              beïnvloedt.
            </div>
          </details>
          <style>{`
            .step07-details > summary { list-style: none; cursor: pointer; }
            .step07-details > summary::-webkit-details-marker { display: none; }
            .step07-details[open] .step07-chev { transform: rotate(180deg); }
            .step07-chev { transition: transform .22s; }
          `}</style>

          {/* Footer */}
          <div
            className="mt-8 flex items-center justify-between pt-8"
            style={{ borderTop: "1px solid rgba(191,199,207,0.2)" }}
          >
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="rounded-full px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
              style={{ color: "#40484e", background: "transparent", fontWeight: 500 }}
            >
              ← Vorige
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: canContinue
                  ? "linear-gradient(135deg, #00658b 0%, #0088b8 100%)"
                  : "#bfc7cf",
                boxShadow: canContinue ? "0 4px 12px rgba(0, 101, 139, 0.25)" : "none",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>Volgende →</>
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

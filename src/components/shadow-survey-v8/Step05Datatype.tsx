/**
 * Shadow AI Scan V8.1 — Stap 5: Datatype, awareness en anonimisering.
 *
 * Schrijft naar:
 *   - survey_data_type (delete + insert per surveyRunId)
 *   - survey_profile (upsert: data_awareness_code, anonymization_behavior_code)
 *
 * Gebruikt direct de canonieke ref_data_type-codes (geen tussenliggende
 * mapping). De opties "nietsin" en "onzeker" zijn exclusief.
 */

import { useMemo, useState } from "react";
import { saveDataTypes, saveSurveyProfile } from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Props
// ============================================================================

interface Step05DatatypeProps {
  surveyRunId: string;
  onContinue: () => void;
  onBack: () => void;
}

// ============================================================================
// Configuratie
// ============================================================================

type Risk = "neutral" | "mid" | "high";

interface DataTypeOption {
  code: string;
  label: string;
  risk: Risk;
  exclusive?: boolean;
  fullWidth?: boolean;
}

const DATA_TYPE_OPTIONS: DataTypeOption[] = [
  { code: "publiek", label: "Publieke informatie", risk: "neutral" },
  { code: "namen", label: "Namen van personen", risk: "mid" },
  { code: "interne_email", label: "Interne e-mails", risk: "mid" },
  { code: "interne_documenten", label: "Interne documenten", risk: "mid" },
  { code: "notulen", label: "Notulen van vergaderingen", risk: "mid" },
  { code: "broncode_logica", label: "Broncode & logica", risk: "mid" },
  { code: "klantdata", label: "Klantdata", risk: "high" },
  { code: "financiele_data", label: "Financiële data", risk: "high" },
  { code: "gevoelig_persoonsgegeven", label: "Gevoelige persoonsgegevens", risk: "high" },
  { code: "excel_sheets", label: "Excel sheets", risk: "mid" },
  { code: "juridische_documenten", label: "Juridische documenten", risk: "high" },
  { code: "nietsin", label: "Ik voer dit niet in", risk: "neutral", exclusive: true },
  { code: "onzeker", label: "Weet ik niet zeker", risk: "neutral", exclusive: true, fullWidth: true },
];

const EXCLUSIVE_CODES = new Set(
  DATA_TYPE_OPTIONS.filter((o) => o.exclusive).map((o) => o.code),
);

const AWARENESS_OPTIONS: { code: string; label: string }[] = [
  {
    code: "ja_controle",
    label: "Ja - Ik controleer altijd de voorwaarden over privacy en data-opslag.",
  },
  {
    code: "gedeeltelijk",
    label:
      "Gedeeltelijk - Ik weet dat data opgeslagen kan worden, maar check de details niet per tool.",
  },
  {
    code: "nee_prive",
    label: "Nee - Ik ga er eigenlijk vanuit dat mijn gegevens privé blijven.",
  },
  {
    code: "nee_niet_verdiept",
    label: "Nee - Ik heb me hier nog niet in verdiept.",
  },
];

const ANON_OPTIONS: { code: string; label: string }[] = [
  { code: "altijd", label: "Ja, altijd." },
  { code: "soms", label: "Soms, als de informatie erg gevoelig is." },
  { code: "nee", label: "Nee, ik voer de informatie direct in." },
  { code: "wist_niet", label: "Ik wist niet dat dit nodig/mogelijk was." },
];

// ============================================================================
// Helpers
// ============================================================================

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

function selectedStyleFor(risk: Risk): React.CSSProperties {
  switch (risk) {
    case "neutral":
      return { borderColor: "#004c6a", background: "rgba(197,231,255,0.38)" };
    case "mid":
      return { borderColor: "#0369a1", background: "rgba(224,242,254,0.5)" };
    case "high":
      return { borderColor: "#0c4a6e", background: "rgba(186,230,253,0.48)" };
  }
}

// ============================================================================
// Component
// ============================================================================

export function Step05Datatype({
  surveyRunId,
  onContinue,
  onBack,
}: Step05DatatypeProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [awarenessChoice, setAwarenessChoice] = useState<string | null>(null);
  const [anonChoice, setAnonChoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () => selected.size > 0 && awarenessChoice !== null && anonChoice !== null,
    [selected, awarenessChoice, anonChoice],
  );

  function toggleOption(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const isExclusive = EXCLUSIVE_CODES.has(code);

      if (isExclusive) {
        // Exclusieve optie: wis alles, selecteer alleen deze (of deselecteer als al actief).
        if (next.has(code) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(code);
        }
        return next;
      }

      // Reguliere optie: verwijder eerst eventuele exclusieve selecties.
      for (const c of EXCLUSIVE_CODES) next.delete(c);

      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  async function handleNext() {
    if (!canContinue || isLoading) return;
    if (!surveyRunId) {
      setError("Geen actieve survey-run gevonden. Ga terug naar de start.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveDataTypes(surveyRunId, [...selected]);
      await saveSurveyProfile(surveyRunId, {
        data_awareness_code: awarenessChoice,
        anonymization_behavior_code: anonChoice,
      });
      onContinue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setError(`Opslaan mislukt: ${message}`);
      setIsLoading(false);
    }
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Inline keyframes voor reveal-tip animatie */}
      <style>{`
        @keyframes step05TipIn {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step05-check-mark {
          width: 10px; height: 6px;
          border-left: 2.5px solid white;
          border-bottom: 2.5px solid white;
          transform: rotate(-45deg) translate(1px, -1px);
        }
        .step05-details > summary { list-style: none; cursor: pointer; }
        .step05-details > summary::-webkit-details-marker { display: none; }
        .step05-details[open] .step05-chev { transform: rotate(180deg); }
        .step05-chev { transition: transform .22s; }
      `}</style>

      {/* Decoratieve nebula-blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
          style={{ background: "#7dd0ff", filter: "blur(80px)", opacity: 0.18 }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
          style={{ background: "#bae6ff", filter: "blur(80px)", opacity: 0.18 }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
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
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  color: "#181c1e",
                }}
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
          <SurveyProgressBar currentStep={4} totalSteps={5} />
        </div>

        {/* Card */}
        <main className="pb-24">
          <section
            className="p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: "2rem",
              boxShadow: "0 8px 40px rgba(0,101,139,0.08)",
            }}
          >
            {/* Card header */}
            <div className="mb-5">
              <span
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(0,101,139,0.7)" }}
              >
                <Icon name="database" style={{ fontSize: 15 }} />
                Data &amp; risico
              </span>
              <h2
                className="mb-1"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  lineHeight: 1.25,
                  color: "#00658b",
                }}
              >
                Welk type informatie voer je wel eens in bij AI-tools?
              </h2>
              <p
                className="mt-2 inline-block rounded-lg border px-3 py-1.5 text-sm"
                style={{
                  background: "#f1f4f6",
                  borderColor: "rgba(191,199,207,0.3)",
                  color: "#40484e",
                }}
              >
                Meerdere antwoorden mogelijk. Kies bij overlappende informatie altijd
                de <strong>meest gevoelige</strong> categorie.
              </p>
            </div>

            {/* Eerste informatieblok */}
            <details
              className="step05-details mb-6 p-4"
              style={{
                background: "#f1f4f6",
                border: "1px solid rgba(191,199,207,0.3)",
                borderRadius: "1.25rem",
              }}
            >
              <summary className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Icon name="info" style={{ fontSize: 18, color: "#00658b" }} />
                </div>
                <span
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: "#00658b" }}
                >
                  De juiste bescherming voor jouw werk.
                </span>
                <Icon
                  name="expand_more"
                  className="step05-chev"
                  style={{ fontSize: 18, color: "#00658b" }}
                />
              </summary>
              <div
                className="mt-3 border-t pt-3 text-[13px] leading-relaxed"
                style={{ borderColor: "rgba(191,199,207,0.2)", color: "#40484e" }}
              >
                Niet alle informatie is hetzelfde. Een concept-mail voor het
                bedrijfsuitje vraagt om een andere beveiliging dan een strategisch
                plan met bedrijfsgegevens.
              </div>
            </details>

            {/* Datatype-grid */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DATA_TYPE_OPTIONS.map((opt) => {
                const isSelected = selected.has(opt.code);
                const baseStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: "1rem",
                  border: "1.5px solid #bfc7cf",
                  background: "rgba(255,255,255,0.72)",
                  cursor: "pointer",
                  transition: "all .18s",
                  userSelect: "none",
                };
                const selStyle = isSelected ? selectedStyleFor(opt.risk) : {};
                const labelColor = isSelected ? "#004c6a" : "#181c1e";

                return (
                  <button
                    type="button"
                    key={opt.code}
                    onClick={() => toggleOption(opt.code)}
                    aria-pressed={isSelected}
                    className={opt.fullWidth ? "sm:col-span-2" : ""}
                    style={{ ...baseStyle, ...selStyle, textAlign: "left" }}
                  >
                    {/* Custom checkbox */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        flexShrink: 0,
                        border: "2px solid #bfc7cf",
                        marginTop: -1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .18s",
                        background: "white",
                        ...(isSelected
                          ? { background: "#004c6a", borderColor: "#004c6a" }
                          : {}),
                      }}
                    >
                      {isSelected && <span className="step05-check-mark" />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 400,
                          color: labelColor,
                          display: "block",
                          lineHeight: 1.35,
                          transition: "color .18s",
                        }}
                      >
                        {opt.label}
                      </span>

                      {isSelected && opt.risk === "mid" && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "10px 12px",
                            borderRadius: "0.75rem",
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            background: "#e0f2fe",
                            color: "#0c4a6e",
                            border: "1px solid #bae6fd",
                            animation: "step05TipIn .22s ease both",
                          }}
                        >
                          Let op: overweeg of dit echt nodig is voor je taak.
                        </div>
                      )}

                      {isSelected && opt.risk === "high" && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "10px 12px",
                            borderRadius: "0.75rem",
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            background: "#dbeafe",
                            color: "#1e3a5f",
                            border: "1px solid #93c5fd",
                            animation: "step05TipIn .22s ease both",
                          }}
                        >
                          Hoog risico: gebruik bij voorkeur een zakelijk account of
                          geanonimiseerde versie.
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Awareness-sectie */}
            <div
              style={{
                marginTop: 8,
                marginBottom: 22,
                padding: 16,
                borderRadius: "1.25rem",
                background: "#f1f4f6",
                border: "1px solid rgba(191,199,207,0.55)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  lineHeight: 1.25,
                  color: "#00658b",
                  marginBottom: "0.45rem",
                }}
              >
                Ben je op de hoogte van hoe AI-tools omgaan met de informatie die jij
                invoert?
              </div>
              <div className="flex flex-col gap-2.5">
                {AWARENESS_OPTIONS.map((opt) => {
                  const on = awarenessChoice === opt.code;
                  return (
                    <button
                      type="button"
                      key={opt.code}
                      onClick={() => setAwarenessChoice(opt.code)}
                      aria-pressed={on}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "16px 20px",
                        borderRadius: "1rem",
                        border: `1.5px solid ${on ? "#00658b" : "#bfc7cf"}`,
                        background: on
                          ? "rgba(197,231,255,0.38)"
                          : "rgba(255,255,255,0.72)",
                        cursor: "pointer",
                        transition: "all .2s ease",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${on ? "#00658b" : "#bfc7cf"}`,
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: on ? "#00658b" : "transparent",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 400,
                          lineHeight: 1.35,
                          color: "#181c1e",
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anonimisering-sectie */}
            <div style={{ marginTop: 10, marginBottom: 24 }}>
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  lineHeight: 1.25,
                  color: "#00658b",
                  marginBottom: 4,
                }}
              >
                Maak je informatie anoniem?
              </div>
              <p
                className="mb-3"
                style={{ fontSize: 14, color: "#40484e" }}
              >
                Bijvoorbeeld door namen of klantnummers te verwijderen voordat je het
                in een AI-tool deelt.
              </p>
              <div className="flex flex-col gap-2.5">
                {ANON_OPTIONS.map((opt) => {
                  const on = anonChoice === opt.code;
                  return (
                    <button
                      type="button"
                      key={opt.code}
                      onClick={() => setAnonChoice(opt.code)}
                      aria-pressed={on}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "16px 20px",
                        borderRadius: "1rem",
                        border: `1.5px solid ${on ? "#00658b" : "#bfc7cf"}`,
                        background: on
                          ? "rgba(197,231,255,0.38)"
                          : "rgba(255,255,255,0.72)",
                        cursor: "pointer",
                        transition: "all .2s ease",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${on ? "#00658b" : "#bfc7cf"}`,
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: on ? "#00658b" : "transparent",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 400,
                          lineHeight: 1.35,
                          color: "#181c1e",
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tweede informatieblok */}
            <details
              className="step05-details mb-6 p-4"
              style={{
                background: "#f1f4f6",
                border: "1px solid rgba(191,199,207,0.3)",
                borderRadius: "1.25rem",
              }}
            >
              <summary className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Icon name="info" style={{ fontSize: 18, color: "#00658b" }} />
                </div>
                <span
                  className="flex-1 text-[13px] font-semibold"
                  style={{ color: "#00658b" }}
                >
                  Waarom is anonimiseren belangrijk?
                </span>
                <Icon
                  name="expand_more"
                  className="step05-chev"
                  style={{ fontSize: 18, color: "#00658b" }}
                />
              </summary>
              <div
                className="mt-3 border-t pt-3 text-[13px] leading-relaxed"
                style={{ borderColor: "rgba(191,199,207,0.2)", color: "#40484e" }}
              >
                Zodra je gegevens invoert in een gratis AI-tool, kunnen deze
                onderdeel worden van de trainingsset van de aanbieder. Door namen te
                vervangen door &quot;Persoon A&quot; of &quot;Bedrijf X&quot;
                bescherm je de privacy van onze klanten en collega&apos;s, terwijl
                de AI je nog steeds perfect kan helpen met de inhoud.
              </div>
            </details>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t pt-6"
              style={{ borderColor: "rgba(191,199,207,0.2)" }}
            >
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="group inline-flex items-center gap-3 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ color: "#40484e" }}
              >
                <Icon
                  name="arrow_back"
                  style={{ fontSize: 20 }}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                Vorige
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue || isLoading}
                className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:-translate-y-0.5"
                style={{
                  background: canContinue && !isLoading ? "#00658b" : "#9ab3c1",
                  color: "white",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Opslaan...
                  </>
                ) : (
                  <>
                    Volgende
                    <Icon
                      name="arrow_forward"
                      style={{ fontSize: 20 }}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-right text-sm text-red-600">{error}</p>
            )}
          </section>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

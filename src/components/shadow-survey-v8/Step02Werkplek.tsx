/**
 * Shadow AI Scan V8.1 — Scherm 02: Werkplek (afdeling)
 *
 * Visueel gebaseerd op screen-02-werkplek.html (glassmorphism, Manrope/Inter,
 * Material Symbols). Schrijft `department_code` (en optioneel
 * `department_other_text` bij "Anders") naar `survey_profile` via
 * saveSurveyProfile (upsert op survey_run_id).
 */

import { useEffect, useRef, useState } from "react";
import { saveSurveyProfile } from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

interface Step02WerkplekProps {
  surveyRunId: string;
  onContinue: () => void;
  onBack: () => void;
}

interface DepartmentOption {
  code: string;
  label: string;
}

// Hard-coded volgorde matcht ref_department; tabel wordt niet gefetched
// zodat de stap zonder netwerk-roundtrip rendert.
const DEPARTMENTS: DepartmentOption[] = [
  { code: "it_data_development", label: "IT, Data & Development" },
  { code: "marketing_communicatie", label: "Marketing & Communicatie" },
  { code: "hr_recruitment", label: "HR & Recruitment" },
  { code: "finance_legal", label: "Finance & Legal" },
  { code: "sales_accountmanagement", label: "Sales & Accountmanagement" },
  { code: "operations_support", label: "Operations & Support" },
  { code: "directie_management", label: "Directie & Management" },
  { code: "anders", label: "Anders..." },
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

export function Step02Werkplek({ surveyRunId, onContinue, onBack }: Step02WerkplekProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [andersText, setAndersText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const andersInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus het "Anders"-veld zodra het uitschuift.
  useEffect(() => {
    if (selected !== "anders") return;
    const t = setTimeout(() => {
      andersInputRef.current?.focus();
    }, 320);
    return () => clearTimeout(t);
  }, [selected]);

  const showAndersExpanded = selected === "anders";
  const andersEmpty = selected === "anders" && andersText.trim() === "";

  const handleSubmit = async () => {
    if (isLoading || !selected) return;
    if (andersEmpty) {
      setError("Vul je vakgebied in");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await saveSurveyProfile(surveyRunId, {
        department_code: selected,
        department_other_text: selected === "anders" ? andersText.trim() : null,
      });
      onContinue();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Opslaan mislukt. Probeer het opnieuw.";
      setError(msg);
      setIsLoading(false);
    }
  };

  const submitDisabled = isLoading || !selected || andersEmpty;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Decoratieve nebula-blobs — exact zoals HTML-referentie */}
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
          <SurveyProgressBar currentStep={1} totalSteps={5} />
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
          {/* Card header */}
          <div className="mb-8">
            <div
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,101,139,0.7)" }}
            >
              <Icon name="badge" style={{ fontSize: 15 }} />
              <span>Jouw werkplek</span>
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
              Binnen welk vakgebied ben je voornamelijk actief?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#40484e" }}>
              Kies het domein dat het beste aansluit bij jouw rol of expertise, ook als je in wisselende projectteams werkt.
            </p>
          </div>

          {/* Keuzekaarten */}
          <div role="radiogroup" aria-label="Selecteer je vakgebied">
            {DEPARTMENTS.map((opt) => {
              const isSelected = selected === opt.code;
              return (
                <div key={opt.code}>
                  <div
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => setSelected(opt.code)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setSelected(opt.code);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "#00658b";
                        e.currentTarget.style.background = "rgba(196,231,255,0.2)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "#bfc7cf";
                        e.currentTarget.style.background = "rgba(255,255,255,0.72)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      borderRadius: "1rem",
                      border: `1.5px solid ${isSelected ? "#00658b" : "#bfc7cf"}`,
                      background: isSelected ? "rgba(196,231,255,0.38)" : "rgba(255,255,255,0.72)",
                      cursor: "pointer",
                      transition: "all .2s ease",
                      marginBottom: 10,
                      outline: "none",
                    }}
                  >
                    {/* Radio-indicator */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: `2px solid ${isSelected ? "#00658b" : "#bfc7cf"}`,
                        background: "white",
                        flexShrink: 0,
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
                          background: isSelected ? "#00658b" : "transparent",
                          transition: "all .2s ease",
                        }}
                      />
                    </div>
                    <span
                      className="text-[15px]"
                      style={{ color: "#181c1e", fontWeight: isSelected ? 600 : 500 }}
                    >
                      {opt.label}
                    </span>
                  </div>

                  {/* "Anders" tekstveld — uitschuif-animatie */}
                  {opt.code === "anders" && (
                    <div
                      style={{
                        maxHeight: showAndersExpanded ? 80 : 0,
                        opacity: showAndersExpanded ? 1 : 0,
                        overflow: "hidden",
                        transition: "max-height 300ms ease, opacity 300ms ease",
                        marginBottom: showAndersExpanded ? 10 : 0,
                      }}
                    >
                      <input
                        ref={andersInputRef}
                        type="text"
                        value={andersText}
                        onChange={(e) => {
                          setAndersText(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Vul je afdeling in..."
                        aria-label="Andere afdeling"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1.5px solid #bfc7cf",
                          borderRadius: "0.875rem",
                          fontSize: 14,
                          background: "rgba(255,255,255,0.9)",
                          outline: "none",
                          fontFamily: "'Inter', system-ui, sans-serif",
                          color: "#181c1e",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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

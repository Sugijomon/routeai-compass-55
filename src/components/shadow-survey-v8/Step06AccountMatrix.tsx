/**
 * Shadow AI Scan V8.1 — Stap 6: Account-matrix + browserextensies + automatisering.
 *
 * Schrijft naar:
 *   - survey_tool_account (upsert per surveyToolId)
 *   - survey_profile (upsert: browser_extension_usage_code, automation_usage_code)
 *
 * Toolnamen worden via een losse query op survey_tool opgehaald, toepassingen
 * via aparte queries op survey_tool_use_case + ref_use_case (geen complexe
 * nested join). Foutmeldingen blijven inline; navigatie blokkeert bij save-fout.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveToolAccount, saveSurveyProfile } from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Props
// ============================================================================

interface Step06AccountMatrixProps {
  surveyRunId: string;
  savedToolIds: string[];
  onContinue: () => void;
  onBack: () => void;
}

// ============================================================================
// Configuratie
// ============================================================================

const ACCOUNT_COLUMNS: { code: string; label: string }[] = [
  { code: "zakelijke_licentie", label: "Zakelijke licentie" },
  { code: "prive_gratis", label: "Privéaccount (gratis)" },
  { code: "prive_betaald", label: "Privéaccount (betaald)" },
  { code: "beide", label: "Beide" },
];

const EXTENSION_OPTIONS: { code: string; label: string }[] = [
  {
    code: "ja_bewust",
    label: "Ja, ik gebruik deze bewust (bijv. voor samenvattingen of vertalingen).",
  },
  {
    code: "ja_onzeker",
    label: "Ik heb ze geïnstalleerd, maar weet niet zeker of ze meekijken.",
  },
  { code: "nee", label: "Nee, ik gebruik geen AI-extensies." },
  { code: "weet_niet", label: "Ik weet niet precies wat dit zijn." },
];

const AUTOMATION_OPTIONS: { code: string; label: string }[] = [
  {
    code: "alleen_chatbot",
    label: "Nee, ik gebruik AI alleen als chatbot (vraag & antwoord).",
  },
  {
    code: "agents_reeks_taken",
    label: "Ja, ik experimenteer met agents die zelfstandig een reeks taken uitvoeren.",
  },
  {
    code: "gekoppeld_apps",
    label: "Ja, ik heb AI gekoppeld aan andere apps (bijv. e-mail, agenda of spreadsheets).",
  },
  {
    code: "weet_niet_zeker",
    label: "Ik weet het niet zeker, maar ik gebruik tools die automatisch werkzaamheden uitvoeren.",
  },
];

// ============================================================================
// Types voor lokale data
// ============================================================================

interface ToolRow {
  id: string;
  name: string;
  useCaseLabels: string[];
}

// ============================================================================
// Component
// ============================================================================

export function Step06AccountMatrix({
  surveyRunId,
  savedToolIds,
  onContinue,
  onBack,
}: Step06AccountMatrixProps) {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [accountSelections, setAccountSelections] = useState<
    Record<string, string | null>
  >({});
  const [extChoice, setExtChoice] = useState<string | null>(null);
  const [automationChoice, setAutomationChoice] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialiseer accountSelections direct op basis van savedToolIds.
  useEffect(() => {
    const init: Record<string, string | null> = {};
    for (const id of savedToolIds) init[id] = null;
    setAccountSelections(init);
  }, [savedToolIds]);

  // Haal toolnamen + toepassingen op via aparte queries.
  useEffect(() => {
    let cancelled = false;
    async function loadTools() {
      if (savedToolIds.length === 0) {
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      try {
        // 1. Toolnamen.
        const { data: surveyTools, error: toolErr } = await supabase
          .from("survey_tool")
          .select("id, tool_name")
          .in("id", savedToolIds);
        if (toolErr) throw toolErr;

        // 2. Use-case-rijen voor deze tools.
        const { data: useCaseRows, error: ucErr } = await supabase
          .from("survey_tool_use_case")
          .select("id, survey_tool_id, use_case_code")
          .in("survey_tool_id", savedToolIds);
        if (ucErr) throw ucErr;

        // 3. Use-case labels uit ref_use_case.
        const useCaseCodes = Array.from(
          new Set((useCaseRows ?? []).map((r) => r.use_case_code)),
        );
        const useCaseLabelMap: Record<string, string> = {};
        if (useCaseCodes.length > 0) {
          const { data: refUseCases, error: refErr } = await supabase
            .from("ref_use_case")
            .select("code, label")
            .in("code", useCaseCodes);
          if (refErr) throw refErr;
          for (const r of refUseCases ?? []) {
            useCaseLabelMap[r.code] = r.label;
          }
        }

        // Bouw rijen — bewaar volgorde van savedToolIds.
        const toolMap = new Map<string, { id: string; name: string }>();
        for (const t of surveyTools ?? []) {
          toolMap.set(t.id, { id: t.id, name: t.tool_name });
        }
        const labelsByToolId: Record<string, string[]> = {};
        for (const r of useCaseRows ?? []) {
          const label = useCaseLabelMap[r.use_case_code] ?? r.use_case_code;
          if (!labelsByToolId[r.survey_tool_id]) {
            labelsByToolId[r.survey_tool_id] = [];
          }
          labelsByToolId[r.survey_tool_id].push(label);
        }

        const rows: ToolRow[] = savedToolIds
          .map((id) => {
            const t = toolMap.get(id);
            if (!t) return null;
            return {
              id: t.id,
              name: t.name,
              useCaseLabels: labelsByToolId[id] ?? [],
            };
          })
          .filter((r): r is ToolRow => r !== null);

        if (!cancelled) setTools(rows);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Onbekende fout";
          setError(`Tools konden niet worden geladen: ${message}`);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }
    loadTools();
    return () => {
      cancelled = true;
    };
  }, [savedToolIds]);

  const allToolsAnswered = useMemo(() => {
    if (savedToolIds.length === 0) return false;
    return savedToolIds.every((id) => accountSelections[id] !== null && accountSelections[id] !== undefined);
  }, [savedToolIds, accountSelections]);

  const canContinue =
    allToolsAnswered && extChoice !== null && automationChoice !== null && !isLoading;

  function handleSelectAccount(toolId: string, code: string) {
    setAccountSelections((prev) => ({ ...prev, [toolId]: code }));
  }

  async function handleSubmit() {
    if (!canContinue) return;
    setIsLoading(true);
    setError(null);
    try {
      // Eén save per tool — geen parallel om ordering en errors stabiel te houden.
      for (const id of savedToolIds) {
        const code = accountSelections[id];
        if (!code) throw new Error("Onvolledige selectie");
        await saveToolAccount(id, code);
      }
      await saveSurveyProfile(surveyRunId, {
        browser_extension_usage_code: extChoice,
        automation_usage_code: automationChoice,
      });
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
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 8px 32px rgba(0, 101, 139, 0.08)",
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <div
              className="mb-3 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: "#00658b" }}
            >
              <KeyRound className="h-4 w-4" />
              Toegang & Automatisering
            </div>
            <h2
              className="mb-3 text-2xl md:text-[1.75rem]"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                color: "#181c1e",
                lineHeight: 1.2,
              }}
            >
              Hoe gebruik je deze tools: via een zakelijke licentie of een privéaccount?
            </h2>
            <p style={{ color: "#40484e", fontSize: 14, lineHeight: 1.55 }}>
              Geef per tool aan wie het account beheert. We gebruiken dit overzicht om te bepalen
              waar de organisatie al regie heeft en voor welke tools veilige bedrijfslicenties
              nodig zijn.
            </p>
          </div>

          {/* Uitklapbaar informatieblok */}
          <div
            className="mb-8 rounded-[1.25rem] p-1 shadow-sm"
            style={{
              background: "#f1f4f6",
              border: "1px solid rgba(191, 199, 207, 0.3)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsInfoOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left"
              style={{ color: "#00658b", fontWeight: 600, fontSize: 14 }}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Jouw data is trainingsmateriaal voor AI
              </span>
              <ChevronDown
                className="h-5 w-5 transition-transform duration-200"
                style={{ transform: isInfoOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            {isInfoOpen && (
              <div
                className="px-4 pb-4 pt-1 text-[13px]"
                style={{ color: "#40484e", lineHeight: 1.6 }}
              >
                Let op: Het belangrijkste verschil is niet alleen gratis versus betaald, maar
                vooral wie het account beheert. Bij een privéaccount heeft de organisatie meestal
                geen grip op contracten, logging of bewaartermijnen. Zeker bij gratis varianten is
                jouw data vaak onderdeel van het verdienmodel. Help ons dit in kaart te brengen,
                zodat veilig gebruik beter gefaciliteerd kan worden.
              </div>
            )}
          </div>

          {/* Matrix-tabel */}
          <div
            style={{
              borderRadius: "1.25rem",
              border: "1px solid #bfc7cf",
              background: "#ffffff",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                minWidth: 640,
              }}
            >
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
                <col style={{ width: "17.5%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#f1f4f6", borderBottom: "1px solid #bfc7cf" }}>
                  <th
                    style={{
                      padding: "12px 14px",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#40484e",
                      textAlign: "left",
                    }}
                  >
                    Tool
                  </th>
                  {ACCOUNT_COLUMNS.map((col) => (
                    <th
                      key={col.code}
                      style={{
                        padding: "12px 8px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#40484e",
                        textAlign: "center",
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "24px", textAlign: "center", color: "#6993aa", fontSize: 14 }}
                    >
                      Tools laden...
                    </td>
                  </tr>
                ) : tools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "24px", textAlign: "center", color: "#6993aa", fontSize: 14 }}
                    >
                      Geen tools gevonden.
                    </td>
                  </tr>
                ) : (
                  tools.map((tool, idx) => {
                    const isLast = idx === tools.length - 1;
                    return (
                      <tr
                        key={tool.id}
                        className="group"
                        style={{
                          borderBottom: isLast ? "none" : "1px solid #f1f4f6",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(196,231,255,0.15)")
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px" }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center"
                              style={{
                                borderRadius: 10,
                                background: "#f1f4f6",
                                color: "#00658b",
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {tool.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: 16,
                                  color: "#181c1e",
                                  fontWeight: 500,
                                  lineHeight: 1.25,
                                }}
                              >
                                {tool.name}
                              </div>
                              {subtitle && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#40484e",
                                    marginTop: 2,
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {ACCOUNT_COLUMNS.map((col) => {
                          const isSelected = accountSelections[tool.id] === col.code;
                          return (
                            <td
                              key={col.code}
                              onClick={() => handleSelectAccount(tool.id, col.code)}
                              style={{
                                padding: "14px 8px",
                                textAlign: "center",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                className="mx-auto flex items-center justify-center"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  border: `3px solid ${isSelected ? "#00658b" : "#c2c9d2"}`,
                                  background: "#fff",
                                  transition: "border-color 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = "#00658b";
                                    e.currentTarget.style.background = "#f7fafc";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = "#c2c9d2";
                                    e.currentTarget.style.background = "#fff";
                                  }
                                }}
                              >
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    background: isSelected ? "#00658b" : "transparent",
                                  }}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Browserextensie-sectie */}
          <div
            className="mb-6 mt-7 rounded-2xl p-5"
            style={{
              border: "1px solid rgba(191,199,207,0.45)",
              background: "#f1f4f6",
            }}
          >
            <h3
              className="mb-3"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
              }}
            >
              Gebruik je AI-browserextensies die mogelijk meekijken tijdens je werk?
            </h3>
            {EXTENSION_OPTIONS.map((opt) => {
              const isSelected = extChoice === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setExtChoice(opt.code)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: "1rem",
                    border: `1.5px solid ${isSelected ? "#00658b" : "#bfc7cf"}`,
                    background: isSelected
                      ? "rgba(196,231,255,0.38)"
                      : "rgba(255,255,255,0.72)",
                    marginBottom: 10,
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `3px solid ${isSelected ? "#00658b" : "#c2c9d2"}`,
                      background: "#fff",
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
                      }}
                    />
                  </div>
                  <span style={{ color: "#181c1e", fontSize: 14, lineHeight: 1.45 }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Automatisering-sectie */}
          <div className="mb-6 mt-7">
            <h3
              className="mb-1"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#00658b",
                lineHeight: 1.25,
              }}
            >
              Experimenteer je met AI-agents of automatisering?
            </h3>
            <p className="mb-3" style={{ color: "#40484e", fontSize: 14, lineHeight: 1.5 }}>
              Gebruik je tools die zelfstandig taken voor je uitvoeren (zoals AutoGPT, agents in
              Poe, of gekoppelde AI-workflows via Zapier/Make)?
            </p>
            {AUTOMATION_OPTIONS.map((opt) => {
              const isSelected = automationChoice === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setAutomationChoice(opt.code)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: "1rem",
                    border: `1.5px solid ${isSelected ? "#00658b" : "#bfc7cf"}`,
                    background: isSelected
                      ? "rgba(196,231,255,0.38)"
                      : "rgba(255,255,255,0.72)",
                    marginBottom: 10,
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `3px solid ${isSelected ? "#00658b" : "#c2c9d2"}`,
                      background: "#fff",
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
                      }}
                    />
                  </div>
                  <span style={{ color: "#181c1e", fontSize: 14, lineHeight: 1.45 }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-6"
            style={{ borderTop: "1px solid rgba(191,199,207,0.3)" }}
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
                <>Volgende stap →</>
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

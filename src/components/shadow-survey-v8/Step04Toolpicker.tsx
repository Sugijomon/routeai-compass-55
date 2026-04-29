/**
 * Shadow AI Scan V8.1 — Scherm 04: Toolpicker
 *
 * Twee-kolom layout met catalogus links en werkruimte rechts. Tools worden
 * geladen uit `tools_library` (alleen status='published', platform-tools);
 * toepassingen uit `ref_use_case`, contexten uit `ref_context`.
 *
 * Per tool wordt na "Volgende" geschreven:
 *  - survey_tool (met snapshot van org_tool_policy)
 *  - survey_tool_use_case (gewone tools: per gekozen toepassing;
 *    code-tools: één rij met use_case_code='code_schrijven')
 *  - survey_tool_use_case_context (alleen code-tools, op de
 *    code_schrijven-rij)
 *  - tool_catalog_discovery (alleen voor custom tools)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  saveTool,
  saveToolUseCases,
  saveToolUseCaseContext,
} from "@/lib/shadowSurveyEngineV8";
import { SurveyProgressBar } from "./SurveyProgressBar";

// ============================================================================
// Types
// ============================================================================

interface Step04ToolpickerProps {
  surveyRunId: string;
  orgId: string;
  onContinue: (savedToolIds: string[]) => void;
  onBack: () => void;
}

interface CatalogTool {
  id: string;            // tools_library.id (uuid) — wordt gebruikt als tool_code
  name: string;
  category: string;      // tools_library.category (DB: 6 technische categorieën)
  htmlCategory: string;  // canonieke HTML/JSON-categorie (11 categorieën, UI-only)
  vendor: string | null;
}

interface RefOption {
  code: string;
  label: string;
}

interface WorkspaceTool {
  localId: string;
  toolCode: string | null;     // null voor custom
  toolName: string;
  categoryCode: string;        // categorie-code voor groepering & code-detectie
  icon: string;                // material-symbol naam
  isCustom: boolean;
  isCodeTool: boolean;
  selections: string[];        // use_case_codes (gewoon) of context_codes (code-tool)
}

// ============================================================================
// Statische config
// ============================================================================

// Tabs op basis van canonieke HTML/JSON-categorieën (UI-only).
// 'all' = alle catalogus-tools. Volgorde komt uit categories.json.
const CATEGORY_TABS: Array<{ code: string; label: string }> = [
  { code: "all", label: "Alles" },
  { code: "algemene_ai", label: "Algemene AI" },
  { code: "agentic_ai", label: "Agentic AI" },
  { code: "schrijven", label: "Schrijven" },
  { code: "presentaties", label: "Presentaties" },
  { code: "beeld_video", label: "Beeld & Video" },
  { code: "audio_spraak", label: "Audio & Spraak" },
  { code: "notulen", label: "Notulen" },
  { code: "code", label: "Code" },
  { code: "data_auto", label: "Data & Auto" },
  { code: "werkplek", label: "Werkplek" },
  { code: "crm_klant", label: "CRM & Klant" },
];

// Material-symbol per HTML-categorie (UI fallback).
const CATEGORY_ICON: Record<string, string> = {
  algemene_ai: "auto_awesome",
  agentic_ai: "smart_toy",
  schrijven: "edit_note",
  presentaties: "slideshow",
  beeld_video: "image",
  audio_spraak: "record_voice_over",
  notulen: "mic",
  code: "code",
  data_auto: "analytics",
  werkplek: "work",
  crm_klant: "hub",
  // legacy DB-codes (fallback wanneer html_category onbekend is)
  llm: "chat",
  image_gen: "image",
  code_assistant: "code",
  rag: "search",
  analytics: "analytics",
  other: "extension",
  custom: "add_circle",
};

// Categorieën die als "code-tool" tellen (modal toont contexten i.p.v. use cases).
// Zowel DB-categorie code_assistant als HTML-categorie 'code' triggeren dit.
const CODE_CATEGORIES = new Set<string>(["code_assistant", "code"]);

// ──────────────────────────────────────────────────────────────────────────
// HTML-categorie mapping per tool (canon uit tools.json + categories.json).
// Match op tool-naam (case-insensitive, exact normalized). Onbekende tools
// vallen terug op DB-categorie via DB_TO_HTML_FALLBACK hieronder.
// ──────────────────────────────────────────────────────────────────────────
const TOOL_NAME_TO_HTML_CATEGORY: Record<string, string> = {
  // algemene_ai
  "chatgpt": "algemene_ai",
  "chatgpt enterprise": "algemene_ai",
  "claude": "algemene_ai",
  "google gemini": "algemene_ai",
  "gemini": "algemene_ai",
  "microsoft copilot": "algemene_ai",
  "notebooklm": "algemene_ai",
  "perplexity": "algemene_ai",
  "perplexity ai": "algemene_ai",
  "deepseek": "algemene_ai",
  "mistral le chat": "algemene_ai",
  // agentic_ai
  "perplexity computer": "agentic_ai",
  "claude cowork": "agentic_ai",
  // schrijven
  "grammarly": "schrijven",
  "jasper": "schrijven",
  "copy.ai": "schrijven",
  "notion ai": "schrijven",
  // presentaties
  "gamma": "presentaties",
  "canva ai": "presentaties",
  "google stitch": "presentaties",
  "adobe firefly": "presentaties",
  // beeld_video
  "midjourney": "beeld_video",
  "dall-e": "beeld_video",
  "dall-e 3": "beeld_video",
  "stable diffusion": "beeld_video",
  "runway": "beeld_video",
  "synthesia": "beeld_video",
  "nano banana pro": "beeld_video",
  // audio_spraak
  "elevenlabs": "audio_spraak",
  "murf ai": "audio_spraak",
  // notulen
  "otter.ai": "notulen",
  "fireflies.ai": "notulen",
  "tl;dv": "notulen",
  "fathom": "notulen",
  "tactiq": "notulen",
  "jamie": "notulen",
  "read.ai": "notulen",
  // code
  "github copilot": "code",
  "cursor": "code",
  "claude code": "code",
  "tabnine": "code",
  // data_auto
  "julius ai": "data_auto",
  "akkio": "data_auto",
  "n8n": "data_auto",
  "make": "data_auto",
  "zapier ai": "data_auto",
  "microsoft copilot for excel": "data_auto",
  // werkplek
  "m365 copilot": "werkplek",
  "google workspace ai": "werkplek",
  "salesforce einstein": "werkplek",
  "hubspot ai": "werkplek",
  // crm_klant
  "hubspot": "crm_klant",
  "salesforce": "crm_klant",
  "pipedrive ai": "crm_klant",
  "monday.com ai": "crm_klant",
  // overige in DB die geen 1-op-1 HTML-equivalent hebben:
  // "chatgpt search" → algemene_ai (zoekvariant van ChatGPT)
  "chatgpt search": "algemene_ai",
  // "you.com" → algemene_ai (chat + zoek)
  "you.com": "algemene_ai",
  // "deepl" → schrijven (vertaal-tool, dichtst bij schrijven; agentic past niet)
  "deepl": "schrijven",
};

// Fallback: DB-categorie → HTML-categorie wanneer naam-mapping faalt.
const DB_TO_HTML_FALLBACK: Record<string, string> = {
  llm: "algemene_ai",
  image_gen: "beeld_video",
  code_assistant: "code",
  rag: "algemene_ai",
  analytics: "data_auto",
  other: "werkplek",
};

function htmlCategoryFor(name: string, dbCategory: string): string {
  const key = name.trim().toLowerCase();
  if (TOOL_NAME_TO_HTML_CATEGORY[key]) return TOOL_NAME_TO_HTML_CATEGORY[key];
  return DB_TO_HTML_FALLBACK[dbCategory] ?? "werkplek";
}

// Use-cases die NIET als selecteerbare optie in de modal mogen verschijnen
// (agentic workflows zijn uit scope voor V8.1).
const EXCLUDED_USE_CASE_CODES = new Set<string>([
  "workflow_uitvoeren",
  "systemen_aansturen",
  "taken_automatisch_afhandelen",
]);

// Per-categorie allowlist van toepassingen die in de modal mogen verschijnen.
// Beperkt de keuzes tot wat voor die toolsoort logisch is.
const USE_CASES_PER_CATEGORY: Record<string, string[]> = {
  // ── HTML/JSON-categorieën (gebruikt door catalogus) ──
  algemene_ai: [
    "teksten_schrijven",
    "samenvatten_redigeren",
    "brainstormen",
    "informatie_opzoeken",
    "vertalen",
    "data_analyseren",
    "code_schrijven",
    "afbeeldingen_genereren",
  ],
  agentic_ai: [
    "informatie_opzoeken",
    "data_analyseren",
    "automatisering",
    "code_schrijven",
  ],
  schrijven: [
    "teksten_schrijven",
    "samenvatten_redigeren",
    "brainstormen",
    "vertalen",
    "klantenservice",
    "informatie_opzoeken",
  ],
  presentaties: [
    "presentaties_design",
    "afbeeldingen_genereren",
    "brainstormen",
    "samenvatten_redigeren",
    "video_genereren",
  ],
  beeld_video: [
    "afbeeldingen_genereren",
    "video_genereren",
    "presentaties_design",
    "brainstormen",
  ],
  audio_spraak: [
    "audio_genereren",
    "video_genereren",
    "klantenservice",
    "presentaties_design",
  ],
  notulen: [
    "vergaderingen_notuleren",
    "samenvatten_redigeren",
    "informatie_opzoeken",
  ],
  code: [], // code-tools gebruiken contexten i.p.v. use cases
  data_auto: [
    "data_analyseren",
    "automatisering",
    "informatie_opzoeken",
    "code_schrijven",
  ],
  werkplek: [
    "teksten_schrijven",
    "samenvatten_redigeren",
    "data_analyseren",
    "vergaderingen_notuleren",
    "presentaties_design",
    "klantenservice",
    "brainstormen",
    "informatie_opzoeken",
  ],
  crm_klant: [
    "klantenservice",
    "data_analyseren",
    "automatisering",
    "samenvatten_redigeren",
    "teksten_schrijven",
  ],
  // ── Legacy DB-categorieën (back-compat) ──
  llm: [
    "teksten_schrijven",
    "samenvatten_redigeren",
    "brainstormen",
    "informatie_opzoeken",
    "vertalen",
    "klantenservice",
    "vergaderingen_notuleren",
  ],
  image_gen: [
    "afbeeldingen_genereren",
    "presentaties_design",
    "video_genereren",
    "audio_genereren",
    "brainstormen",
  ],
  code_assistant: [],
  rag: [
    "informatie_opzoeken",
    "samenvatten_redigeren",
    "data_analyseren",
  ],
  analytics: [
    "data_analyseren",
    "informatie_opzoeken",
    "presentaties_design",
  ],
  other: [
    "vergaderingen_notuleren",
    "samenvatten_redigeren",
    "vertalen",
    "teksten_schrijven",
  ],
  custom: [
    "teksten_schrijven",
    "samenvatten_redigeren",
    "brainstormen",
    "informatie_opzoeken",
    "vertalen",
    "data_analyseren",
    "afbeeldingen_genereren",
    "presentaties_design",
    "vergaderingen_notuleren",
    "klantenservice",
  ],
};

// Tool-naam → material-symbol icon. Vervangt de generieke categorie-icon
// wanneer een specifiekere keuze beter past. Match is case-insensitive op
// substring van de toolnaam.
const TOOL_ICON_BY_NAME: Array<{ match: RegExp; icon: string }> = [
  { match: /chatgpt|openai/i, icon: "smart_toy" },
  { match: /claude|anthropic/i, icon: "psychology" },
  { match: /gemini|bard/i, icon: "auto_awesome" },
  { match: /copilot/i, icon: "assistant" },
  { match: /notion/i, icon: "edit_note" },
  { match: /grammarly/i, icon: "spellcheck" },
  { match: /perplexity|you\.com/i, icon: "search" },
  { match: /midjourney|dall-?e|firefly|stable/i, icon: "image" },
  { match: /github|cursor|tabnine/i, icon: "code" },
  { match: /deepl/i, icon: "translate" },
  { match: /otter|fireflies|read\.ai/i, icon: "graphic_eq" },
  { match: /julius|excel/i, icon: "analytics" },
];

function isCodeCategory(code: string) {
  return CODE_CATEGORIES.has(code);
}

function iconFor(category: string) {
  return CATEGORY_ICON[category] ?? CATEGORY_ICON.other;
}

function iconForTool(name: string, category: string): string {
  for (const entry of TOOL_ICON_BY_NAME) {
    if (entry.match.test(name)) return entry.icon;
  }
  return iconFor(category);
}

// ============================================================================
// Kleine helpers
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

// ============================================================================
// Component
// ============================================================================

export function Step04Toolpicker({
  surveyRunId,
  orgId,
  onContinue,
  onBack,
}: Step04ToolpickerProps) {
  // Catalogus-data
  const [catalogTools, setCatalogTools] = useState<CatalogTool[]>([]);
  const [useCases, setUseCases] = useState<RefOption[]>([]);
  const [contexts, setContexts] = useState<RefOption[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [refsError, setRefsError] = useState<string | null>(null);

  // UI-state
  const [workspace, setWorkspace] = useState<WorkspaceTool[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [modalToolLocalId, setModalToolLocalId] = useState<string | null>(null);
  const [modalSelections, setModalSelections] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localIdCounter = useRef(0);
  const nextLocalId = () => `local-${++localIdCounter.current}`;

  // ──────────────────────────────────────────────────────────────────────────
  // Data laden
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRefsLoading(true);
      setRefsError(null);
      try {
        const [toolsRes, ucRes, ctxRes] = await Promise.all([
          supabase
            .from("tools_library")
            .select("id, name, category, vendor")
            .eq("status", "published")
            .is("org_id", null)
            .order("name", { ascending: true }),
          supabase.from("ref_use_case").select("code, label"),
          supabase.from("ref_context").select("code, label"),
        ]);

        if (cancelled) return;

        if (toolsRes.error) throw toolsRes.error;
        if (ucRes.error) throw ucRes.error;
        if (ctxRes.error) throw ctxRes.error;

        setCatalogTools(
          (toolsRes.data ?? []).map((t) => {
            const dbCat = t.category ?? "other";
            return {
              id: t.id,
              name: t.name,
              category: dbCat,
              htmlCategory: htmlCategoryFor(t.name, dbCat),
              vendor: t.vendor ?? null,
            };
          }),
        );
        setUseCases(
          (ucRes.data ?? [])
            .filter((u) => !EXCLUDED_USE_CASE_CODES.has(u.code))
            .map((u) => ({ code: u.code, label: u.label })),
        );
        setContexts((ctxRes.data ?? []).map((c) => ({ code: c.code, label: c.label })));
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Kon de tool-catalogus niet laden.";
        setRefsError(msg);
      } finally {
        if (!cancelled) setRefsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Afgeleide waarden
  // ──────────────────────────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    if (activeCategory === "all") return catalogTools;
    // Filteren op canonieke HTML-categorie (UI-only).
    return catalogTools.filter((t) => t.htmlCategory === activeCategory);
  }, [catalogTools, activeCategory]);

  const usedToolCodes = useMemo(
    () => new Set(workspace.map((w) => w.toolCode).filter(Boolean) as string[]),
    [workspace],
  );

  const modalTool = useMemo(
    () => workspace.find((w) => w.localId === modalToolLocalId) ?? null,
    [workspace, modalToolLocalId],
  );

  const submitDisabled =
    isLoading ||
    workspace.length === 0 ||
    workspace.some((w) => w.selections.length === 0);

  // ──────────────────────────────────────────────────────────────────────────
  // Acties
  // ──────────────────────────────────────────────────────────────────────────
  const addCatalogTool = (tool: CatalogTool) => {
    if (usedToolCodes.has(tool.id)) return;
    // isCodeTool wordt bepaald op zowel DB-categorie als HTML-categorie
    // (HTML 'code' = DB 'code_assistant').
    const isCode =
      isCodeCategory(tool.category) || isCodeCategory(tool.htmlCategory);
    const newTool: WorkspaceTool = {
      localId: nextLocalId(),
      toolCode: tool.id,
      toolName: tool.name,
      categoryCode: tool.htmlCategory, // gebruik HTML-categorie voor modal-allowlist
      icon: iconForTool(tool.name, tool.htmlCategory),
      isCustom: false,
      isCodeTool: isCode,
      selections: [],
    };
    setWorkspace((prev) => [...prev, newTool]);
    setModalToolLocalId(newTool.localId);
    setModalSelections([]);
    if (error) setError(null);
  };

  const addCustomTool = () => {
    const name = customInput.trim();
    if (!name) return;
    const newTool: WorkspaceTool = {
      localId: nextLocalId(),
      toolCode: null,
      toolName: name,
      categoryCode: "custom",
      icon: iconFor("custom"),
      isCustom: true,
      isCodeTool: false,
      selections: [],
    };
    setWorkspace((prev) => [...prev, newTool]);
    setCustomInput("");
    setModalToolLocalId(newTool.localId);
    setModalSelections([]);
    if (error) setError(null);
  };

  const removeWorkspaceTool = (localId: string) => {
    setWorkspace((prev) => prev.filter((w) => w.localId !== localId));
    if (modalToolLocalId === localId) {
      setModalToolLocalId(null);
      setModalSelections([]);
    }
  };

  const openModalFor = (localId: string) => {
    const tool = workspace.find((w) => w.localId === localId);
    if (!tool) return;
    setModalSelections([...tool.selections]);
    setModalToolLocalId(localId);
  };

  const toggleModalSelection = (code: string) => {
    setModalSelections((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const closeModal = () => {
    setModalToolLocalId(null);
    setModalSelections([]);
  };

  const saveModal = () => {
    if (!modalToolLocalId) return;
    setWorkspace((prev) =>
      prev.map((w) =>
        w.localId === modalToolLocalId ? { ...w, selections: [...modalSelections] } : w,
      ),
    );
    closeModal();
    if (error) setError(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Submit
  // ──────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitDisabled) return;

    // Extra runtime-check zoals gevraagd.
    const incomplete = workspace.some((w) => w.selections.length === 0);
    if (incomplete) {
      setError("Geef voor elke tool minimaal één selectie aan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const savedIds: string[] = [];

    try {
      for (const w of workspace) {
        const surveyToolId = await saveTool(surveyRunId, orgId, {
          toolCode: w.toolCode,
          toolName: w.toolName,
          isCustom: w.isCustom,
        });

        if (w.isCodeTool) {
          // Code-tool: één use_case-rij met 'code_schrijven', daaronder de contexten.
          const ucIds = await saveToolUseCases(surveyToolId, ["code_schrijven"]);
          if (ucIds.length === 0) {
            throw new Error("Use-case kon niet worden opgeslagen voor code-tool.");
          }
          await saveToolUseCaseContext(ucIds[0], w.selections);
        } else {
          // Gewone tool: per gekozen toepassing één use_case-rij.
          await saveToolUseCases(surveyToolId, w.selections);
        }

        savedIds.push(surveyToolId);
      }

      onContinue(savedIds);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Opslaan mislukt. Probeer het opnieuw.";
      setError(msg);
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────────────────────────────────
  const modalChips: RefOption[] = useMemo(() => {
    if (!modalTool) return [];
    if (modalTool.isCodeTool) return contexts;
    const allow = USE_CASES_PER_CATEGORY[modalTool.categoryCode];
    if (!allow || allow.length === 0) return useCases;
    const allowSet = new Set(allow);
    // Behoud volgorde van de allowlist zodat de modal voorspelbaar oogt.
    const byCode = new Map(useCases.map((u) => [u.code, u]));
    return allow
      .map((code) => byCode.get(code))
      .filter((u): u is RefOption => !!u && allowSet.has(u.code));
  }, [modalTool, contexts, useCases]);

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
          style={{ background: "#7dd0ff", filter: "blur(80px)", opacity: 0.18 }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full"
          style={{ background: "#bae6ff", filter: "blur(80px)", opacity: 0.18 }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Header — identiek aan vorige schermen */}
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
          <SurveyProgressBar currentStep={3} totalSteps={5} />
        </div>

        {/* Vraag-card */}
        <section
          className="mb-6 p-8"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.7)",
            borderRadius: "2rem",
            boxShadow: "0 8px 40px rgba(0,101,139,0.06)",
          }}
        >
          <div
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(0,101,139,0.7)" }}
          >
            <Icon name="apps" style={{ fontSize: 15 }} />
            <span>Mijn AI gereedschapskist</span>
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
            Welke AI-tools gebruik je wel eens in je dagelijkse werk?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "#40484e", lineHeight: 1.55 }}>
            Selecteer de tools uit de catalogus en geef per tool aan waarvoor je hem gebruikt.
          </p>
        </section>

        {/* Twee-kolom layout */}
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          {/* ── Linker kolom: Catalogus ─────────────────────────────────── */}
          <aside
            className="w-full flex-shrink-0 lg:w-[460px]"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: "2rem",
              boxShadow: "0 8px 40px rgba(0,101,139,0.06)",
              padding: "1.5rem",
            }}
          >
            <h3
              className="mb-4 text-lg"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                color: "#00658b",
              }}
            >
              Catalogus
            </h3>

            {/* Tabs */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORY_TABS.map((t) => {
                const isActive = activeCategory === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setActiveCategory(t.code)}
                    className="whitespace-nowrap"
                    style={{
                      padding: "8px 14px",
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      color: isActive ? "#00658b" : "#40484e",
                      background: isActive ? "#e5e9eb" : "transparent",
                      border: `1px solid ${isActive ? "#bfc7cf" : "transparent"}`,
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "#ebeef0";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tool-lijst */}
            <div
              className="space-y-2"
              style={{
                maxHeight: 350,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {refsLoading && (
                <div className="py-8 text-center text-sm" style={{ color: "#6993aa" }}>
                  Tools laden…
                </div>
              )}
              {!refsLoading && refsError && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                  }}
                  role="alert"
                >
                  {refsError}
                </div>
              )}
              {!refsLoading && !refsError && filteredCatalog.length === 0 && (
                <div className="py-6 text-center text-sm" style={{ color: "#6993aa" }}>
                  Geen tools in deze categorie.
                </div>
              )}
              {!refsLoading &&
                !refsError &&
                filteredCatalog.map((tool) => {
                  const used = usedToolCodes.has(tool.id);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      disabled={used}
                      onClick={() => addCatalogTool(tool)}
                      className="flex w-full items-center gap-3 text-left transition-all"
                      style={{
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "#fff",
                        border: "1px solid #bfc7cf",
                        cursor: used ? "not-allowed" : "pointer",
                        opacity: used ? 0.6 : 1,
                        pointerEvents: used ? "none" : "auto",
                      }}
                      onMouseEnter={(e) => {
                        if (used) return;
                        e.currentTarget.style.borderColor = "#00658b";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,101,139,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (used) return;
                        e.currentTarget.style.borderColor = "#bfc7cf";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "#f1f4f6" }}
                      >
                        <Icon
                          name={iconForTool(tool.name, tool.htmlCategory)}
                          style={{ fontSize: 18, color: "#00658b" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-semibold"
                          style={{ color: "#181c1e" }}
                        >
                          {tool.name}
                        </div>
                        {tool.vendor && (
                          <div className="truncate text-xs" style={{ color: "#6993aa" }}>
                            {tool.vendor}
                          </div>
                        )}
                      </div>
                      {used && (
                        <Icon
                          name="check_circle"
                          style={{ fontSize: 18, color: "#527a1b" }}
                        />
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Custom toevoegen */}
            <div className="mt-5 border-t pt-4" style={{ borderColor: "rgba(191,199,207,0.4)" }}>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6993aa" }}
              >
                Ontbreekt er één?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTool();
                    }
                  }}
                  placeholder="Naam van de tool…"
                  className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{
                    border: "1px solid #bfc7cf",
                    background: "#fff",
                    color: "#181c1e",
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomTool}
                  disabled={!customInput.trim()}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "#00658b" }}
                >
                  <Icon name="add" style={{ fontSize: 18, color: "#fff" }} />
                  <span>Toevoegen</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── Rechter kolom: Werkruimte ───────────────────────────────── */}
          <section
            className="relative flex-1 self-stretch"
            style={{
              background: "rgba(255,255,255,0.4)",
              border: "2px dashed rgba(191,199,207,0.5)",
              borderRadius: "2rem",
              padding: "1.5rem",
              minHeight: 500,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-lg"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  color: "#00658b",
                }}
              >
                Mijn werkruimte
              </h3>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                style={{ background: "#00658b" }}
              >
                {workspace.length} {workspace.length === 1 ? "tool" : "tools"}
              </span>
            </div>

            {workspace.length === 0 && (
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ padding: "1.5rem" }}
              >
                <Icon
                  name="auto_awesome_mosaic"
                  style={{ fontSize: 48, color: "rgba(0,101,139,0.2)" }}
                />
                <p className="mt-3 text-sm" style={{ color: "#6993aa" }}>
                  Nog geen tools geselecteerd.
                </p>
                <p className="mt-1 text-xs" style={{ color: "#6993aa" }}>
                  Kies links uit de catalogus of voeg er zelf een toe.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {workspace.map((w) => {
                const incomplete = w.selections.length === 0;
                return (
                  <div
                    key={w.localId}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #00658b",
                      borderRadius: 12,
                      padding: "12px 16px",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "#e0f2fe" }}
                      >
                        <Icon name={w.icon} style={{ fontSize: 18, color: "#00658b" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-semibold"
                          style={{ color: "#181c1e" }}
                        >
                          {w.toolName}
                        </div>
                        {!incomplete && (
                          <div className="mt-0.5 text-xs" style={{ color: "#527a1b" }}>
                            {w.selections.length}{" "}
                            {w.isCodeTool
                              ? w.selections.length === 1
                                ? "context"
                                : "contexten"
                              : w.selections.length === 1
                                ? "toepassing"
                                : "toepassingen"}{" "}
                            geselecteerd
                          </div>
                        )}
                        {incomplete && (
                          <div className="mt-0.5 text-xs" style={{ color: "#ca8a04" }}>
                            {w.isCodeTool
                              ? "Kies minimaal één context"
                              : "Kies minimaal één toepassing"}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWorkspaceTool(w.localId)}
                        aria-label={`Verwijder ${w.toolName}`}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors"
                        style={{ background: "#f1f4f6", color: "#40484e" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ffe4e6";
                          e.currentTarget.style.color = "#e11d48";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f1f4f6";
                          e.currentTarget.style.color = "#40484e";
                        }}
                      >
                        <Icon name="close" style={{ fontSize: 18 }} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openModalFor(w.localId)}
                      className="mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                      style={{
                        background: incomplete ? "#fef9c3" : "#f1f4f6",
                        color: incomplete ? "#854d0e" : "#00658b",
                      }}
                    >
                      {incomplete
                        ? w.isCodeTool
                          ? "Configureer contexten"
                          : "Configureer toepassingen"
                        : "Wijzig selectie"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer-knoppen */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: "#40484e", background: "transparent" }}
            onMouseEnter={(e) => {
              if (isLoading) return;
              e.currentTarget.style.background = "rgba(235,238,240,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon name="arrow_back" style={{ fontSize: 18 }} />
            <span>Vorige</span>
          </button>

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitDisabled}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "#00658b",
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (submitDisabled) return;
                (e.currentTarget as HTMLButtonElement).style.background = "#003d55";
              }}
              onMouseLeave={(e) => {
                if (submitDisabled) return;
                (e.currentTarget as HTMLButtonElement).style.background = "#00658b";
              }}
            >
              {isLoading ? (
                <>
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  Opslaan…
                </>
              ) : (
                <>
                  Volgende
                  <Icon
                    name="arrow_forward"
                    className="transition-transform group-hover:translate-x-0.5"
                    style={{ fontSize: 18, color: "#fff" }}
                  />
                </>
              )}
            </button>
            {error && (
              <div
                className="mt-2 text-right text-sm"
                style={{ color: "#dc2626" }}
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="h-12" />
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(24,28,30,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: "fadeInModal .2s ease",
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col"
            style={{
              background: "#fff",
              borderRadius: "2rem",
              boxShadow:
                "0 25px 50px -12px rgba(0,0,0,0.25), 0 8px 16px -8px rgba(0,0,0,0.1)",
              maxHeight: "90vh",
              animation: "slideUpModal .3s ease",
            }}
          >
            {/* Modal-header */}
            <div
              className="flex items-center gap-3 px-6 pb-4 pt-6"
              style={{ borderBottom: "1px solid rgba(191,199,207,0.3)" }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "#f1f4f6" }}
              >
                <Icon name={modalTool.icon} style={{ fontSize: 22, color: "#00658b" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-base"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 800,
                    color: "#181c1e",
                  }}
                >
                  {modalTool.toolName}
                </div>
                <div className="text-xs" style={{ color: "#6993aa" }}>
                  Configureer {modalTool.isCodeTool ? "contexten" : "toepassingen"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Sluiten"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ebeef0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon name="close" style={{ fontSize: 20, color: "#40484e" }} />
              </button>
            </div>

            {/* Modal-body */}
            <div className="overflow-y-auto px-6 py-5" style={{ flex: 1 }}>
              {modalTool.isCodeTool && (
                <div
                  className="mb-5"
                  style={{
                    borderRadius: 24,
                    border: "1px solid rgba(0,101,139,0.12)",
                    background:
                      "linear-gradient(180deg, rgba(241,244,246,0.95), rgba(235,238,240,0.95))",
                    padding: "18px 20px",
                  }}
                >
                  <div
                    className="mb-1 text-sm"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 800,
                      color: "#00658b",
                    }}
                  >
                    Waar wordt de software voor gebruikt?
                  </div>
                  <p className="text-xs" style={{ color: "#40484e", lineHeight: 1.55 }}>
                    Deze tools helpen bij het schrijven van code. Het risico zit niet in de
                    tool zelf, maar in wat je ermee bouwt.
                  </p>
                </div>
              )}

              <div
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6993aa" }}
              >
                Waarvoor gebruik je deze tool?
              </div>

              <div className="flex flex-wrap gap-2.5">
                {modalChips.map((chip) => {
                  const selected = modalSelections.includes(chip.code);
                  return (
                    <button
                      key={chip.code}
                      type="button"
                      onClick={() => toggleModalSelection(chip.code)}
                      className="inline-flex items-center gap-1.5 transition-all"
                      title={modalTool.isCodeTool ? chip.label : undefined}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 99,
                        background: selected ? "#00658b" : "#f1f4f6",
                        border: `1px solid ${selected ? "#00658b" : "#bfc7cf"}`,
                        color: selected ? "#fff" : "#40484e",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <Icon
                        name={selected ? "check_circle" : "add_circle"}
                        style={{ fontSize: 16 }}
                      />
                      <span>{chip.label}</span>
                      {modalTool.isCodeTool && (
                        <span
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full"
                          style={{
                            background: selected
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(0,101,139,0.1)",
                            color: selected ? "#fff" : "#00658b",
                            fontSize: 10,
                          }}
                          aria-hidden="true"
                        >
                          i
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* AI-suggestie (visueel; nog niet functioneel in V8.1) */}
              <button
                type="button"
                disabled
                className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-semibold"
                style={{
                  border: "1.5px dashed #bfc7cf",
                  background: "#f7fafc",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#6993aa",
                  cursor: "not-allowed",
                  opacity: 0.7,
                }}
              >
                <Icon name="auto_awesome" style={{ fontSize: 18 }} />
                <span>Laat AI toepassingen voorstellen</span>
              </button>
            </div>

            {/* Modal-footer */}
            <div
              className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: "1px solid rgba(191,199,207,0.3)" }}
            >
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{ color: "#40484e", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ebeef0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={saveModal}
                disabled={modalSelections.length === 0}
                className="rounded-full px-5 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "#00658b" }}
              >
                Opslaan
              </button>
            </div>
          </div>

          {/* Inline keyframes voor de modal-animaties. */}
          <style>{`
            @keyframes fadeInModal {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUpModal {
              from { transform: translateY(16px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default Step04Toolpicker;

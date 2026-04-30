/**
 * V8 Score Engine — deterministische scoreberekening voor de Shadow AI Scan V8.1.
 *
 * Stand-alone module: importeert NIET uit shadowSurveyEngine.ts of riskEngine.ts.
 * Geen UI-code. Wordt (nog) niet automatisch aangeroepen vanuit completeSurveyRun;
 * uitsluitend handmatig getriggerd vanaf /admin/scan-v8-debug.
 *
 * Schema referenties (geverifieerd 2026-04-30):
 *  - survey_run, survey_profile, survey_data_type
 *  - survey_tool, survey_tool_account
 *  - survey_tool_use_case, survey_tool_use_case_context
 *  - ref_context.context_multiplier, ref_org_policy_status.shadow_base
 *  - scan_scoring_config (priority_review_threshold, toxic_*_threshold, ...)
 *  - risk_result (PK survey_run_id), risk_result_tool (PK survey_run_id+survey_tool_id)
 */

import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ScoringConfig {
  id: string | null;
  priority_review_threshold: number;
  toxic_shadow_threshold: number;
  toxic_exposure_threshold: number;
  dashboard_min_cell_size: number;
}

export interface ToolScoreResult {
  survey_tool_id: string;
  tool_code: string | null;
  tool_name: string;
  shadow_base: number;
  shadow_score: number;
  use_case_base: number;
  context_multiplier: number;
  account_multiplier: number;
  data_boost: number;
  frequency_boost: number;
  automation_boost: number;
  extension_boost: number;
  agentic_boost: number;
  raw_exposure_score: number;
  exposure_score: number;
  toxic_boost: number;
  review_boost: number;
  priority_score_raw: number;
  priority_score: number;
  review_trigger_codes: string[];
  dpo_review_required: boolean;
}

export interface RunScoreResult {
  person_score: number;
  assigned_tier: "standard" | "priority_review" | "toxic_shadow";
  review_trigger_codes: string[];
  warnings: string[];
  exit_path: boolean;
  shadow_tool_count: number;
  highest_priority_score: number;
  highest_risk_tool: string | null;
  highest_risk_use_case: string | null;
  highest_risk_context: string | null;
}

/** Round to max 2 decimals; voorkomt 49.050000000000004-weergave. */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

const DEFAULT_CONFIG: ScoringConfig = {
  id: null,
  priority_review_threshold: 40,
  toxic_shadow_threshold: 50,
  toxic_exposure_threshold: 50,
  dashboard_min_cell_size: 5,
};

// ──────────────────────────────────────────────────────────────────────────────
// Statische lookup tabellen (canonische V8.1-formules)
// ──────────────────────────────────────────────────────────────────────────────

const SHADOW_BASE_BY_POLICY: Record<string, number> = {
  approved: 0,
  newly_discovered: 20,
  under_review: 20,
  restricted: 40,
  prohibited: 80,
};

const USE_CASE_BASE_LOW = new Set([
  "teksten_schrijven",
  "samenvatten_redigeren",
  "brainstormen",
  "informatie_opzoeken",
  "vertalen",
  "presentaties_design",
]);
const USE_CASE_BASE_MID = new Set([
  "klantenservice",
  "data_analyseren",
  "code_schrijven",
  "afbeeldingen_genereren",
  "audio_genereren",
  "video_genereren",
  "vergaderingen_notuleren",
]);
const USE_CASE_BASE_HIGH = new Set([
  "automatisering",
  "workflow_uitvoeren",
  "systemen_aansturen",
  "taken_automatisch_afhandelen",
]);
const AGENTIC_USE_CASES = new Set([
  "workflow_uitvoeren",
  "systemen_aansturen",
  "taken_automatisch_afhandelen",
]);

const ACCOUNT_MULTIPLIER: Record<string, number> = {
  zakelijke_licentie: 1.0,
  prive_gratis: 1.4,
  prive_betaald: 1.3,
  beide: 1.8,
};

const DATA_BOOST_HIGH = new Set([
  "gevoelig_persoonsgegeven",
  "klantdata",
  "financiele_data",
  "juridische_documenten",
]);
const DATA_BOOST_MID = new Set([
  "namen",
  "interne_email",
  "interne_documenten",
  "notulen",
  "broncode_logica",
  "excel_sheets",
]);
// publiek, niets → 0; onzeker → +15

function useCaseBaseFor(code: string | null | undefined): number {
  if (!code) return 10;
  if (USE_CASE_BASE_HIGH.has(code)) return 35;
  if (USE_CASE_BASE_MID.has(code)) return 20;
  if (USE_CASE_BASE_LOW.has(code)) return 10;
  return 10; // geen match → conservatief
}

function accountMultiplierFor(code: string | null | undefined): number {
  if (!code) return 1.4;
  return ACCOUNT_MULTIPLIER[code] ?? 1.4;
}

function shadowBaseFor(code: string | null | undefined): number {
  if (!code) return 20;
  return SHADOW_BASE_BY_POLICY[code] ?? 20;
}

function dataBoostFor(codes: string[]): number {
  let max = 0;
  for (const c of codes) {
    if (DATA_BOOST_HIGH.has(c)) max = Math.max(max, 30);
    else if (DATA_BOOST_MID.has(c)) max = Math.max(max, 15);
    else if (c === "onzeker") max = Math.max(max, 15);
    // publiek / niets → 0
  }
  return max;
}

function frequencyBoostFor(code: string | null | undefined): number {
  if (code === "dagelijks") return 15;
  if (code === "wekelijks") return 8;
  return 0;
}

function automationBoostFor(code: string | null | undefined): number {
  if (!code) return 0;
  if (code === "alleen_chatbot") return 0;
  return 15;
}

function extensionBoostFor(code: string | null | undefined): number {
  if (code === "ja_bewust" || code === "ja_onzeker") return 10;
  return 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-tool score
// ──────────────────────────────────────────────────────────────────────────────

interface ToolInputBundle {
  survey_tool_id: string;
  tool_code: string | null;
  tool_name: string;
  org_policy_status_code_snapshot: string | null;
  account_type_codes: string[];
  use_case_codes: string[];
  context_codes: string[];
  context_multipliers: number[]; // resolved via ref_context
}

interface RunInputBundle {
  data_boost: number;
  frequency_boost: number;
  automation_boost: number;
  extension_boost: number;
}

export function calculateToolScore(
  tool: ToolInputBundle,
  run: RunInputBundle,
): ToolScoreResult {
  const shadow_base = shadowBaseFor(tool.org_policy_status_code_snapshot);
  const shadow_score = shadow_base;

  // Hoogste use_case_base over alle use cases per tool
  let use_case_base = 0;
  let agentic_boost = 0;
  for (const uc of tool.use_case_codes) {
    use_case_base = Math.max(use_case_base, useCaseBaseFor(uc));
    if (AGENTIC_USE_CASES.has(uc)) agentic_boost = 20;
  }
  if (tool.use_case_codes.length === 0) use_case_base = 10;

  // Hoogste context-multiplier
  const context_multiplier =
    tool.context_multipliers.length > 0
      ? Math.max(...tool.context_multipliers)
      : 1.0;

  // Hoogste account-multiplier
  let account_multiplier = 1.4;
  if (tool.account_type_codes.length > 0) {
    account_multiplier = Math.max(
      ...tool.account_type_codes.map((c) => accountMultiplierFor(c)),
    );
  }

  const raw_exposure_score =
    use_case_base * context_multiplier * account_multiplier +
    run.data_boost +
    run.frequency_boost +
    run.automation_boost +
    run.extension_boost +
    agentic_boost;

  const exposure_score = Math.min(raw_exposure_score, 100);

  const toxic_boost = shadow_score > 50 && exposure_score > 50 ? 20 : 0;
  const review_boost = 0; // gereserveerd; geen formule gespecificeerd

  const priority_score_raw =
    0.45 * shadow_score + 0.45 * exposure_score + toxic_boost + review_boost;
  const priority_score = Math.min(priority_score_raw, 100);

  // Review triggers per tool
  const triggers: string[] = [];
  if (shadow_base === 80) triggers.push("prohibited_tool");
  if (agentic_boost > 0) triggers.push("agentic_usage");
  if (run.automation_boost > 0 && shadow_base > 0)
    triggers.push("automation_unmanaged");
  if (run.extension_boost > 0 && shadow_base > 0)
    triggers.push("extension_unmanaged");
  if (run.data_boost === 30 && shadow_base === 0)
    triggers.push("special_category_data");
  if (tool.context_codes.includes("hr_evaluatie"))
    triggers.push("hr_evaluation_context");
  // priority_threshold trigger wordt later gevuld zodra de config-drempel bekend is

  return {
    survey_tool_id: tool.survey_tool_id,
    tool_code: tool.tool_code,
    tool_name: tool.tool_name,
    shadow_base,
    shadow_score: round2(shadow_score),
    use_case_base,
    context_multiplier: round2(context_multiplier),
    account_multiplier: round2(account_multiplier),
    data_boost: run.data_boost,
    frequency_boost: run.frequency_boost,
    automation_boost: run.automation_boost,
    extension_boost: run.extension_boost,
    agentic_boost,
    raw_exposure_score: round2(raw_exposure_score),
    exposure_score: round2(exposure_score),
    toxic_boost,
    review_boost,
    priority_score_raw: round2(priority_score_raw),
    priority_score: round2(priority_score),
    review_trigger_codes: triggers,
    dpo_review_required: false, // wordt na config-drempel-toets bijgewerkt
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Run-totaal
// ──────────────────────────────────────────────────────────────────────────────

export function calculateRunScore(
  tools: ToolScoreResult[],
  config: ScoringConfig,
): RunScoreResult {
  if (tools.length === 0) {
    return {
      person_score: 0,
      assigned_tier: "standard",
      review_trigger_codes: [],
      warnings: [],
      exit_path: true,
      shadow_tool_count: 0,
      highest_priority_score: 0,
      highest_risk_tool: null,
      highest_risk_use_case: null,
      highest_risk_context: null,
    };
  }

  let maxShadow = 0;
  let maxExposure = 0;
  let maxPriority = 0;
  let topTool: ToolScoreResult | null = null;

  for (const t of tools) {
    if (t.shadow_score > maxShadow) maxShadow = t.shadow_score;
    if (t.exposure_score > maxExposure) maxExposure = t.exposure_score;
    if (t.priority_score > maxPriority) {
      maxPriority = t.priority_score;
      topTool = t;
    }
    // priority_threshold trigger toevoegen indien drempel gehaald
    if (
      t.priority_score >= config.priority_review_threshold &&
      !t.review_trigger_codes.includes("priority_threshold")
    ) {
      t.review_trigger_codes.push("priority_threshold");
    }
    t.dpo_review_required =
      t.priority_score >= config.priority_review_threshold;
  }

  let assigned_tier: RunScoreResult["assigned_tier"] = "standard";
  if (
    maxShadow > config.toxic_shadow_threshold &&
    maxExposure > config.toxic_exposure_threshold
  ) {
    assigned_tier = "toxic_shadow";
  } else if (maxPriority >= config.priority_review_threshold) {
    assigned_tier = "priority_review";
  }

  const allTriggers = new Set<string>();
  for (const t of tools) {
    for (const code of t.review_trigger_codes) allTriggers.add(code);
  }

  return {
    person_score: round2(maxPriority),
    assigned_tier,
    review_trigger_codes: Array.from(allTriggers),
    warnings: [],
    exit_path: false,
    shadow_tool_count: tools.length,
    highest_priority_score: round2(maxPriority),
    highest_risk_tool: topTool?.tool_code ?? topTool?.tool_name ?? null,
    highest_risk_use_case: null,
    highest_risk_context: null,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Persistentie (idempotent)
// ──────────────────────────────────────────────────────────────────────────────

async function persistScores(
  surveyRunId: string,
  config: ScoringConfig,
  toolScores: ToolScoreResult[],
  runScore: RunScoreResult,
): Promise<void> {
  // 1. risk_result upsert (PK = survey_run_id)
  const { error: rrErr } = await supabase.from("risk_result").upsert(
    {
      survey_run_id: surveyRunId,
      person_score_raw: runScore.person_score,
      person_score: runScore.person_score,
      assigned_tier: runScore.assigned_tier,
      dpo_review_required: runScore.assigned_tier !== "standard",
      toxic_combination: runScore.assigned_tier === "toxic_shadow",
      shadow_tool_count: runScore.shadow_tool_count,
      review_trigger_codes: runScore.review_trigger_codes,
      highest_risk_tool: runScore.highest_risk_tool,
      highest_risk_use_case: runScore.highest_risk_use_case,
      highest_risk_context: runScore.highest_risk_context,
      highest_priority_score: runScore.highest_priority_score,
      hard_override: false,
      override_reason: null,
    },
    { onConflict: "survey_run_id" },
  );
  if (rrErr) throw new Error(`risk_result upsert: ${rrErr.message}`);

  // 2. risk_result_tool: eerst alle bestaande voor deze run weghalen,
  //    daarna de nieuwe set inserten. Dit garandeert dat tools die niet
  //    meer in de run zitten ook verdwijnen (idempotent).
  const { error: delErr } = await supabase
    .from("risk_result_tool")
    .delete()
    .eq("survey_run_id", surveyRunId);
  if (delErr) throw new Error(`risk_result_tool delete: ${delErr.message}`);

  if (toolScores.length === 0) return;

  const rows = toolScores.map((t) => ({
    survey_run_id: surveyRunId,
    survey_tool_id: t.survey_tool_id,
    shadow_base: t.shadow_base,
    shadow_score: t.shadow_score,
    use_case_base: t.use_case_base,
    context_multiplier: t.context_multiplier,
    account_multiplier: t.account_multiplier,
    data_boost: t.data_boost,
    frequency_boost: t.frequency_boost,
    automation_boost: t.automation_boost,
    extension_boost: t.extension_boost,
    agentic_boost: t.agentic_boost,
    raw_exposure_score: t.raw_exposure_score,
    exposure_score: t.exposure_score,
    toxic_boost: t.toxic_boost,
    review_boost: t.review_boost,
    priority_score_raw: t.priority_score_raw,
    priority_score: t.priority_score,
    dpo_review_required: t.dpo_review_required,
    review_trigger_codes: t.review_trigger_codes,
    scoring_config_id: config.id,
    priority_review_threshold_used: config.priority_review_threshold,
    toxic_shadow_threshold_used: config.toxic_shadow_threshold,
    toxic_exposure_threshold_used: config.toxic_exposure_threshold,
    hard_override: false,
    override_reason: null,
  }));

  const { error: insErr } = await supabase
    .from("risk_result_tool")
    .insert(rows);
  if (insErr) throw new Error(`risk_result_tool insert: ${insErr.message}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Hoofd-entrypoint
// ──────────────────────────────────────────────────────────────────────────────

export async function calculateScoresForRun(
  surveyRunId: string,
  configId?: string,
): Promise<{
  person_score: number;
  assigned_tier: string;
  review_trigger_codes: string[];
  warnings: string[];
  exit_path: boolean;
}> {
  const warnings: string[] = [];

  // 1. survey_run
  const { data: run, error: runErr } = await supabase
    .from("survey_run")
    .select("id, org_id, wave_id")
    .eq("id", surveyRunId)
    .maybeSingle();
  if (runErr) throw new Error(`survey_run: ${runErr.message}`);
  if (!run) throw new Error(`survey_run ${surveyRunId} niet gevonden`);

  // 2. scan_scoring_config
  let config: ScoringConfig = { ...DEFAULT_CONFIG };
  let cfgQuery = supabase
    .from("scan_scoring_config")
    .select(
      "id, priority_review_threshold, toxic_shadow_threshold, toxic_exposure_threshold, dashboard_min_cell_size, active_from, active_until",
    )
    .eq("org_id", run.org_id);
  if (configId) cfgQuery = cfgQuery.eq("id", configId);
  const { data: cfgRows, error: cfgErr } = await cfgQuery
    .order("active_from", { ascending: false })
    .limit(1);
  if (cfgErr) {
    warnings.push(`scan_scoring_config lookup faalde: ${cfgErr.message}`);
  } else if (cfgRows && cfgRows.length > 0) {
    const c = cfgRows[0];
    config = {
      id: c.id,
      priority_review_threshold: Number(c.priority_review_threshold),
      toxic_shadow_threshold: Number(c.toxic_shadow_threshold),
      toxic_exposure_threshold: Number(c.toxic_exposure_threshold),
      dashboard_min_cell_size: Number(c.dashboard_min_cell_size),
    };
  } else {
    warnings.push("Geen actieve scan_scoring_config; defaults gebruikt.");
  }

  // 3. survey_tool + child queries
  const { data: tools, error: toolsErr } = await supabase
    .from("survey_tool")
    .select(
      "id, tool_code, tool_name, org_policy_status_code_snapshot",
    )
    .eq("survey_run_id", surveyRunId);
  if (toolsErr) throw new Error(`survey_tool: ${toolsErr.message}`);

  // 4. survey_profile
  const { data: profile, error: profErr } = await supabase
    .from("survey_profile")
    .select(
      "ai_frequency_code, automation_usage_code, browser_extension_usage_code",
    )
    .eq("survey_run_id", surveyRunId)
    .maybeSingle();
  if (profErr) warnings.push(`survey_profile: ${profErr.message}`);
  if (!profile) warnings.push("survey_profile ontbreekt; alle boosts 0");

  // 5. survey_data_type
  const { data: dataTypes, error: dtErr } = await supabase
    .from("survey_data_type")
    .select("data_type_code")
    .eq("survey_run_id", surveyRunId);
  if (dtErr) warnings.push(`survey_data_type: ${dtErr.message}`);
  const dataTypeCodes = (dataTypes ?? []).map((r) => r.data_type_code);
  const data_boost = dataBoostFor(dataTypeCodes);
  if (dataTypeCodes.length === 0)
    warnings.push("Geen survey_data_type-rijen; data_boost=0");

  const frequency_boost = frequencyBoostFor(profile?.ai_frequency_code);
  if (!profile?.ai_frequency_code)
    warnings.push("ai_frequency_code ontbreekt; frequency_boost=0");

  const automation_boost = automationBoostFor(profile?.automation_usage_code);
  if (!profile?.automation_usage_code)
    warnings.push("automation_usage_code ontbreekt; automation_boost=0");

  const extension_boost = extensionBoostFor(
    profile?.browser_extension_usage_code,
  );
  if (!profile?.browser_extension_usage_code)
    warnings.push(
      "browser_extension_usage_code ontbreekt; extension_boost=0",
    );

  const runInput: RunInputBundle = {
    data_boost,
    frequency_boost,
    automation_boost,
    extension_boost,
  };

  // ── Exitpad: geen tools ─────────────────────────────────────────────
  if (!tools || tools.length === 0) {
    await persistScores(
      surveyRunId,
      config,
      [],
      {
        person_score: 0,
        assigned_tier: "standard",
        review_trigger_codes: [],
        warnings,
        exit_path: true,
        shadow_tool_count: 0,
        highest_priority_score: 0,
        highest_risk_tool: null,
        highest_risk_use_case: null,
        highest_risk_context: null,
      },
    );
    return {
      person_score: 0,
      assigned_tier: "standard",
      review_trigger_codes: [],
      warnings,
      exit_path: true,
    };
  }

  const toolIds = tools.map((t) => t.id);

  // 6. accounts per tool
  const { data: accounts, error: accErr } = await supabase
    .from("survey_tool_account")
    .select("survey_tool_id, account_type_code")
    .in("survey_tool_id", toolIds);
  if (accErr) warnings.push(`survey_tool_account: ${accErr.message}`);

  // 7. use cases per tool
  const { data: useCases, error: ucErr } = await supabase
    .from("survey_tool_use_case")
    .select("id, survey_tool_id, use_case_code")
    .in("survey_tool_id", toolIds);
  if (ucErr) warnings.push(`survey_tool_use_case: ${ucErr.message}`);

  const useCaseIds = (useCases ?? []).map((u) => u.id);

  // 8. contexten per use case
  let contexts: Array<{ survey_tool_use_case_id: string; context_code: string }> =
    [];
  if (useCaseIds.length > 0) {
    const { data: ctxRows, error: ctxErr } = await supabase
      .from("survey_tool_use_case_context")
      .select("survey_tool_use_case_id, context_code")
      .in("survey_tool_use_case_id", useCaseIds);
    if (ctxErr) warnings.push(`survey_tool_use_case_context: ${ctxErr.message}`);
    contexts = ctxRows ?? [];
  }

  // 9. ref_context multipliers
  const { data: refContexts, error: refErr } = await supabase
    .from("ref_context")
    .select("code, context_multiplier");
  if (refErr) warnings.push(`ref_context: ${refErr.message}`);
  const ctxMultiplierMap = new Map<string, number>();
  for (const r of refContexts ?? [])
    ctxMultiplierMap.set(r.code, Number(r.context_multiplier));

  // ── Aggregeer per tool ─────────────────────────────────────────────
  const accountsByTool = new Map<string, string[]>();
  for (const a of accounts ?? []) {
    const arr = accountsByTool.get(a.survey_tool_id) ?? [];
    arr.push(a.account_type_code);
    accountsByTool.set(a.survey_tool_id, arr);
  }

  const useCasesByTool = new Map<string, Array<{ id: string; code: string }>>();
  for (const u of useCases ?? []) {
    const arr = useCasesByTool.get(u.survey_tool_id) ?? [];
    arr.push({ id: u.id, code: u.use_case_code });
    useCasesByTool.set(u.survey_tool_id, arr);
  }

  const contextsByUseCase = new Map<string, string[]>();
  for (const c of contexts) {
    const arr = contextsByUseCase.get(c.survey_tool_use_case_id) ?? [];
    arr.push(c.context_code);
    contextsByUseCase.set(c.survey_tool_use_case_id, arr);
  }

  const toolBundles: ToolInputBundle[] = tools.map((t) => {
    const accountCodes = accountsByTool.get(t.id) ?? [];
    if (accountCodes.length === 0)
      warnings.push(
        `tool ${t.tool_name}: account_type ontbreekt → multiplier 1.4`,
      );
    const ucList = useCasesByTool.get(t.id) ?? [];
    const ucCodes = ucList.map((u) => u.code);
    const allCtxCodes: string[] = [];
    const allCtxMult: number[] = [];
    for (const u of ucList) {
      const codes = contextsByUseCase.get(u.id) ?? [];
      for (const code of codes) {
        allCtxCodes.push(code);
        const mult = ctxMultiplierMap.get(code);
        if (typeof mult === "number") allCtxMult.push(mult);
        else
          warnings.push(
            `context_code "${code}" niet in ref_context; multiplier 1.0`,
          );
      }
    }
    if (!t.org_policy_status_code_snapshot)
      warnings.push(
        `tool ${t.tool_name}: org_policy_status_code_snapshot ontbreekt → shadow_base=20`,
      );
    return {
      survey_tool_id: t.id,
      tool_code: t.tool_code,
      tool_name: t.tool_name,
      org_policy_status_code_snapshot: t.org_policy_status_code_snapshot,
      account_type_codes: accountCodes,
      use_case_codes: ucCodes,
      context_codes: allCtxCodes,
      context_multipliers: allCtxMult,
    };
  });

  const toolScores = toolBundles.map((b) => calculateToolScore(b, runInput));
  const runScore = calculateRunScore(toolScores, config);
  runScore.warnings = warnings;

  await persistScores(surveyRunId, config, toolScores, runScore);

  return {
    person_score: runScore.person_score,
    assigned_tier: runScore.assigned_tier,
    review_trigger_codes: runScore.review_trigger_codes,
    warnings,
    exit_path: false,
  };
}

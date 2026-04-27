/**
 * Shadow Survey Engine V8.1
 *
 * Persistente storage-laag voor de Shadow AI Scan v8.1 vragenlijst.
 * Spreekt rechtstreeks de Supabase-tabellen aan (geen afhankelijkheid van
 * de oudere shadowSurveyEngine.ts of riskEngine.ts).
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Types
// ============================================================================

export interface SurveyProfileData {
  department_code?: string | null;
  department_other_text?: string | null;
  ai_frequency_code?: string | null;
  no_ai_reason_code?: string | null;
  data_awareness_code?: string | null;
  anonymization_behavior_code?: string | null;
  browser_extension_usage_code?: string | null;
  automation_usage_code?: string | null;
}

export interface SelectedToolState {
  surveyToolId: string;
  toolName: string;
  useCaseCodes: string[];
  contextCodes: string[];
  accountTypeCode: string | null;
}

export interface SurveyState {
  surveyRunId: string | null;
  currentStep: number; // 1..9
  selectedTools: SelectedToolState[];
}

// ============================================================================
// Helpers
// ============================================================================

function failOn(operation: string, error: unknown): never {
  // Geen stille fouten — altijd doorgooien met context.
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  throw new Error(`[shadowSurveyEngineV8] ${operation} failed: ${message}`);
}

// ============================================================================
// 1. createSurveyRun
// ============================================================================

export async function createSurveyRun(
  orgId: string,
  waveId?: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("survey_run")
    .insert({
      org_id: orgId,
      wave_id: waveId ?? null,
      locale: "nl",
      source: "web",
    })
    .select("id")
    .single();

  if (error) failOn("createSurveyRun", error);
  if (!data?.id) failOn("createSurveyRun", "no id returned");
  return data.id;
}

// ============================================================================
// 2. saveSurveyProfile
// ============================================================================

export async function saveSurveyProfile(
  surveyRunId: string,
  data: SurveyProfileData,
): Promise<void> {
  // Bouw payload dynamisch: alleen velden die expliciet zijn meegegeven
  // (inclusief expliciet null) worden opgenomen. Ontbrekende (undefined)
  // velden blijven onaangeroerd in de database.
  const payload: Record<string, unknown> = {
    survey_run_id: surveyRunId,
  };
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  const { error } = await supabase
    .from("survey_profile")
    .upsert(payload as never, { onConflict: "survey_run_id" });

  if (error) failOn("saveSurveyProfile", error);
}

// ============================================================================
// 3. saveMotivations
// ============================================================================

export interface MotivationInput {
  code: string;
  other_text?: string | null;
}

export async function saveMotivations(
  surveyRunId: string,
  motivations: Array<MotivationInput | string>,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("survey_motivation")
    .delete()
    .eq("survey_run_id", surveyRunId);

  if (deleteError) failOn("saveMotivations.delete", deleteError);

  if (motivations.length === 0) return;

  const rows = motivations.map((m) => {
    const code = typeof m === "string" ? m : m.code;
    const other =
      typeof m === "string"
        ? null
        : m.other_text !== undefined && m.other_text !== null && m.other_text !== ""
          ? m.other_text
          : null;
    return {
      survey_run_id: surveyRunId,
      motivation_code: code,
      motivation_other_text: other,
    };
  });

  const { error: insertError } = await supabase
    .from("survey_motivation")
    .insert(rows);

  if (insertError) failOn("saveMotivations.insert", insertError);
}

// ============================================================================
// 4. saveTool
// ============================================================================

export interface SaveToolInput {
  toolCode: string | null;
  toolName: string;
  isCustom: boolean;
  catalogBeheerstatusCode?: string | null;
}

/**
 * Schrijft één survey_tool-rij. Voor catalogus-tools (isCustom=false) wordt
 * tegelijk de org_tool_policy snapshot opgezocht. Voor custom tools (of
 * tools zonder code) wordt aanvullend een tool_catalog_discovery-rij
 * aangemaakt zodat de DPO de inzending kan reviewen.
 */
export async function saveTool(
  surveyRunId: string,
  orgId: string,
  tool: SaveToolInput,
): Promise<string> {
  // Snapshot van org_tool_policy: alleen voor catalogustools met code.
  let policyStatus: string = "newly_discovered";
  let euFlag: string = "none";

  // NOTE: Voorlopig gebruiken we tools_library.id als tool_code omdat
  // tools_library nog geen aparte tool_code-kolom heeft. org_tool_policy moet
  // dezelfde sleutel gebruiken totdat tools_library een stabiele tool_code krijgt.
  if (!tool.isCustom && tool.toolCode) {
    const { data: policy, error: policyError } = await supabase
      .from("org_tool_policy")
      .select("org_policy_status_code, eu_ai_act_flag_code")
      .eq("org_id", orgId)
      .eq("tool_code", tool.toolCode)
      .maybeSingle();

    if (policyError) failOn("saveTool.policyLookup", policyError);

    if (policy) {
      policyStatus = policy.org_policy_status_code ?? "newly_discovered";
      euFlag = policy.eu_ai_act_flag_code ?? "none";
    }
  }

  const { data, error } = await supabase
    .from("survey_tool")
    .insert({
      survey_run_id: surveyRunId,
      tool_code: tool.toolCode ?? null,
      tool_name: tool.toolName,
      is_custom: tool.isCustom,
      catalog_beheerstatus_code: tool.catalogBeheerstatusCode ?? null,
      org_policy_status_code_snapshot: policyStatus,
      eu_ai_act_flag_code_snapshot: euFlag,
    })
    .select("id")
    .single();

  if (error) failOn("saveTool", error);
  if (!data?.id) failOn("saveTool", "no id returned");

  const surveyToolId = data.id;

  // Custom of catalog-loze tools → registreer als discovery zodat DPO ze kan reviewen.
  if (tool.isCustom || !tool.toolCode) {
    const { error: discoveryError } = await supabase
      .from("tool_catalog_discovery")
      .insert({
        org_id: orgId,
        survey_run_id: surveyRunId,
        survey_tool_id: surveyToolId,
        raw_tool_name: tool.toolName,
        discovery_source: "survey",
        review_status: "pending",
      });

    if (discoveryError) failOn("saveTool.discovery", discoveryError);
  }

  return surveyToolId;
}

// ============================================================================
// 5. saveToolUseCases
// ============================================================================

export async function saveToolUseCases(
  surveyToolId: string,
  useCaseCodes: string[],
): Promise<string[]> {
  if (useCaseCodes.length === 0) return [];

  const rows = useCaseCodes.map((code) => ({
    survey_tool_id: surveyToolId,
    use_case_code: code,
  }));

  const { data, error } = await supabase
    .from("survey_tool_use_case")
    .insert(rows)
    .select("id");

  if (error) failOn("saveToolUseCases", error);
  return (data ?? []).map((r) => r.id);
}

// ============================================================================
// 6. saveToolUseCaseContext
// ============================================================================

export async function saveToolUseCaseContext(
  surveyToolUseCaseId: string,
  contextCodes: string[],
): Promise<void> {
  if (contextCodes.length === 0) return;

  const rows = contextCodes.map((code) => ({
    survey_tool_use_case_id: surveyToolUseCaseId,
    context_code: code,
  }));

  const { error } = await supabase
    .from("survey_tool_use_case_context")
    .insert(rows);

  if (error) failOn("saveToolUseCaseContext", error);
}

// ============================================================================
// 7. saveToolAccount
// ============================================================================

export async function saveToolAccount(
  surveyToolId: string,
  accountTypeCode: string,
): Promise<void> {
  const { error } = await supabase
    .from("survey_tool_account")
    .upsert(
      {
        survey_tool_id: surveyToolId,
        account_type_code: accountTypeCode,
      },
      { onConflict: "survey_tool_id" },
    );

  if (error) failOn("saveToolAccount", error);
}

// ============================================================================
// 8. saveDataTypes
// ============================================================================

export async function saveDataTypes(
  surveyRunId: string,
  codes: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("survey_data_type")
    .delete()
    .eq("survey_run_id", surveyRunId);

  if (deleteError) failOn("saveDataTypes.delete", deleteError);

  if (codes.length === 0) return;

  const rows = codes.map((code) => ({
    survey_run_id: surveyRunId,
    data_type_code: code,
  }));

  const { error: insertError } = await supabase
    .from("survey_data_type")
    .insert(rows);

  if (insertError) failOn("saveDataTypes.insert", insertError);
}

// ============================================================================
// 9. saveConcerns
// ============================================================================

export async function saveConcerns(
  surveyRunId: string,
  codes: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("survey_top_concern")
    .delete()
    .eq("survey_run_id", surveyRunId);

  if (deleteError) failOn("saveConcerns.delete", deleteError);

  if (codes.length === 0) return;

  const rows = codes.map((code) => ({
    survey_run_id: surveyRunId,
    top_concern_code: code,
  }));

  const { error: insertError } = await supabase
    .from("survey_top_concern")
    .insert(rows);

  if (insertError) failOn("saveConcerns.insert", insertError);
}

// ============================================================================
// 10. saveSupportNeeds
// ============================================================================

export async function saveSupportNeeds(
  surveyRunId: string,
  codes: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("survey_support_need")
    .delete()
    .eq("survey_run_id", surveyRunId);

  if (deleteError) failOn("saveSupportNeeds.delete", deleteError);

  if (codes.length === 0) return;

  const rows = codes.map((code) => ({
    survey_run_id: surveyRunId,
    support_need_code: code,
  }));

  const { error: insertError } = await supabase
    .from("survey_support_need")
    .insert(rows);

  if (insertError) failOn("saveSupportNeeds.insert", insertError);
}

// ============================================================================
// 11. completeSurveyRun
// ============================================================================

export async function completeSurveyRun(
  surveyRunId: string,
  consentAmbassador: boolean,
  ambassadorEmail?: string,
): Promise<void> {
  const payload: {
    completed_at: string;
    consent_ambassador: boolean;
    ambassador_email?: string | null;
  } = {
    completed_at: new Date().toISOString(),
    consent_ambassador: consentAmbassador,
  };

  if (consentAmbassador && ambassadorEmail) {
    payload.ambassador_email = ambassadorEmail;
  }

  const { error } = await supabase
    .from("survey_run")
    .update(payload)
    .eq("id", surveyRunId);

  if (error) failOn("completeSurveyRun", error);
}

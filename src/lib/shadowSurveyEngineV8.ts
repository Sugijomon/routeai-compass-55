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

export async function saveTool(
  surveyRunId: string,
  tool: { toolCode?: string; toolName: string; isCustom: boolean },
): Promise<string> {
  const { data, error } = await supabase
    .from("survey_tool")
    .insert({
      survey_run_id: surveyRunId,
      tool_code: tool.toolCode ?? null,
      tool_name: tool.toolName,
      is_custom: tool.isCustom,
    })
    .select("id")
    .single();

  if (error) failOn("saveTool", error);
  if (!data?.id) failOn("saveTool", "no id returned");

  const surveyToolId = data.id;

  // Custom of catalog-loze tools → registreer als discovery.
  if (tool.isCustom || !tool.toolCode) {
    const { data: runRow, error: runError } = await supabase
      .from("survey_run")
      .select("org_id")
      .eq("id", surveyRunId)
      .single();

    if (runError) failOn("saveTool.discovery.lookupOrg", runError);
    if (!runRow?.org_id) failOn("saveTool.discovery.lookupOrg", "no org_id");

    const { error: discoveryError } = await supabase
      .from("tool_catalog_discovery")
      .insert({
        org_id: runRow.org_id,
        survey_run_id: surveyRunId,
        survey_tool_id: surveyToolId,
        raw_tool_name: tool.toolName,
        discovery_source: "survey",
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

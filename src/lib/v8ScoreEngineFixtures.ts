/**
 * V8 Score Engine — fixture-runs voor handmatige validatie.
 *
 * Per scenario maken we een minimale survey_run + child-rijen rechtstreeks
 * via supabase.insert(), zodat de scoring deterministisch te valideren is
 * zonder de volledige UI-flow te doorlopen.
 *
 * Gebruikt voor /admin/scan-v8-debug → "Test scenario's".
 *
 * BELANGRIJK: deze helper raakt scoreformules NIET. Hij maakt enkel
 * input-data, daarna roep je calculateScoresForRun(runId) handmatig aan.
 */

import { supabase } from "@/integrations/supabase/client";

export type ScenarioCode =
  | "approved_special_data"
  | "prohibited_tool"
  | "agentic_use_case";

export interface ScenarioResult {
  scenario: ScenarioCode;
  surveyRunId: string;
  surveyToolId: string;
  notes: string[];
}

async function createRun(orgId: string): Promise<string> {
  const { data, error } = await supabase
    .from("survey_run")
    .insert({
      org_id: orgId,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      source: "debug_fixture",
      locale: "nl",
      consent_ambassador: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(`survey_run insert: ${error.message}`);
  return data.id as string;
}

async function createProfile(surveyRunId: string) {
  // Minimaal profiel; bewust geen automation/extension om defaults te gebruiken.
  const { error } = await supabase.from("survey_profile").insert({
    survey_run_id: surveyRunId,
    department_code: "anders",
    ai_frequency_code: "wekelijks",
  });
  if (error) throw new Error(`survey_profile insert: ${error.message}`);
}

async function createTool(
  surveyRunId: string,
  toolName: string,
  policyStatus: "approved" | "prohibited" | "newly_discovered",
): Promise<string> {
  const { data, error } = await supabase
    .from("survey_tool")
    .insert({
      survey_run_id: surveyRunId,
      tool_code: null, // custom-achtig: snapshot is leidend
      tool_name: toolName,
      is_custom: true,
      org_policy_status_code_snapshot: policyStatus,
      eu_ai_act_flag_code_snapshot: "none",
    })
    .select("id")
    .single();
  if (error) throw new Error(`survey_tool insert: ${error.message}`);
  return data.id as string;
}

async function addUseCase(
  surveyToolId: string,
  useCaseCode: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("survey_tool_use_case")
    .insert({
      survey_tool_id: surveyToolId,
      use_case_code: useCaseCode,
    })
    .select("id")
    .single();
  if (error) throw new Error(`survey_tool_use_case insert: ${error.message}`);
  return data.id as string;
}

async function addAccount(surveyToolId: string, accountCode: string) {
  const { error } = await supabase.from("survey_tool_account").upsert(
    {
      survey_tool_id: surveyToolId,
      account_type_code: accountCode,
    },
    { onConflict: "survey_tool_id" },
  );
  if (error) throw new Error(`survey_tool_account upsert: ${error.message}`);
}

async function addDataType(surveyRunId: string, dataTypeCode: string) {
  const { error } = await supabase.from("survey_data_type").insert({
    survey_run_id: surveyRunId,
    data_type_code: dataTypeCode,
  });
  if (error) throw new Error(`survey_data_type insert: ${error.message}`);
}

/**
 * Scenario 1: Approved tool + gevoelig persoonsgegeven.
 *  - shadow_base = 0  (approved → 0)
 *  - data_boost  = 30 (gevoelig_persoonsgegeven)
 *  - trigger     = special_category_data (shadow_base==0 + data_boost==30)
 */
export async function scenarioApprovedSpecialData(
  orgId: string,
): Promise<ScenarioResult> {
  const surveyRunId = await createRun(orgId);
  await createProfile(surveyRunId);
  const toolId = await createTool(
    surveyRunId,
    "TEST: approved + gevoelige data",
    "approved",
  );
  await addUseCase(toolId, "teksten_schrijven");
  await addAccount(toolId, "zakelijke_licentie");
  await addDataType(surveyRunId, "gevoelig_persoonsgegeven");
  return {
    scenario: "approved_special_data",
    surveyRunId,
    surveyToolId: toolId,
    notes: [
      "Verwacht: shadow_base=0, data_boost=30",
      "Verwacht trigger: special_category_data",
    ],
  };
}

/**
 * Scenario 2: Prohibited tool.
 *  - shadow_base = 80 (prohibited)
 *  - trigger     = prohibited_tool
 */
export async function scenarioProhibitedTool(
  orgId: string,
): Promise<ScenarioResult> {
  const surveyRunId = await createRun(orgId);
  await createProfile(surveyRunId);
  const toolId = await createTool(
    surveyRunId,
    "TEST: prohibited tool",
    "prohibited",
  );
  await addUseCase(toolId, "teksten_schrijven");
  await addAccount(toolId, "prive_gratis");
  await addDataType(surveyRunId, "namen");
  return {
    scenario: "prohibited_tool",
    surveyRunId,
    surveyToolId: toolId,
    notes: [
      "Verwacht: shadow_base=80",
      "Verwacht trigger: prohibited_tool",
    ],
  };
}

/**
 * Scenario 3: Agentic use case.
 *  - use_case_code in {workflow_uitvoeren, systemen_aansturen, taken_automatisch_afhandelen}
 *  - agentic_boost = 20
 *  - trigger       = agentic_usage
 */
export async function scenarioAgenticUseCase(
  orgId: string,
): Promise<ScenarioResult> {
  const surveyRunId = await createRun(orgId);
  await createProfile(surveyRunId);
  const toolId = await createTool(
    surveyRunId,
    "TEST: agentic use case",
    "newly_discovered",
  );
  await addUseCase(toolId, "workflow_uitvoeren");
  await addAccount(toolId, "zakelijke_licentie");
  await addDataType(surveyRunId, "interne_documenten");
  return {
    scenario: "agentic_use_case",
    surveyRunId,
    surveyToolId: toolId,
    notes: [
      "Verwacht: agentic_boost=20",
      "Verwacht trigger: agentic_usage",
    ],
  };
}

export const SCENARIO_LABELS: Record<ScenarioCode, string> = {
  approved_special_data: "1. Approved + gevoelige data",
  prohibited_tool: "2. Prohibited tool",
  agentic_use_case: "3. Agentic use case",
};

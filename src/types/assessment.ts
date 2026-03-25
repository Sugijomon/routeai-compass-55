// RouteAI Risk Engine — Assessment types
// Correspondeert met public.assessments tabel + enums

export type AssessmentRoute  = 'green' | 'yellow' | 'orange' | 'red';
export type RoutingMethod    = 'deterministic' | 'claude_assisted';
export type AssessmentStatus = 'active' | 'paused' | 'stopped' | 'superseded';

export type ArchetypeCode =
  | 'G-01' | 'G-02' | 'G-03' | 'G-04'
  | 'Y-01' | 'Y-02' | 'Y-03'
  | 'O-01' | 'O-02' | 'O-03' | 'O-04'
  | 'R-01' | 'R-02' | 'R-03' | 'R-04';

// Survey V1–V6 antwoordtypes
export type V1Answer = 'standard' | 'custom_prompts' | 'technical_modification';
export type V2Main   = 'supportive' | 'informative' | 'evaluative' | 'decision_prep' | 'autonomous';
export type V3Answer = 'self' | 'internal' | 'external' | 'vulnerable';
export type V4Answer = 'public' | 'confidential' | 'personal' | 'sensitive';
export type V5Answer = 'hitl_strict' | 'hitl_alert' | 'automated';
export type V6Answer = 'yes' | 'no' | 'unsure';

export interface SurveyAnswers {
  V1:                    V1Answer;
  V1_sub?:               string;
  V2_main:               V2Main;
  V2_sub?:               string;
  V2_freetext_original:  null;
  V3:                    V3Answer;
  V4:                    V4Answer;
  V5:                    V5Answer;
  V6?:                   V6Answer;
}

// Deterministic engine output
export interface EngineOutput {
  route:                 AssessmentRoute;
  primary_archetype:     ArchetypeCode;
  secondary_archetypes:  ArchetypeCode[];
  archetype_refs:        string[];
  escalation_refs:       string[];
  plain_language:        string;
  routing_method:        RoutingMethod;
  decision_version:      string;
  claude_input_hash?:    string;
  reason_filtered?:      string;
}

// Compliance-vereisten afgeleid uit route + archetype
export interface AssessmentRequirements {
  dpia_required:          boolean;
  fria_required:          boolean;
  transparency_required:  boolean;
  transparency_template?: string;
  dpo_oversight_required: boolean;
  user_instructions:      string[];
  dpo_instructions:       string[];
}

// Volledige assessment record (= database row)
export interface Assessment {
  id:                    string;
  org_id:                string;
  created_by:            string;
  created_at:            string;
  updated_at:            string;
  tool_id?:              string;
  tool_name_raw:         string;
  survey_answers:        SurveyAnswers;
  route:                 AssessmentRoute;
  primary_archetype:     ArchetypeCode;
  secondary_archetypes:  ArchetypeCode[];
  archetype_refs:        string[];
  escalation_refs:       string[];
  plain_language:        string;
  routing_method:        RoutingMethod;
  decision_version:      string;
  claude_input_hash?:    string;
  reason_filtered?:      string;
  dpia_required:         boolean;
  fria_required:         boolean;
  transparency_required: boolean;
  transparency_template?: string;
  dpo_oversight_required: boolean;
  user_instructions:     string[];
  dpo_instructions:      string[];
  status:                AssessmentStatus;
  reviewer_admin_id?:    string;
  reviewed_at?:          string;
}

// UI-configuratie per route
export const ROUTE_CONFIG = {
  green:  { label: 'Groen',  hex: '#16a34a', bg: 'bg-green-100',  text: 'text-green-800'  },
  yellow: { label: 'Amber',  hex: '#d97706', bg: 'bg-amber-100',  text: 'text-amber-800'  },
  orange: { label: 'Oranje', hex: '#ea580c', bg: 'bg-orange-100', text: 'text-orange-800' },
  red:    { label: 'Rood',   hex: '#dc2626', bg: 'bg-red-100',    text: 'text-red-800'    },
} as const;

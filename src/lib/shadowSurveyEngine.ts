// --- Gewichten (%) ---
export const RISK_WEIGHTS = {
  data_classification: 0.40,
  primary_use_case: 0.35,
  primary_concern: 0.25,
} as const;

// --- Scores per categorie ---
export const DATA_CLASSIFICATION_SCORES: Record<string, number> = {
  public: 10,
  internal: 35,
  client: 70,
  sensitive: 100,
};

export const PRIMARY_USE_CASE_SCORES: Record<string, number> = {
  research: 10,
  content: 20,
  data_analysis: 40,
  client_facing: 70,
  personal_data: 90,
};

export const PRIMARY_CONCERN_SCORES: Record<string, number> = {
  learning_curve: 10,
  accuracy: 30,
  cost: 20,
  privacy: 60,
  security: 80,
};

// --- Tier-drempels ---
export const TIER_THRESHOLDS = {
  standard: { min: 0, max: 40 },
  advanced: { min: 41, max: 70 },
  custom: { min: 71, max: 100 },
} as const;

export type DataClassification = 'public' | 'internal' | 'client' | 'sensitive';
export type AssignedTier = 'standard' | 'advanced' | 'custom';

export interface RiskResult {
  risk_score: number;
  assigned_tier: AssignedTier;
  dpo_review_required: boolean;
}

/**
 * Berekent risicoscore, tier-toewijzing en DPO-review vereiste
 * op basis van gewogen scores en harde overrides.
 */
export function calculateRiskScore(
  data_classification: DataClassification,
  primary_use_case: string,
  primary_concern: string,
  has_local_agent?: boolean,
): RiskResult {
  const dcScore = DATA_CLASSIFICATION_SCORES[data_classification] ?? 50;
  const ucScore = PRIMARY_USE_CASE_SCORES[primary_use_case] ?? 50;
  const pcScore = PRIMARY_CONCERN_SCORES[primary_concern] ?? 50;

  const raw =
    dcScore * RISK_WEIGHTS.data_classification +
    ucScore * RISK_WEIGHTS.primary_use_case +
    pcScore * RISK_WEIGHTS.primary_concern;

  const risk_score = Math.round(Math.min(100, Math.max(0, raw)));

  const assigned_tier: AssignedTier =
    risk_score <= TIER_THRESHOLDS.standard.max
      ? 'standard'
      : risk_score <= TIER_THRESHOLDS.advanced.max
        ? 'advanced'
        : 'custom';

  const dpo_review_required =
    data_classification === 'sensitive' ||
    primary_use_case === 'personal_data' ||
    has_local_agent === true ||
    risk_score >= TIER_THRESHOLDS.custom.min;

  return { risk_score, assigned_tier, dpo_review_required };
}

// --- EU AI Act Application Risk Classification ---

export type ApplicationRiskClass = 'minimal' | 'limited' | 'high' | 'unacceptable';

export interface ApplicationClassification {
  risk_class: ApplicationRiskClass;
  eu_ai_act_context: string;
  rationale: string;
}

// Use cases die escalatie naar 'high' triggeren, met Annex III context
const HIGH_RISK_USE_CASES: Record<string, string> = {
  hr_decision: 'Bijlage III punt 4 — werkgelegenheid, personeelsbeheer en toegang tot zelfstandige arbeid',
  personal_data: 'Bijlage III punt 5 — toegang tot en gebruik van essentiële particuliere en openbare diensten',
  medical: 'Bijlage III punt 5 — gezondheidszorg',
  credit_scoring: 'Bijlage III punt 5 — financiële diensten, kredietwaardigheid',
  law_enforcement: 'Bijlage III punt 6 — rechtshandhaving',
};

// Use cases die escalatie naar 'unacceptable' triggeren
const PROHIBITED_USE_CASES = ['manipulation', 'social_scoring', 'biometric_mass_surveillance'];

/**
 * Classificeert een tool-toepassing-combinatie volgens EU AI Act risicoklassen.
 * Onafhankelijk van calculateRiskScore (die is voor RouteAI tier-toewijzing).
 */
export function classifyApplication(
  use_cases: string[],
  data_sensitivity: string,
  _tool_name?: string,
): ApplicationClassification {
  const lowerCases = use_cases.map((uc) => uc.toLowerCase().trim());

  // 1. UNACCEPTABLE — Article 5
  const prohibitedMatch = lowerCases.find((uc) => PROHIBITED_USE_CASES.includes(uc));
  if (prohibitedMatch) {
    return {
      risk_class: 'unacceptable',
      eu_ai_act_context: 'Onaanvaardbaar risico — Art. 5 verboden praktijk',
      rationale: `Use case '${prohibitedMatch}' valt onder een verboden AI-praktijk (Art. 5 EU AI Act).`,
    };
  }

  // 2. HIGH — Article 6 + Annex III
  const highRiskMatch = lowerCases.find((uc) => uc in HIGH_RISK_USE_CASES);
  if (highRiskMatch) {
    return {
      risk_class: 'high',
      eu_ai_act_context: `Hoog risico — Art. 6 + ${HIGH_RISK_USE_CASES[highRiskMatch]}`,
      rationale: `Use case '${highRiskMatch}' valt onder Annex III van de EU AI Act.`,
    };
  }

  if (data_sensitivity === 'sensitive') {
    return {
      risk_class: 'high',
      eu_ai_act_context: 'Hoog risico — verwerking van gevoelige/bijzondere persoonsgegevens (Art. 6 + Bijlage III)',
      rationale: 'Gevoelige data-classificatie triggert hoog-risico classificatie ongeacht use case.',
    };
  }

  // 3. LIMITED — Article 52
  const hasClientFacing = lowerCases.includes('client_facing');
  if (data_sensitivity === 'client' || hasClientFacing) {
    return {
      risk_class: 'limited',
      eu_ai_act_context: 'Beperkt risico — Art. 52 transparantieverplichting van toepassing',
      rationale: data_sensitivity === 'client'
        ? 'Klant-/projectdata vereist transparantie over AI-gebruik richting betrokkenen.'
        : 'Klantgerichte toepassing vereist transparantie over AI-gebruik.',
    };
  }

  // 4. MINIMAL — Article 53
  return {
    risk_class: 'minimal',
    eu_ai_act_context: 'Minimaal risico — geen specifieke AI Act verplichtingen',
    rationale: 'Interne/publieke data zonder risicovol toepassingsdomein.',
  };
}

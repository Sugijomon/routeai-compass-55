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

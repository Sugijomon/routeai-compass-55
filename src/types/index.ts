// RouteAI Type Definitions
// Core governance model: RBAC (who manages) + AI License (what they can do)

export type TrainingLevel = 'basis' | 'gevorderd' | 'expert';
export type RiskLevel = 'minimal' | 'limited' | 'high' | 'unacceptable';

// AI Label System Types
export type RouteAIOordeel = 'vertrouwd' | 'vertrouwd-met-instructies' | 'verhoogde-aandacht' | 'niet-aanbevolen';
export type BetrouwbaarheidScore = 1 | 2 | 3 | 4 | 5;

export interface LightLabel {
  routeAIOordeel: RouteAIOordeel;
  privacy: {
    score: BetrouwbaarheidScore;
    summary: string;
  };
  training: {
    requiredLevel: TrainingLevel;
    summary: string;
  };
  betrouwbaarheid: {
    score: BetrouwbaarheidScore;
    summary: string;
  };
  spelregels: string[];
}

export interface FullNutritionLabel {
  identiteit: {
    naam: string;
    vendor: string;
    versie: string;
    releaseDate: string;
  };
  aiActClassificatie: {
    category: 'GPAI' | 'GPAI-SR' | 'High-Risk' | 'Limited-Risk' | 'Minimal-Risk';
    systemicRisk: boolean;
    annexCategory?: string;
    transparencyObligations: string[];
  };
  technischeDetails: {
    modelType: string;
    trainingDataCutoff?: string;
    contextWindow?: string;
    capabilities: string[];
  };
  privacyCompliance: {
    dataProcessingLocation: string;
    gdprCompliant: boolean;
    dataRetention: string;
    thirdPartySharing: boolean;
  };
  benchmarks: {
    accuracy?: number;
    hallucinationRate?: string;
    biasAssessment?: string;
  };
  governanceOordeel: {
    oordeel: RouteAIOordeel;
    rationale: string;
    reviewDate: string;
    reviewedBy: string;
  };
}

export interface BaseCapability {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'text_operations' | 'ideation' | 'analysis' | 'specialized';
  
  // EU AI Act compliance fields
  riskLevel: RiskLevel;
  requiredTrainingLevel: TrainingLevel;
  useCases: string[];
  restrictions: string;
  complianceStatus: string;
  allowedDomains: string[];
  locked: boolean;
  
  // EXPLICIET: Wat mag wel
  allowedWhen: {
    dataTypes: string[];
    automationLevel: string[];
    purposes: string[];
  };
  
  // EXPLICIET: Wat mag NIET
  prohibitedWhen: {
    dataTypes: string[];
    decisionTypes: string[];
    contexts: string[];
  };
  
  examples: {
    allowed: string[];
    notAllowed: string[];
  };
}

export interface AILicense {
  certificateNumber: string;
  userId: string;
  status: 'active' | 'expired' | 'not_started';
  
  // Training & Assessment
  assessmentScore: number;
  completedAt: string;
  trainingLevel: TrainingLevel;
  
  // KERN: Expliciete capabilities
  grantedCapabilities: string[];
  
  // Validity
  issuedAt: string;
  expiresAt: string;
  
  // Metadata
  issuedBy?: string;
  lastReviewedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'org_admin';
  organisationId: string;
  
  // License (kan null zijn als nog niet behaald)
  license: AILicense | null;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  createdAt: string;
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  category: string;
  logoUrl: string;
  description: string;
  
  // AI Label System
  lightLabel?: LightLabel;
  fullNutritionLabel?: FullNutritionLabel;
  
  // Use cases
  useCases: {
    title: string;
    description: string;
    riskLevel: 'minimal' | 'limited' | 'high';
    requiredCapability?: string;
  }[];
  
  importantNotes: string[];
  
  // Restrictions
  restricted?: boolean;
  requiredCapability?: string;
}

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  content: string;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  scenario: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  category: string;
}

export interface TrainingProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: string;
}

export interface UserProgress {
  userId: string;
  trainingProgress: TrainingProgress[];
  assessmentAttempts: number;
  lastAssessmentScore?: number;
  lastAssessmentAt?: string;
}
// RouteAI Type Definitions
// Core governance model: RBAC (who manages) + AI License (what they can do)

export interface BaseCapability {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'text_operations' | 'ideation' | 'analysis' | 'specialized';
  
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
  
  useCases: {
    title: string;
    description: string;
    riskLevel: 'minimal' | 'limited' | 'high';
    requiredCapability?: string;
  }[];
  
  importantNotes: string[];
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

import { BaseCapability } from '../types';

export const baseCapabilities: BaseCapability[] = [
  {
    id: 'text-redactie',
    slug: 'text-redactie',
    name: 'Tekst & Redactie',
    description: 'Basis tekstverwerking zonder gevoelige data',
    category: 'text_operations',
    
    // EU AI Act compliance
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen persoonlijke of gevoelige data',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['marketing', 'communicatie', 'documentatie'],
    locked: false,
    
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive'],
      automationLevel: ['human_in_loop', 'human_oversight'],
      purposes: ['efficiency', 'quality_improvement', 'accessibility']
    },
    
    prohibitedWhen: {
      dataTypes: ['personal_sensitive', 'biometric', 'special_category'],
      decisionTypes: ['consequential', 'legal_binding', 'medical'],
      contexts: ['recruitment', 'credit_scoring', 'law_enforcement']
    },
    
    examples: {
      allowed: [
        'Interne memo samenvatten',
        'Marketing tekst herschrijven',
        'Grammatica controleren',
        'Publiek document vertalen',
        'Structuur aanbrengen in notities'
      ],
      notAllowed: [
        'Medische brieven redigeren',
        'Juridische contracten opstellen',
        'CV\'s van sollicitanten herschrijven',
        'Persoonlijke klantdata verwerken'
      ]
    }
  },
  
  {
    id: 'brainstorm-ideeen',
    slug: 'brainstorm-ideeen',
    name: 'Brainstorming & Ideeën',
    description: 'Creatief proces met AI als inspiratiebron',
    category: 'ideation',
    
    // EU AI Act compliance
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Alleen als inspiratie, geen finale beslissingen',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['innovatie', 'product', 'marketing'],
    locked: false,
    
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive'],
      automationLevel: ['inspiration_only', 'human_in_loop'],
      purposes: ['ideation', 'creativity', 'problem_solving']
    },
    
    prohibitedWhen: {
      dataTypes: ['personal', 'confidential_business'],
      decisionTypes: ['final_decision', 'consequential'],
      contexts: ['strategic_decisions', 'personnel_decisions']
    },
    
    examples: {
      allowed: [
        'Brainstormen over campagne-ideeën',
        'Concepten ontwikkelen voor presentatie',
        'Alternatieve benaderingen verkennen',
        'Creatieve oplossingen genereren'
      ],
      notAllowed: [
        'Finale strategische beslissingen nemen',
        'Personeelsbesluiten voorbereiden',
        'Vertrouwelijke productontwikkeling',
        'AI-output direct gebruiken zonder review'
      ]
    }
  },
  
  {
    id: 'data-analyse',
    slug: 'data-analyse',
    name: 'Data-analyse',
    description: 'Analyse van geanonimiseerde/geaggregeerde data',
    category: 'analysis',
    
    // EU AI Act compliance
    riskLevel: 'high',
    requiredTrainingLevel: 'gevorderd',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Vereist gevorderde training + organisatie goedkeuring. Alleen geaggregeerde data.',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 6 EU AI Act (Hoog Risico). Aanvullende maatregelen gedocumenteerd.',
    allowedDomains: ['finance', 'operations', 'strategy'],
    locked: true,
    
    allowedWhen: {
      dataTypes: ['aggregated', 'anonymized', 'public'],
      automationLevel: ['advisory_only', 'human_in_loop'],
      purposes: ['insight_generation', 'trend_analysis', 'reporting']
    },
    
    prohibitedWhen: {
      dataTypes: ['personal', 'individual_level'],
      decisionTypes: ['automated_decision', 'profiling'],
      contexts: ['individual_assessment', 'scoring_people']
    },
    
    examples: {
      allowed: [
        'Trends identificeren in verkoopdata (geaggregeerd)',
        'Visualisaties maken van publieke statistieken',
        'Patronen herkennen in anonieme feedback',
        'Rapportages genereren uit samengevatte data'
      ],
      notAllowed: [
        'Individuele klanten scoren/profileren',
        'Persoonlijke data analyseren',
        'Geautomatiseerde beslissingen over personen',
        'Gevoelige bedrijfsdata zonder toestemming'
      ]
    }
  }
];

// Export ook als BASE_CAPABILITIES voor backwards compatibility
export const BASE_CAPABILITIES = baseCapabilities;

// Helper functies
export function getCapabilityById(id: string): BaseCapability | undefined {
  return baseCapabilities.find(cap => cap.id === id);
}

export function getDefaultCapabilities(): string[] {
  // Standaard krijgt iedereen met een rijbewijs deze 2 (data-analyse is locked)
  return ['text-redactie', 'brainstorm-ideeen'];
}

export function getUnlockedCapabilities(): BaseCapability[] {
  return baseCapabilities.filter(cap => !cap.locked);
}

export function getLockedCapabilities(): BaseCapability[] {
  return baseCapabilities.filter(cap => cap.locked);
}

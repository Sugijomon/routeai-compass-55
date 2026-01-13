import { BaseCapability } from '../types';

export const BASE_CAPABILITIES: BaseCapability[] = [
  {
    id: 'cap-text-ops',
    slug: 'text-operations',
    name: 'Tekst Operaties',
    description: 'Basis tekstverwerking zonder gevoelige data',
    category: 'text_operations',
    
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
    id: 'cap-ideation',
    slug: 'ideation',
    name: 'Ideation & Brainstormen',
    description: 'Creatief proces met AI als inspiratiebron',
    category: 'ideation',
    
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
    id: 'cap-basic-analysis',
    slug: 'basic-analysis',
    name: 'Basis Data-Analyse',
    description: 'Analyse van geanonimiseerde/geaggregeerde data',
    category: 'analysis',
    
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

// Helper functie
export function getCapabilityById(id: string): BaseCapability | undefined {
  return BASE_CAPABILITIES.find(cap => cap.id === id);
}

export function getDefaultCapabilities(): string[] {
  // Standaard krijgt iedereen met een rijbewijs deze 3
  return ['cap-text-ops', 'cap-ideation', 'cap-basic-analysis'];
}

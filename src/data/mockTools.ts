import { Tool } from '../types';

export const MOCK_TOOLS: Tool[] = [
  {
    id: 'tool-gpt4o',
    slug: 'gpt-4o',
    name: 'GPT-4o',
    vendor: 'OpenAI',
    category: 'Large Language Model',
    logoUrl: '/logos/chatgpt.svg',
    description: 'OpenAI\'s meest geavanceerde multimodale model. Combineert tekst, beeld en audio verwerking in één systeem.',
    
    lightLabel: {
      routeAIOordeel: 'verhoogde-aandacht',
      privacy: {
        score: 3,
        summary: 'Data verwerking in VS, opt-out mogelijk voor training'
      },
      training: {
        requiredLevel: 'gevorderd',
        summary: 'Vereist begrip van GPAI en systemisch risico'
      },
      betrouwbaarheid: {
        score: 4,
        summary: 'Hoge kwaliteit, maar hallucinaties mogelijk'
      },
      spelregels: [
        'Controleer altijd output op feitelijke juistheid',
        'Gebruik niet voor finale besluitvorming zonder menselijke review',
        'Deel geen gevoelige persoonsgegevens',
        'Documenteer AI-gebruik voor audit trail',
        'Meld onverwacht gedrag aan IT/Compliance'
      ]
    },
    
    fullNutritionLabel: {
      identiteit: {
        naam: 'GPT-4o',
        vendor: 'OpenAI',
        versie: 'gpt-4o-2024-05-13',
        releaseDate: '2024-05-13'
      },
      aiActClassificatie: {
        category: 'GPAI-SR',
        systemicRisk: true,
        transparencyObligations: [
          'Disclosure of AI-generated content',
          'Technical documentation required',
          'Model evaluation reports'
        ]
      },
      technischeDetails: {
        modelType: 'Multimodal Transformer',
        trainingDataCutoff: 'Oktober 2023',
        contextWindow: '128.000 tokens',
        capabilities: ['Tekst generatie', 'Code assistentie', 'Beeld analyse', 'Redeneren']
      },
      privacyCompliance: {
        dataProcessingLocation: 'Verenigde Staten',
        gdprCompliant: true,
        dataRetention: '30 dagen (API), 3 jaar (ChatGPT)',
        thirdPartySharing: false
      },
      benchmarks: {
        accuracy: 86.8,
        hallucinationRate: 'Medium',
        biasAssessment: 'Geaudit door OpenAI Red Team'
      },
      governanceOordeel: {
        oordeel: 'verhoogde-aandacht',
        rationale: 'GPAI met systemisch risico vereist extra voorzorgsmaatregelen. Krachtig model maar met verhoogd risico op misbruik.',
        reviewDate: '2024-12-01',
        reviewedBy: 'RouteAI Governance Board'
      }
    },
    
    useCases: [
      {
        title: 'Tekst herschrijven',
        description: 'Content verbeteren, tone aanpassen, grammatica controleren',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Complexe analyse',
        description: 'Documenten analyseren en samenvatten',
        riskLevel: 'limited',
        requiredCapability: 'cap-basic-analysis'
      },
      {
        title: 'Recruitment ondersteuning',
        description: 'CV screening en kandidaat matching',
        riskLevel: 'high'
      }
    ],
    
    importantNotes: [
      'Systemisch risico classificatie onder EU AI Act',
      'Hallucinaties mogelijk - altijd verifiëren',
      'Niet gebruiken voor finale HR-beslissingen'
    ]
  },
  
  {
    id: 'tool-claude',
    slug: 'claude-sonnet',
    name: 'Claude Sonnet',
    vendor: 'Anthropic',
    category: 'Large Language Model',
    logoUrl: '/logos/claude.svg',
    description: 'Anthropic\'s meest gebalanceerde model. Focus op veiligheid, nuance en lange context verwerking.',
    
    lightLabel: {
      routeAIOordeel: 'vertrouwd',
      privacy: {
        score: 4,
        summary: 'Sterke privacy controls, geen training op user data'
      },
      training: {
        requiredLevel: 'basis',
        summary: 'Geschikt na basis AI-training'
      },
      betrouwbaarheid: {
        score: 4,
        summary: 'Consistent en veilig, weigert schadelijke verzoeken'
      },
      spelregels: [
        'Geschikt voor dagelijks gebruik binnen capabilities',
        'Controleer output bij belangrijke documenten',
        'Ideaal voor eerste drafts en brainstorming',
        'Respecteer de context limiet van 200K tokens'
      ]
    },
    
    fullNutritionLabel: {
      identiteit: {
        naam: 'Claude 3.5 Sonnet',
        vendor: 'Anthropic',
        versie: 'claude-3-5-sonnet-20241022',
        releaseDate: '2024-10-22'
      },
      aiActClassificatie: {
        category: 'GPAI',
        systemicRisk: false,
        transparencyObligations: [
          'Disclosure of AI-generated content'
        ]
      },
      technischeDetails: {
        modelType: 'Constitutional AI Transformer',
        trainingDataCutoff: 'April 2024',
        contextWindow: '200.000 tokens',
        capabilities: ['Tekst generatie', 'Code', 'Analyse', 'Lange documenten']
      },
      privacyCompliance: {
        dataProcessingLocation: 'Verenigde Staten (GCP)',
        gdprCompliant: true,
        dataRetention: '30 dagen',
        thirdPartySharing: false
      },
      benchmarks: {
        accuracy: 88.7,
        hallucinationRate: 'Laag',
        biasAssessment: 'Constitutional AI framework'
      },
      governanceOordeel: {
        oordeel: 'vertrouwd',
        rationale: 'Sterke safety measures en transparant beleid. Aanbevolen voor algemeen zakelijk gebruik.',
        reviewDate: '2024-11-15',
        reviewedBy: 'RouteAI Governance Board'
      }
    },
    
    useCases: [
      {
        title: 'Document samenvatten',
        description: 'Lange rapporten of artikelen comprimeren',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Creatief schrijven',
        description: 'Verhalen, blogs, scripts ontwikkelen',
        riskLevel: 'minimal',
        requiredCapability: 'cap-ideation'
      },
      {
        title: 'Data-analyse ondersteuning',
        description: 'Patronen identificeren, inzichten genereren',
        riskLevel: 'limited',
        requiredCapability: 'cap-basic-analysis'
      }
    ],
    
    importantNotes: [
      'Sterke focus op veiligheid en ethics',
      'Kan context van ~200.000 tokens verwerken',
      'Weigert expliciet schadelijke verzoeken'
    ]
  },
  
  {
    id: 'tool-midjourney',
    slug: 'midjourney',
    name: 'Midjourney',
    vendor: 'Midjourney Inc.',
    category: 'Image Generation',
    logoUrl: '/logos/midjourney.svg',
    description: 'AI-beeldgeneratie voor creatieve projecten. Creëert hoogwaardige visuals uit tekstbeschrijvingen.',
    
    lightLabel: {
      routeAIOordeel: 'vertrouwd-met-instructies',
      privacy: {
        score: 3,
        summary: 'Prompts en beelden worden opgeslagen'
      },
      training: {
        requiredLevel: 'basis',
        summary: 'Basis training + specifieke richtlijnen voor beeldgebruik'
      },
      betrouwbaarheid: {
        score: 4,
        summary: 'Consistente kwaliteit, maar copyright onduidelijk'
      },
      spelregels: [
        'Genereer geen beelden van echte personen zonder toestemming',
        'Label AI-gegenereerde beelden duidelijk',
        'Gebruik niet voor misleidende content',
        'Check copyright bij commercieel gebruik',
        'Documenteer prompts voor reproduceerbaarheid'
      ]
    },
    
    fullNutritionLabel: {
      identiteit: {
        naam: 'Midjourney',
        vendor: 'Midjourney Inc.',
        versie: 'v6.1',
        releaseDate: '2024-07-30'
      },
      aiActClassificatie: {
        category: 'Limited-Risk',
        systemicRisk: false,
        transparencyObligations: [
          'Content moet als AI-gegenereerd worden gelabeld'
        ]
      },
      technischeDetails: {
        modelType: 'Diffusion Model',
        capabilities: ['Tekst-naar-beeld', 'Stijl transfer', 'Upscaling']
      },
      privacyCompliance: {
        dataProcessingLocation: 'Verenigde Staten',
        gdprCompliant: true,
        dataRetention: 'Onbeperkt (tenzij verwijderd)',
        thirdPartySharing: false
      },
      benchmarks: {
        biasAssessment: 'Bekend met representatie bias'
      },
      governanceOordeel: {
        oordeel: 'vertrouwd-met-instructies',
        rationale: 'Veilig voor creatief gebruik mits richtlijnen worden gevolgd. Let op deepfake risico\'s.',
        reviewDate: '2024-10-01',
        reviewedBy: 'RouteAI Governance Board'
      }
    },
    
    useCases: [
      {
        title: 'Marketing visuals',
        description: 'Conceptbeelden voor campagnes en social media',
        riskLevel: 'minimal',
        requiredCapability: 'cap-ideation'
      },
      {
        title: 'Product mockups',
        description: 'Visuele concepten voor productontwikkeling',
        riskLevel: 'minimal',
        requiredCapability: 'cap-ideation'
      },
      {
        title: 'Deepfakes / Personen genereren',
        description: 'Realistische beelden van personen',
        riskLevel: 'high'
      }
    ],
    
    importantNotes: [
      'AI-gegenereerde beelden moeten gelabeld worden (EU AI Act)',
      'Copyright van AI-art is juridisch onduidelijk',
      'Geen beelden van echte personen genereren'
    ]
  },
  
  {
    id: 'tool-excel-copilot',
    slug: 'excel-copilot',
    name: 'Excel Copilot',
    vendor: 'Microsoft',
    category: 'Data Analysis',
    logoUrl: '/logos/copilot.svg',
    description: 'AI-assistent voor data-analyse in Microsoft Excel. Automatiseert formules, analyses en visualisaties.',
    restricted: true,
    requiredCapability: 'cap-data-analyse',
    
    lightLabel: {
      routeAIOordeel: 'verhoogde-aandacht',
      privacy: {
        score: 4,
        summary: 'Microsoft 365 compliance, data blijft in tenant'
      },
      training: {
        requiredLevel: 'gevorderd',
        summary: 'Vereist data-analyse capability en gevorderde training'
      },
      betrouwbaarheid: {
        score: 3,
        summary: 'Formules kunnen fouten bevatten - altijd valideren'
      },
      spelregels: [
        '⚠️ RESTRICTED: Vereist Data-Analyse capability',
        'Valideer alle gegenereerde formules handmatig',
        'Niet gebruiken voor financiële rapportages zonder review',
        'Documenteer AI-gegenereerde analyses',
        'Bij twijfel: vraag IT/Data team voor verificatie'
      ]
    },
    
    fullNutritionLabel: {
      identiteit: {
        naam: 'Microsoft 365 Copilot - Excel',
        vendor: 'Microsoft',
        versie: '2024.11',
        releaseDate: '2024-11-01'
      },
      aiActClassificatie: {
        category: 'High-Risk',
        systemicRisk: false,
        annexCategory: 'Annex III - Besluitvorming (indien gebruikt voor HR/Finance)',
        transparencyObligations: [
          'Disclosure bij geautomatiseerde besluitvorming',
          'Logging van AI-acties vereist'
        ]
      },
      technischeDetails: {
        modelType: 'GPT-4 based (Microsoft hosted)',
        contextWindow: 'Spreadsheet context',
        capabilities: ['Formule generatie', 'Data analyse', 'Visualisatie', 'PivotTables']
      },
      privacyCompliance: {
        dataProcessingLocation: 'EU (met EU Data Boundary)',
        gdprCompliant: true,
        dataRetention: 'Volgens M365 retention policies',
        thirdPartySharing: false
      },
      benchmarks: {
        accuracy: 78,
        hallucinationRate: 'Medium-Hoog bij complexe formules',
        biasAssessment: 'N.v.t.'
      },
      governanceOordeel: {
        oordeel: 'verhoogde-aandacht',
        rationale: 'Krachtig maar risicovol bij financiële data. Alleen beschikbaar voor gebruikers met Data-Analyse capability.',
        reviewDate: '2024-11-20',
        reviewedBy: 'RouteAI Governance Board'
      }
    },
    
    useCases: [
      {
        title: 'Data visualisatie',
        description: 'Grafieken en charts genereren uit data',
        riskLevel: 'minimal',
        requiredCapability: 'cap-data-analyse'
      },
      {
        title: 'Formule assistentie',
        description: 'Complexe Excel formules laten genereren',
        riskLevel: 'limited',
        requiredCapability: 'cap-data-analyse'
      },
      {
        title: 'Financiële analyses',
        description: 'Budgetten, forecasts, rapportages',
        riskLevel: 'high',
        requiredCapability: 'cap-data-analyse'
      }
    ],
    
    importantNotes: [
      '🔒 RESTRICTED: Alleen met Data-Analyse capability',
      'Formules kunnen onjuist zijn - altijd valideren',
      'Niet gebruiken voor finale financiële beslissingen',
      'Vereist Microsoft 365 Copilot licentie'
    ]
  }
];

export function getToolBySlug(slug: string): Tool | undefined {
  return MOCK_TOOLS.find(t => t.slug === slug);
}

export function getToolById(id: string): Tool | undefined {
  return MOCK_TOOLS.find(t => t.id === id);
}
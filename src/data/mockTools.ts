import { Tool } from '../types';

export const MOCK_TOOLS: Tool[] = [
  {
    id: 'tool-1',
    slug: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    category: 'Chatbot',
    logoUrl: '/logos/chatgpt.svg',
    description: 'Geavanceerde conversational AI voor tekstgeneratie, analyse en probleemoplossing. Gebruikt GPT-4 en GPT-3.5 modellen.',
    
    useCases: [
      {
        title: 'Tekst herschrijven',
        description: 'Content verbeteren, tone aanpassen, grammatica controleren',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Brainstormen voor marketing',
        description: 'Ideeën genereren voor campagnes en content',
        riskLevel: 'minimal',
        requiredCapability: 'cap-ideation'
      },
      {
        title: 'Klantenservice chatbot',
        description: 'FAQ beantwoorden, eerste-lijn support',
        riskLevel: 'limited'
        // Geen requiredCapability = vereist RouteAI check
      },
      {
        title: 'Recruitment screening',
        description: 'CV\'s beoordelen, kandidaten scoren',
        riskLevel: 'high'
        // High-risk, altijd full review
      }
    ],
    
    importantNotes: [
      'Kan incorrect of verzonnen informatie geven (hallucinations)',
      'Geen garanties bij juridische of medische adviezen',
      'Data wordt verwerkt door OpenAI (mogelijk buiten EU)',
      'Training data tot april 2023'
    ]
  },
  
  {
    id: 'tool-2',
    slug: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    category: 'Chatbot',
    logoUrl: '/logos/claude.svg',
    description: 'AI-assistent met focus op veiligheid en nuance. Geschikt voor lange documenten en complexe analyses.',
    
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
      'Kan context van ~100.000 woorden verwerken',
      'Data processing door Anthropic (VS-gebaseerd)'
    ]
  },
  
  {
    id: 'tool-3',
    slug: 'midjourney',
    name: 'Midjourney',
    vendor: 'Midjourney',
    category: 'Image Generation',
    logoUrl: '/logos/midjourney.svg',
    description: 'AI-gedreven beeldgeneratie voor creatieve projecten, marketing en design.',
    
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
        description: 'Realistische beelden van niet-bestaande personen',
        riskLevel: 'high'
        // Altijd review - misleiding risico
      }
    ],
    
    importantNotes: [
      'Gegenereerde beelden kunnen misleidend zijn',
      'Copyright van AI-art is onduidelijk',
      'Kan bias bevatten uit training data'
    ]
  },
  
  {
    id: 'tool-4',
    slug: 'github-copilot',
    name: 'GitHub Copilot',
    vendor: 'GitHub/OpenAI',
    category: 'Code Assistant',
    logoUrl: '/logos/copilot.svg',
    description: 'AI-pair programmer die codesuggesties geeft tijdens het ontwikkelen.',
    
    useCases: [
      {
        title: 'Code completion',
        description: 'Automatische suggesties voor code snippets',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Documentatie genereren',
        description: 'Comments en README\'s schrijven',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Security-critical code',
        description: 'Authenticatie, encryptie, payment logic',
        riskLevel: 'high'
        // Vereist expert review
      }
    ],
    
    importantNotes: [
      'Kan getraind zijn op copyrighted code',
      'Genereert soms insecure code patterns',
      'Menselijke code review blijft essentieel'
    ]
  },
  
  {
    id: 'tool-5',
    slug: 'perplexity',
    name: 'Perplexity',
    vendor: 'Perplexity AI',
    category: 'Search & Research',
    logoUrl: '/logos/perplexity.svg',
    description: 'AI-gedreven zoekmachine met real-time web access en bronvermelding.',
    
    useCases: [
      {
        title: 'Research & fact-checking',
        description: 'Informatie verzamelen met bronnen',
        riskLevel: 'minimal',
        requiredCapability: 'cap-basic-analysis'
      },
      {
        title: 'Marktonderzoek',
        description: 'Trends en concurrentie analyseren',
        riskLevel: 'minimal',
        requiredCapability: 'cap-basic-analysis'
      },
      {
        title: 'Competitive intelligence',
        description: 'Gedetailleerde bedrijfsanalyses',
        riskLevel: 'limited'
        // Privacy/ethics overwegingen
      }
    ],
    
    importantNotes: [
      'Real-time web access (actueler dan ChatGPT)',
      'Bronvermelding maakt verificatie mogelijk',
      'Kan bias bevatten uit web-bronnen'
    ]
  },
  
  {
    id: 'tool-6',
    slug: 'gamma',
    name: 'Gamma',
    vendor: 'Gamma',
    category: 'Presentations',
    logoUrl: '/logos/gamma.svg',
    description: 'AI-powered presentatie tool die automatisch slides genereert uit tekst.',
    
    useCases: [
      {
        title: 'Interne presentaties',
        description: 'Snel slides maken voor team meetings',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-ops'
      },
      {
        title: 'Pitch decks',
        description: 'Investeerder of klant presentaties',
        riskLevel: 'limited'
        // Representatie van bedrijf
      },
      {
        title: 'Training materiaal',
        description: 'Educatieve content voor medewerkers',
        riskLevel: 'limited'
        // Accuracy belangrijk
      }
    ],
    
    importantNotes: [
      'AI-gegenereerde content vereist review',
      'Visuele keuzes kunnen suboptimaal zijn',
      'Geschikt voor eerste draft, niet finaal product'
    ]
  }
];

export function getToolBySlug(slug: string): Tool | undefined {
  return MOCK_TOOLS.find(t => t.slug === slug);
}

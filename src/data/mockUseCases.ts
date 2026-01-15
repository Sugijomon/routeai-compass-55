// Mock data voor AI use-cases/toepassingen

export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'text' | 'brainstorm' | 'data' | 'creative';
  riskLevel: 'low' | 'medium' | 'high';
  approvedByOrg: boolean;
  requiredCapabilities: string[]; // Welke capabilities nodig zijn
  allowedUses: string[];
  prohibitedUses: string[];
  toolsUsed?: string[]; // Optioneel: welke tools dit enablen
}

export const mockUseCases: UseCase[] = [
  {
    id: 'tekst-herschrijven',
    title: 'Tekst herschrijven',
    description: 'Verbeter toon, structuur en duidelijkheid',
    icon: '✏️',
    category: 'text',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Herschrijven van interne communicatie',
      'Verbeteren van e-mails en memo\'s',
      'Aanpassen van tone of voice'
    ],
    prohibitedUses: [
      'Herschrijven van contracten zonder legal review',
      'Aanpassen van officiële documenten',
      'Verwerken van persoonlijke gegevens'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'samenvatten',
    title: 'Samenvatten',
    description: 'Maak korte samenvattingen van documenten',
    icon: '📄',
    category: 'text',
    riskLevel: 'medium',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Samenvattingen van interne documenten',
      'Kortingen van rapportages voor vergaderingen',
      'Scheiding van belangrijke punten uit lange teksten'
    ],
    prohibitedUses: [
      'Samenvatten van medische patiëntendossiers',
      'Automatische juridische besluiten',
      'Verwerking van gevoelige HR-gegevens'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'ideeen-genereren',
    title: 'Ideeën genereren',
    description: 'Brainstorm voor content of plannen',
    icon: '💡',
    category: 'brainstorm',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['brainstorm-ideeen'],
    allowedUses: [
      'Brainstormen voor marketingcampagnes',
      'Genereren van content ideeën',
      'Conceptontwikkeling voor projecten'
    ],
    prohibitedUses: [
      'Genereren van misleidende marketing claims',
      'Creëren van content die auteursrecht schendt',
      'Ideeën voor discriminerende campagnes'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'informatie-structureren',
    title: 'Informatie structureren',
    description: 'Orden notities of ruwe input',
    icon: '📊',
    category: 'data',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Structureren van meeting notes',
      'Organiseren van brainstorm resultaten',
      'Categoriseren van feedback'
    ],
    prohibitedUses: [
      'Verwerken van persoonlijke klantgegevens',
      'Structureren van vertrouwelijke HR-info',
      'Organiseren van medische data'
    ],
    toolsUsed: ['gpt-4o']
  },
  {
    id: 'doelstellingen-formuleren',
    title: 'Doelstellingen formuleren',
    description: 'Stel heldere doelen en KPI\'s',
    icon: '🎯',
    category: 'text',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Formuleren van SMART doelen',
      'Opstellen van KPI frameworks',
      'Definiëren van project mijlpalen'
    ],
    prohibitedUses: [
      'Automatisch vaststellen van performance targets zonder HR',
      'Genereren van contractuele verplichtingen',
      'Opstellen van juridisch bindende doelen'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'analyse-rapportages',
    title: 'Analyse rapportages',
    description: 'Genereer inzichten uit data',
    icon: '📊',
    category: 'data',
    riskLevel: 'medium',
    approvedByOrg: true,
    requiredCapabilities: ['data-analyse'],
    allowedUses: [
      'Analyseren van sales data',
      'Genereren van trends uit cijfers',
      'Visualiseren van bedrijfsdata'
    ],
    prohibitedUses: [
      'Analyseren van persoonlijke medische data',
      'Verwerken van BSN-nummers of financiële privégegevens',
      'Automatische besluitvorming over klanten'
    ],
    toolsUsed: ['excel-copilot', 'tableau']
  },
  {
    id: 'content-schrijven',
    title: 'Content schrijven',
    description: 'Maak professionele teksten',
    icon: '📝',
    category: 'text',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Schrijven van blog posts',
      'Creëren van social media content',
      'Opstellen van nieuwsbrieven'
    ],
    prohibitedUses: [
      'Plagiëren van externe content',
      'Genereren van misleidende informatie',
      'Schrijven van medische adviezen'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'vertalen',
    title: 'Vertalen',
    description: 'Vertaal tussen talen',
    icon: '🌐',
    category: 'text',
    riskLevel: 'medium',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Vertalen van interne documenten',
      'Lokaliseren van marketing materiaal',
      'Vertalen van customer support berichten'
    ],
    prohibitedUses: [
      'Vertalen van contracten zonder legal review',
      'Automatisch vertalen van medische diagnoses',
      'Vertalen van officiële overheidsdocumenten'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'copywriting',
    title: 'Copywriting',
    description: 'Optimaliseer marketingteksten',
    icon: '🎨',
    category: 'creative',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Schrijven van advertentieteksten',
      'Optimaliseren van website copy',
      'Creëren van slogans'
    ],
    prohibitedUses: [
      'Misleidende claims maken',
      'Genereren van discriminerende content',
      'Schenden van merkenrecht'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'gegevens-overzicht',
    title: 'Gegevens overzicht',
    description: 'Structureer complexe informatie',
    icon: '📊',
    category: 'data',
    riskLevel: 'medium',
    approvedByOrg: true,
    requiredCapabilities: ['data-analyse'],
    allowedUses: [
      'Overzichten maken van datasets',
      'Samenvatten van spreadsheets',
      'Visualiseren van data patronen'
    ],
    prohibitedUses: [
      'Verwerken van persoonsgegevens zonder toestemming',
      'Analyseren van medische patiëntdata',
      'Automatische besluitvorming op basis van data'
    ],
    toolsUsed: ['excel-copilot', 'tableau']
  },
  {
    id: 'oplossingen-vinden',
    title: 'Oplossingen vinden',
    description: 'Zoek creatieve antwoorden',
    icon: '💡',
    category: 'brainstorm',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['brainstorm-ideeen'],
    allowedUses: [
      'Brainstormen over problemen',
      'Genereren van alternatieve oplossingen',
      'Creatief denken over challenges'
    ],
    prohibitedUses: [
      'Medische diagnoses stellen',
      'Juridische adviezen geven',
      'Financiële investeringsadviezen'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'document-genereren',
    title: 'Document genereren',
    description: 'Maak rapporten en documenten',
    icon: '📋',
    category: 'text',
    riskLevel: 'medium',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Genereren van project rapporten',
      'Opstellen van presentaties',
      'Creëren van documentatie'
    ],
    prohibitedUses: [
      'Automatisch genereren van contracten',
      'Opstellen van medische verslagen',
      'Creëren van officiële certificaten'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'strategie-ontwikkelen',
    title: 'Strategie ontwikkelen',
    description: 'Bouw uitvoerbare plannen',
    icon: '🎯',
    category: 'brainstorm',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['brainstorm-ideeen'],
    allowedUses: [
      'Ontwikkelen van marketing strategieën',
      'Plannen van project roadmaps',
      'Creëren van business plannen'
    ],
    prohibitedUses: [
      'Automatische investeringsstrategieën',
      'Strategieën die wet- of regelgeving omzeilen',
      'Plannen met discriminerende elementen'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'overzicht-genereren',
    title: 'Overzicht genereren',
    description: 'Maak samenvattende views',
    icon: '📊',
    category: 'data',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['data-analyse'],
    allowedUses: [
      'Dashboard overzichten maken',
      'Samenvatten van data trends',
      'Visualiseren van KPIs'
    ],
    prohibitedUses: [
      'Overzichten van persoonlijke medische data',
      'Automatische rapportage over werknemers',
      'Visualisaties met privacygevoelige info'
    ],
    toolsUsed: ['tableau', 'excel-copilot']
  },
  {
    id: 'tekst-aanpassen',
    title: 'Tekst aanpassen',
    description: 'Aanpas en verbeter bestaande teksten',
    icon: '📝',
    category: 'text',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Aanpassen van drafts',
      'Corrigeren van spelling en grammatica',
      'Verbeteren van leesbaarheid'
    ],
    prohibitedUses: [
      'Aanpassen van officiële documenten zonder review',
      'Wijzigen van juridische teksten',
      'Aanpassen van medische informatie'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  },
  {
    id: 'stijl-aanpassen',
    title: 'Stijl aanpassen',
    description: 'Pas toon en stijl aan',
    icon: '🎨',
    category: 'creative',
    riskLevel: 'low',
    approvedByOrg: true,
    requiredCapabilities: ['text-redactie'],
    allowedUses: [
      'Aanpassen van tone of voice',
      'Formaliseren of informaliseren van teksten',
      'Afstemmen op doelgroep'
    ],
    prohibitedUses: [
      'Aanpassen van juridische documenten',
      'Wijzigen van medische terminologie',
      'Manipuleren van citaten'
    ],
    toolsUsed: ['gpt-4o', 'claude-sonnet']
  }
];

// Helper functie: Filter use-cases op basis van user capabilities
export function filterUseCasesByCapabilities(
  useCases: UseCase[],
  userCapabilities: string[]
): UseCase[] {
  return useCases.filter(useCase => {
    // Check of gebruiker minstens 1 van de required capabilities heeft
    return useCase.requiredCapabilities.some(reqCap => 
      userCapabilities.includes(reqCap)
    );
  });
}

// Helper functie: Groepeer use-cases per category
export function groupUseCasesByCategory(useCases: UseCase[]) {
  return useCases.reduce((acc, useCase) => {
    if (!acc[useCase.category]) {
      acc[useCase.category] = [];
    }
    acc[useCase.category].push(useCase);
    return acc;
  }, {} as Record<string, UseCase[]>);
}

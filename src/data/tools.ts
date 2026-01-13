import { Tool } from '@/types';

export const tools: Tool[] = [
  {
    id: 'tool-chatgpt',
    slug: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    category: 'Algemene AI Assistent',
    logoUrl: '/placeholder.svg',
    description: 'Veelzijdige AI-assistent voor tekst, analyse en creatieve taken. Geschikt voor brainstormen, schrijven en informatie zoeken.',
    useCases: [
      {
        title: 'E-mail concepten opstellen',
        description: 'Eerste versies van interne e-mails en communicatie schrijven.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-draft-creation',
      },
      {
        title: 'Brainstormen over projectideeën',
        description: 'Creatieve sessies voor nieuwe concepten en oplossingen.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-ideation',
      },
      {
        title: 'Documenten samenvatten',
        description: 'Lange rapporten condenseren naar kernpunten.',
        riskLevel: 'limited',
        requiredCapability: 'cap-text-summary',
      },
      {
        title: 'Klantcommunicatie analyseren',
        description: 'Feedback en reviews analyseren voor patronen.',
        riskLevel: 'high',
        requiredCapability: 'cap-data-analysis',
      },
    ],
    importantNotes: [
      'Deel nooit persoonsgegevens of gevoelige bedrijfsinformatie',
      'Controleer gegenereerde feiten altijd via betrouwbare bronnen',
      'Gebruik de "history off" optie voor gevoelige gesprekken',
    ],
  },
  {
    id: 'tool-copilot',
    slug: 'copilot',
    name: 'Microsoft Copilot',
    vendor: 'Microsoft',
    category: 'Office Integratie',
    logoUrl: '/placeholder.svg',
    description: 'AI-assistent geïntegreerd in Microsoft 365. Helpt bij het werken met Word, Excel, PowerPoint en Outlook.',
    useCases: [
      {
        title: 'PowerPoint presentaties genereren',
        description: 'Automatisch slides maken op basis van documenten of prompts.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-draft-creation',
      },
      {
        title: 'Excel data analyseren',
        description: 'Formules genereren en data visualiseren.',
        riskLevel: 'limited',
        requiredCapability: 'cap-data-analysis',
      },
      {
        title: 'E-mails in Outlook opstellen',
        description: 'Professionele e-mails schrijven en beantwoorden.',
        riskLevel: 'limited',
        requiredCapability: 'cap-draft-creation',
      },
      {
        title: 'Vergaderingen samenvatten in Teams',
        description: 'Automatische notulen en actiepunten genereren.',
        riskLevel: 'high',
        requiredCapability: 'cap-text-summary',
      },
    ],
    importantNotes: [
      'Data blijft binnen Microsoft 365 tenant (afhankelijk van licentie)',
      'Controleer instellingen voor data retention en privacy',
      'Sommige features vereisen specifieke licenties',
    ],
  },
  {
    id: 'tool-claude',
    slug: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    category: 'Algemene AI Assistent',
    logoUrl: '/placeholder.svg',
    description: 'AI-assistent met focus op veiligheid en nuance. Sterk in lange teksten, analyse en genuanceerde discussies.',
    useCases: [
      {
        title: 'Complexe documenten analyseren',
        description: 'Lange beleidsdocumenten of rapporten doorwerken.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-summary',
      },
      {
        title: 'Teksten herschrijven',
        description: 'Communicatie aanpassen voor verschillende doelgroepen.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-text-rewrite',
      },
      {
        title: 'Onderzoek ondersteuning',
        description: 'Informatie synthetiseren uit meerdere bronnen.',
        riskLevel: 'limited',
        requiredCapability: 'cap-research',
      },
      {
        title: 'Ethische vraagstukken verkennen',
        description: 'Verschillende perspectieven op dilemma\'s onderzoeken.',
        riskLevel: 'limited',
        requiredCapability: 'cap-ideation',
      },
    ],
    importantNotes: [
      'Geschikt voor langere context en genuanceerde discussies',
      'Controleer altijd bronvermeldingen en claims',
      'Gebruik voor conceptwerk, niet voor definitieve beslissingen',
    ],
  },
  {
    id: 'tool-gemini',
    slug: 'gemini',
    name: 'Google Gemini',
    vendor: 'Google',
    category: 'Algemene AI Assistent',
    logoUrl: '/placeholder.svg',
    description: 'Google\'s AI-assistent met sterke integratie in Google Workspace. Multimodaal: kan tekst, afbeeldingen en code verwerken.',
    useCases: [
      {
        title: 'Google Docs ondersteuning',
        description: 'Teksten schrijven en bewerken in Google documenten.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-draft-creation',
      },
      {
        title: 'Afbeeldingen analyseren',
        description: 'Informatie extraheren uit visuele content.',
        riskLevel: 'limited',
        requiredCapability: 'cap-data-analysis',
      },
      {
        title: 'Gmail ondersteuning',
        description: 'E-mails opstellen en beantwoorden.',
        riskLevel: 'limited',
        requiredCapability: 'cap-draft-creation',
      },
      {
        title: 'Code schrijven en debuggen',
        description: 'Programmeerhulp in Google Colab en andere tools.',
        riskLevel: 'high',
        requiredCapability: 'cap-code-assistance',
      },
    ],
    importantNotes: [
      'Integratie met Google Workspace vereist enterprise licentie',
      'Let op data sharing instellingen in Google Admin',
      'Multimodale features kunnen onverwachte data verwerken',
    ],
  },
  {
    id: 'tool-github-copilot',
    slug: 'github-copilot',
    name: 'GitHub Copilot',
    vendor: 'GitHub (Microsoft)',
    category: 'Code Assistent',
    logoUrl: '/placeholder.svg',
    description: 'AI-gestuurde code completion en suggesties. Geïntegreerd in populaire code editors.',
    useCases: [
      {
        title: 'Code completion',
        description: 'Automatisch code aanvullen tijdens het typen.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-code-assistance',
      },
      {
        title: 'Unit tests genereren',
        description: 'Automatisch testcases schrijven voor bestaande code.',
        riskLevel: 'limited',
        requiredCapability: 'cap-code-assistance',
      },
      {
        title: 'Code documentatie',
        description: 'Comments en documentatie automatisch genereren.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-code-assistance',
      },
      {
        title: 'Refactoring suggesties',
        description: 'Verbeteringen voorstellen voor bestaande code.',
        riskLevel: 'limited',
        requiredCapability: 'cap-code-assistance',
      },
    ],
    importantNotes: [
      'NOOIT secrets, API keys of wachtwoorden in code comments zetten',
      'Code review blijft verplicht voor alle gegenereerde code',
      'Business licentie beschermt intellectueel eigendom beter',
    ],
  },
  {
    id: 'tool-deepl',
    slug: 'deepl',
    name: 'DeepL',
    vendor: 'DeepL SE',
    category: 'Vertaling',
    logoUrl: '/placeholder.svg',
    description: 'Gespecialiseerde AI voor hoogwaardige vertalingen. Europees bedrijf met focus op privacy.',
    useCases: [
      {
        title: 'Website content vertalen',
        description: 'Marketingteksten en productbeschrijvingen vertalen.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-translation',
      },
      {
        title: 'Interne communicatie vertalen',
        description: 'Memo\'s en updates voor internationale teams.',
        riskLevel: 'minimal',
        requiredCapability: 'cap-translation',
      },
      {
        title: 'Documentatie lokaliseren',
        description: 'Handleidingen en procedures vertalen.',
        riskLevel: 'limited',
        requiredCapability: 'cap-translation',
      },
      {
        title: 'Zakelijke correspondentie',
        description: 'E-mails en brieven naar andere talen omzetten.',
        riskLevel: 'limited',
        requiredCapability: 'cap-translation',
      },
    ],
    importantNotes: [
      'Pro versie bewaart geen ingevoerde teksten',
      'Niet gebruiken voor juridisch bindende vertalingen',
      'Europese servers (GDPR compliant)',
    ],
  },
];

export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id);
};

export const getToolBySlug = (slug: string): Tool | undefined => {
  return tools.find(tool => tool.slug === slug);
};

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
    technicalSpecs: {
      category: 'GPAI',
      capabilities: ['Tekst generatie', 'Analyse', 'Code', 'Brainstorm']
    },
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
    technicalSpecs: {
      category: 'GPAI',
      capabilities: ['Office integratie', 'Document generatie', 'Data analyse']
    },
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
    technicalSpecs: {
      category: 'GPAI',
      capabilities: ['Tekst analyse', 'Lange context', 'Veilig ontwerp']
    },
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
    technicalSpecs: {
      category: 'GPAI',
      capabilities: ['Multimodaal', 'Google Workspace', 'Code']
    },
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
    technicalSpecs: {
      category: 'Specialized',
      capabilities: ['Code completion', 'Test generatie', 'Documentatie']
    },
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
    technicalSpecs: {
      category: 'Limited-Risk',
      capabilities: ['Vertaling', 'Lokalisatie']
    },
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

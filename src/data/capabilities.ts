import { BaseCapability } from '@/types';

export const baseCapabilities: BaseCapability[] = [
  {
    id: 'cap-text-summary',
    slug: 'text-summary',
    name: 'Tekst Samenvatten',
    description: 'Het gebruik van AI om lange documenten of teksten te condenseren naar kernpunten.',
    category: 'text_operations',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen persoonlijke of gevoelige data',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['documentatie', 'communicatie', 'onderzoek'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive'],
      automationLevel: ['human_in_loop', 'human_oversight'],
      purposes: ['efficiency', 'comprehension', 'documentation'],
    },
    prohibitedWhen: {
      dataTypes: ['personal_sensitive', 'medical', 'legal_privileged'],
      decisionTypes: ['consequential', 'legal_binding'],
      contexts: ['legal_proceedings', 'medical_records'],
    },
    examples: {
      allowed: [
        'Samenvatten van openbare onderzoeksrapporten',
        'Condenseren van interne vergadernotulen (niet-gevoelig)',
        'Kernpunten extraheren uit productdocumentatie',
      ],
      notAllowed: [
        'Samenvatten van medische dossiers',
        'Condenseren van juridische contracten voor besluitvorming',
        'Verwerken van HR-beoordelingsgesprekken',
      ],
    },
  },
  {
    id: 'cap-text-rewrite',
    slug: 'text-rewrite',
    name: 'Tekst Herschrijven',
    description: 'AI inzetten om bestaande tekst te verbeteren, parafraseren of aan te passen in toon/stijl.',
    category: 'text_operations',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen persoonlijke of gevoelige data',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['marketing', 'communicatie', 'content'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive', 'marketing'],
      automationLevel: ['human_in_loop'],
      purposes: ['communication', 'clarity', 'localization'],
    },
    prohibitedWhen: {
      dataTypes: ['personal_sensitive', 'financial_individual'],
      decisionTypes: ['automated_communication', 'legal_binding'],
      contexts: ['customer_complaints', 'formal_legal_response'],
    },
    examples: {
      allowed: [
        'Marketingteksten aanpassen voor verschillende doelgroepen',
        'Interne communicatie verduidelijken',
        'Productbeschrijvingen optimaliseren',
      ],
      notAllowed: [
        'Automatisch herschrijven van klachtenreacties',
        'Aanpassen van juridische correspondentie',
        'Bewerken van formele HR-communicatie',
      ],
    },
  },
  {
    id: 'cap-ideation',
    slug: 'ideation',
    name: 'Brainstormen & Ideevorming',
    description: 'AI gebruiken als denkpartner voor het genereren van ideeën, concepten en creatieve oplossingen.',
    category: 'ideation',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Alleen als inspiratie, geen finale beslissingen',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['innovatie', 'product', 'marketing'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive', 'conceptual'],
      automationLevel: ['human_in_loop', 'human_oversight'],
      purposes: ['innovation', 'problem_solving', 'creativity'],
    },
    prohibitedWhen: {
      dataTypes: ['competitor_sensitive', 'trade_secrets'],
      decisionTypes: ['strategic_final', 'budget_allocation'],
      contexts: ['competitive_bidding', 'merger_acquisition'],
    },
    examples: {
      allowed: [
        'Brainstormen over nieuwe productfeatures',
        'Ideeën genereren voor marketingcampagnes',
        'Oplossingsrichtingen verkennen voor procesvraagstukken',
      ],
      notAllowed: [
        'Strategische beslissingen automatiseren',
        'Concurrentiegevoelige innovatie-ideeën delen',
        'Budgetallocatie laten bepalen door AI',
      ],
    },
  },
  {
    id: 'cap-draft-creation',
    slug: 'draft-creation',
    name: 'Concepten Opstellen',
    description: 'AI inzetten voor het maken van eerste versies van documenten, e-mails of rapporten.',
    category: 'text_operations',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen definitieve documenten zonder review',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['documentatie', 'communicatie', 'projecten'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'internal_non_sensitive'],
      automationLevel: ['human_in_loop'],
      purposes: ['efficiency', 'draft_creation', 'template_generation'],
    },
    prohibitedWhen: {
      dataTypes: ['personal_identifiable', 'financial_sensitive'],
      decisionTypes: ['direct_customer_facing', 'legally_binding'],
      contexts: ['contract_creation', 'formal_complaints', 'hr_decisions'],
    },
    examples: {
      allowed: [
        'Eerste opzet van interne memo\'s',
        'Conceptversie van blogposts of artikelen',
        'Draft van projectvoorstellen',
      ],
      notAllowed: [
        'Definitieve contracten opstellen',
        'Officiële klachtenreacties genereren',
        'HR-beoordelingen schrijven',
      ],
    },
  },
  {
    id: 'cap-data-analysis',
    slug: 'data-analysis',
    name: 'Data Analyse Ondersteuning',
    description: 'AI gebruiken om patronen te herkennen en inzichten te genereren uit niet-gevoelige datasets.',
    category: 'analysis',
    riskLevel: 'high',
    requiredTrainingLevel: 'gevorderd',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Vereist gevorderde training + organisatie goedkeuring. Alleen geaggregeerde data.',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 6 EU AI Act (Hoog Risico). Aanvullende maatregelen gedocumenteerd.',
    allowedDomains: ['finance', 'operations', 'strategy'],
    locked: true,
    allowedWhen: {
      dataTypes: ['public', 'aggregated_anonymous', 'internal_non_sensitive'],
      automationLevel: ['human_oversight', 'human_decision'],
      purposes: ['insight_generation', 'trend_analysis', 'reporting'],
    },
    prohibitedWhen: {
      dataTypes: ['personal_identifiable', 'biometric', 'health_data'],
      decisionTypes: ['automated_profiling', 'credit_scoring', 'hiring'],
      contexts: ['individual_assessment', 'performance_ranking'],
    },
    examples: {
      allowed: [
        'Analyseren van geaggregeerde verkooptrends',
        'Patronen herkennen in geanonimiseerde enquêtedata',
        'Marktonderzoek samenvatten',
      ],
      notAllowed: [
        'Individuele klantprofielen analyseren voor beslissingen',
        'Medewerkersprestaties ranken op basis van data',
        'Kredietwaardigheid beoordelen',
      ],
    },
  },
  {
    id: 'cap-translation',
    slug: 'translation',
    name: 'Vertaling & Lokalisatie',
    description: 'AI inzetten voor het vertalen van teksten naar andere talen.',
    category: 'text_operations',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen juridische of medische vertalingen',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['marketing', 'communicatie', 'product'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'marketing', 'internal_non_sensitive'],
      automationLevel: ['human_in_loop', 'human_review'],
      purposes: ['localization', 'communication', 'accessibility'],
    },
    prohibitedWhen: {
      dataTypes: ['legal_contracts', 'certified_documents', 'medical_records'],
      decisionTypes: ['legally_binding', 'certified_translation'],
      contexts: ['legal_proceedings', 'official_documentation', 'medical_communication'],
    },
    examples: {
      allowed: [
        'Website content vertalen voor internationale markt',
        'Interne communicatie in meerdere talen maken',
        'Productdocumentatie lokaliseren',
      ],
      notAllowed: [
        'Juridische contracten vertalen voor ondertekening',
        'Medische documenten vertalen',
        'Officiële certificaten vertalen',
      ],
    },
  },
  {
    id: 'cap-code-assistance',
    slug: 'code-assistance',
    name: 'Code Ondersteuning',
    description: 'AI gebruiken voor het schrijven, reviewen of debuggen van code.',
    category: 'specialized',
    riskLevel: 'limited',
    requiredTrainingLevel: 'gevorderd',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Geen productie secrets of klantdata in prompts',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 6 EU AI Act (Beperkt Risico). Aanvullende maatregelen gedocumenteerd.',
    allowedDomains: ['development', 'engineering', 'IT'],
    locked: true,
    allowedWhen: {
      dataTypes: ['non_production', 'development', 'test_data'],
      automationLevel: ['human_in_loop', 'code_review_required'],
      purposes: ['development', 'learning', 'documentation'],
    },
    prohibitedWhen: {
      dataTypes: ['production_secrets', 'api_keys', 'customer_data'],
      decisionTypes: ['direct_deployment', 'security_critical'],
      contexts: ['production_without_review', 'security_implementations'],
    },
    examples: {
      allowed: [
        'Hulp bij het schrijven van utility functies',
        'Code reviews en verbetervoorstellen',
        'Documentatie genereren voor code',
      ],
      notAllowed: [
        'Productie API keys delen met AI',
        'Beveiligingscode zonder review deployen',
        'Klantdata gebruiken in prompts',
      ],
    },
  },
  {
    id: 'cap-research',
    slug: 'research',
    name: 'Onderzoek & Informatie Verzamelen',
    description: 'AI inzetten voor het verzamelen en synthetiseren van informatie uit publieke bronnen.',
    category: 'analysis',
    riskLevel: 'minimal',
    requiredTrainingLevel: 'basis',
    // useCases removed: capabilities define training scope, not allowed applications
    restrictions: 'Alleen publieke bronnen, geen finale beslissingen',
    complianceStatus: 'Audit-Ready: Voldoet aan Art. 4 EU AI Act. Alle bewijslast ligt klaar voor compliance verificatie.',
    allowedDomains: ['onderzoek', 'marketing', 'strategie'],
    locked: false,
    allowedWhen: {
      dataTypes: ['public', 'published_research', 'open_data'],
      automationLevel: ['human_in_loop', 'human_verification'],
      purposes: ['research', 'due_diligence', 'market_analysis'],
    },
    prohibitedWhen: {
      dataTypes: ['proprietary_research', 'confidential_competitor'],
      decisionTypes: ['investment_decisions', 'final_recommendations'],
      contexts: ['legal_due_diligence', 'regulatory_compliance'],
    },
    examples: {
      allowed: [
        'Marktonderzoek op basis van publieke bronnen',
        'Samenvatten van industrie-rapporten',
        'Competitieve analyse van publieke informatie',
      ],
      notAllowed: [
        'Juridische due diligence zonder expert review',
        'Investeringsbeslissingen baseren op AI-analyse alleen',
        'Regulatoire compliance bepalen met AI',
      ],
    },
  },
];

export const getCapabilityById = (id: string): BaseCapability | undefined => {
  return baseCapabilities.find(cap => cap.id === id);
};

export const getCapabilitiesByCategory = (category: BaseCapability['category']): BaseCapability[] => {
  return baseCapabilities.filter(cap => cap.category === category);
};

export const categoryLabels: Record<BaseCapability['category'], string> = {
  text_operations: 'Tekstbewerkingen',
  ideation: 'Ideevorming',
  analysis: 'Analyse',
  specialized: 'Gespecialiseerd',
};

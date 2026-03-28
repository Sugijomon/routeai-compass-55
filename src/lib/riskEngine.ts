// RouteAI Risk Engine — Deterministische V1–V6 routing
// Beslislogica v2.1 — alleen omhoog escaleren, nooit omlaag
//
// Exports:
//   shouldShowV6(answers)  — bepaalt of V6 wordt getoond
//   determineRoute(answers) — bepaalt route + archetype
//   buildEngineOutput(answers, toolNameRaw) — volledige EngineOutput
//   DECISION_VERSION

import type {
  SurveyAnswers,
  AssessmentRoute,
  ArchetypeCode,
  RoutingMethod,
  EngineOutput,
  AssessmentRequirements,
} from '@/types/assessment';

// ─── Keyword-mapping voor V2 vrije tekst ───
const KEYWORD_MAP: Array<{ keywords: string[]; archetype: ArchetypeCode }> = [
  { keywords: ['cv', 'sollicitant', 'recruitment', 'werving', 'selectie', 'cv screening'], archetype: 'O-01' },
  { keywords: ['student', 'beoordelen', 'tentamen', 'examen', 'cijfer', 'evaluatie leerling'], archetype: 'O-01' },
  { keywords: ['krediet', 'lening', 'credit scoring', 'kredietwaardig', 'financieel risico'], archetype: 'O-02' },
  { keywords: ['agent', 'workflow', 'automatisch mailen', 'zelfstandig', 'autonoom versturen'], archetype: 'O-03' },
  { keywords: ['e-mail schrijven', 'email schrijven', 'mail opstellen', 'brief schrijven'], archetype: 'G-01' },
  { keywords: ['samenvatten', 'samenvatting', 'summarize', 'korter maken'], archetype: 'G-02' },
  { keywords: ['brainstorm', 'ideeën genereren', 'creatief', 'slogans', 'namen bedenken'], archetype: 'G-03' },
  { keywords: ['kennisbank', 'interne documenten', 'rag', 'qa over', 'zoeken in'], archetype: 'G-04' },
  { keywords: ['vertalen', 'vertaling', 'translate', 'vertaaltool'], archetype: 'Y-02' },
  { keywords: ['data analyseren', 'statistieken', 'dashboard', 'grafiek maken', 'trends'], archetype: 'Y-03' },
  { keywords: ['social scoring', 'gedragsscore', 'burgerscore', 'manipulatie', 'gezichtsherkenning'], archetype: 'R-01' },
];

export function tryKeywordMatch(freetext: string): ArchetypeCode | null {
  const lower = freetext.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.archetype;
  }
  return null;
}

export function needsClaudeAssist(answers: Partial<SurveyAnswers>): boolean {
  if (answers.V2_main === 'supportive' && answers.V2_sub === 'other') return true;
  if (answers.V2_main === 'informative' && answers.V2_sub === 'other') return true;
  return false;
}

export const DECISION_VERSION = 'beslislogica-v2.1';

// ─── Route-niveau volgorde (voor escalatie-vergelijking) ───
const ROUTE_LEVEL: Record<AssessmentRoute, number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
};

function maxRoute(a: AssessmentRoute, b: AssessmentRoute): AssessmentRoute {
  return ROUTE_LEVEL[a] >= ROUTE_LEVEL[b] ? a : b;
}

// ─── V6 trigger ───
export function shouldShowV6(answers: Partial<SurveyAnswers>): boolean {
  const v2 = answers.V2_main;
  const v3 = answers.V3;
  const v4 = answers.V4;
  const v5 = answers.V5;

  // Combinatie 1: evaluative + vulnerable + automated
  if (v2 === 'evaluative' && v3 === 'vulnerable' && v5 === 'automated') return true;
  // Combinatie 2: autonomous + vulnerable + special_categories
  if (v2 === 'autonomous' && v3 === 'vulnerable' && v4 === 'sensitive') return true;
  // Combinatie 3: evaluative + special_categories + automated
  if (v2 === 'evaluative' && v4 === 'sensitive' && v5 === 'automated') return true;
  // Combinatie 4: decision_prep + vulnerable + special_categories
  if (v2 === 'decision_prep' && v3 === 'vulnerable' && v4 === 'sensitive') return true;

  return false;
}

// ─── Routing result type ───
export interface RouteResult {
  route: AssessmentRoute;
  primaryArchetype: ArchetypeCode | string;
  escalationRefs: string[];
  routingMethod: RoutingMethod;
}

// ─── Hoofdfunctie: determineRoute ───
export function determineRoute(answers: SurveyAnswers): RouteResult {
  const escalationRefs: string[] = [];

  // ── Stap 1: V1 poortwachter ──
  if (answers.V1 === 'technical_modification') {
    return {
      route: 'red',
      primaryArchetype: 'R-01',
      escalationRefs: ['Ref: V1-Provider-Escalation'],
      routingMethod: 'deterministic',
    };
  }

  // ── Stap 2: V6 verboden praktijken ──
  if (answers.V6 === 'yes' || answers.V6 === 'unsure') {
    return {
      route: 'red',
      primaryArchetype: 'R-01',
      escalationRefs: ['Ref: Art5-Prohibited'],
      routingMethod: 'deterministic',
    };
  }

  // ── Stap 3: Baseline per V2 ──
  let route: AssessmentRoute;
  let archetype: ArchetypeCode | string;
  let routingMethod: RoutingMethod = 'deterministic';

  const sub = answers.V2_sub ?? '';

  switch (answers.V2_main) {
    case 'evaluative':
      route = 'orange';
      archetype = 'O-01';
      break;

    case 'decision_prep':
      route = 'orange';
      archetype = 'O-02';
      break;

    case 'autonomous':
      route = 'orange';
      archetype = 'O-03';
      break;

    case 'supportive':
      route = 'green';
      if (sub === 'text_generation') {
        archetype = 'G-01';
      } else if (sub === 'rewriting') {
        archetype = 'G-02';
      } else if (sub === 'creative') {
        archetype = 'G-03';
      } else if (sub === 'other') {
        archetype = 'G-01'; // fallback, Claude bepaalt
        routingMethod = 'claude_assisted';
      } else {
        archetype = 'G-01'; // default supportive
      }
      break;

    case 'informative':
      if (sub === 'rag_search') {
        route = 'green';
        archetype = 'G-04';
      } else if (sub === 'translation') {
        route = 'yellow';
        archetype = 'Y-02';
      } else if (sub === 'data_analysis') {
        route = 'yellow';
        archetype = 'Y-03';
      } else if (sub === 'other') {
        route = 'green';
        archetype = 'G-04'; // fallback, Claude bepaalt
        routingMethod = 'claude_assisted';
      } else {
        route = 'green';
        archetype = 'G-04'; // default informative
      }
      break;

    default:
      route = 'green';
      archetype = 'G-01';
      routingMethod = 'claude_assisted';
  }

  // ── Stap 4: Escalatie-regels (alleen omhoog) ──

  // 4a: Bijzondere persoonsgegevens → oranje
  if (answers.V4 === 'sensitive' && ROUTE_LEVEL[route] < ROUTE_LEVEL.orange) {
    route = 'orange';
    escalationRefs.push('Ref: Art9-Special-Categories');
  }

  // 4b: Kwetsbare groepen + evaluatief/beslissend → oranje
  if (
    answers.V3 === 'vulnerable' &&
    (answers.V2_main === 'evaluative' || answers.V2_main === 'decision_prep') &&
    ROUTE_LEVEL[route] < ROUTE_LEVEL.orange
  ) {
    route = 'orange';
    escalationRefs.push('Ref: Vulnerable-Groups-Evaluation');
  }

  // 4c: Kwetsbare groepen + bijzondere persoonsgegevens → oranje
  if (
    answers.V3 === 'vulnerable' &&
    answers.V4 === 'sensitive' &&
    ROUTE_LEVEL[route] < ROUTE_LEVEL.orange
  ) {
    route = 'orange';
    escalationRefs.push('Ref: Vulnerable-Special-Combination');
  }

  // 4d: Extern + persoonsgegevens → geel (als nog groen)
  if (answers.V3 === 'external' && answers.V4 === 'personal' && route === 'green') {
    route = 'yellow';
    escalationRefs.push('Ref: External-Personal-Data');
  }

  // 4e: Geautomatiseerd + extern/kwetsbaar → één niveau omhoog
  if (
    answers.V5 === 'automated' &&
    (answers.V3 === 'external' || answers.V3 === 'vulnerable')
  ) {
    const currentLevel = ROUTE_LEVEL[route];
    if (currentLevel < ROUTE_LEVEL.red) {
      const levels: AssessmentRoute[] = ['green', 'yellow', 'orange', 'red'];
      route = levels[currentLevel + 1];
      escalationRefs.push('Ref: Automated-External-Escalation');
    }
  }

  // ── Stap 5: Yellow-trigger Art. 50 transparantie ──
  if (
    answers.V2_main === 'informative' &&
    answers.V3 === 'external' &&
    ROUTE_LEVEL[route] < ROUTE_LEVEL.yellow
  ) {
    route = 'yellow';
    archetype = 'Y-01';
    escalationRefs.push('Ref: Art50-Transparency');
  }

  return {
    route,
    primaryArchetype: archetype,
    escalationRefs,
    routingMethod,
  };
}

// ─── Requirements per route ───
function deriveRequirements(
  route: AssessmentRoute,
  archetype: string,
  answers: SurveyAnswers
): AssessmentRequirements {
  const base: AssessmentRequirements = {
    dpia_required: false,
    fria_required: false,
    transparency_required: false,
    dpo_oversight_required: false,
    user_instructions: [],
    dpo_instructions: [],
  };

  switch (route) {
    case 'green':
      base.user_instructions = [
        'Je mag deze AI-toepassing gebruiken binnen de reguliere richtlijnen.',
        'Controleer altijd de output op feitelijke juistheid.',
      ];
      break;

    case 'yellow':
      base.transparency_required = true;
      base.transparency_template = 'Art. 50 AI Act — transparantieverplichting';
      base.user_instructions = [
        'Vermeld bij extern gebruik dat AI is ingezet (Art. 50 AI Act).',
        'Controleer output extra zorgvuldig bij externe communicatie.',
        'Documenteer het gebruik voor eventuele audits.',
      ];
      base.dpo_instructions = [
        'Transparantieverplichting van toepassing — controleer naleving.',
      ];
      break;

    case 'orange':
      base.dpia_required = true;
      base.dpo_oversight_required = true;
      base.transparency_required = true;
      base.user_instructions = [
        'Deze toepassing vereist DPO-goedkeuring voordat je verder kunt.',
        'Zorg voor menselijke controle (HITL) bij elke beslissing.',
        'Volg de verplichte micro-learning voordat je deze toepassing gebruikt.',
      ];
      base.dpo_instructions = [
        `Archetype: ${archetype} — beoordeel de use-case en stel aanvullende voorwaarden.`,
        'DPIA-beoordeling vereist voordat goedkeuring kan worden verleend.',
        'Controleer of HITL-procedures zijn ingericht.',
      ];
      if (answers.V4 === 'sensitive') {
        base.dpo_instructions.push('Bijzondere persoonsgegevens betrokken — extra zorgvuldigheid vereist.');
      }
      if (answers.V3 === 'vulnerable') {
        base.dpo_instructions.push('Kwetsbare groepen betrokken — verhoogd toezicht noodzakelijk.');
      }
      break;

    case 'red':
      base.fria_required = true;
      base.dpo_oversight_required = true;
      base.user_instructions = [
        'STOP — Deze toepassing is niet toegestaan.',
        'Neem contact op met de AI Verantwoordelijke of juridische afdeling.',
      ];
      base.dpo_instructions = [
        `Rode route: ${archetype} — gebruik is geblokkeerd.`,
        'FRIA (Fundamental Rights Impact Assessment) vereist indien heroverweging gewenst.',
        'Escaleer naar Management en Juridische afdeling.',
      ];
      break;
  }

  return base;
}

// ─── Plain-language beschrijving ───
function buildPlainLanguage(route: AssessmentRoute, archetype: string, toolName: string): string {
  const ROUTE_LABELS: Record<AssessmentRoute, string> = {
    green: 'Groen (vrij gebruik)',
    yellow: 'Geel (gebruik met transparantieverplichting)',
    orange: 'Oranje (gebruik onder DPO-toezicht)',
    red: 'Rood (gebruik niet toegestaan)',
  };

  return `${toolName} is beoordeeld als ${ROUTE_LABELS[route]}. Archetype: ${archetype}.`;
}

// ─── buildEngineOutput ───
export function buildEngineOutput(answers: SurveyAnswers, toolNameRaw: string): EngineOutput & AssessmentRequirements {
  const result = determineRoute(answers);
  const requirements = deriveRequirements(result.route, result.primaryArchetype, answers);

  return {
    route: result.route,
    primary_archetype: result.primaryArchetype as ArchetypeCode,
    secondary_archetypes: [],
    archetype_refs: [result.primaryArchetype],
    escalation_refs: result.escalationRefs,
    plain_language: buildPlainLanguage(result.route, result.primaryArchetype, toolNameRaw),
    routing_method: result.routingMethod,
    decision_version: DECISION_VERSION,
    ...requirements,
  };
}

// ─── Test-functie ───
export function testRouting(): void {
  const scenarios: { label: string; answers: SurveyAnswers; expected: AssessmentRoute }[] = [
    {
      label: '1. Groene route: tekst herschrijven, intern, publieke data, HITL',
      answers: {
        V1: 'standard', V2_main: 'supportive', V2_sub: 'rewriting',
        V2_freetext_original: null, V3: 'internal', V4: 'public', V5: 'hitl_strict',
      },
      expected: 'green',
    },
    {
      label: '2. Gele route: vertaling, extern, publieke data',
      answers: {
        V1: 'standard', V2_main: 'informative', V2_sub: 'translation',
        V2_freetext_original: null, V3: 'external', V4: 'public', V5: 'hitl_alert',
      },
      expected: 'yellow',
    },
    {
      label: '3. Oranje route: CV-screening (evaluatief), extern',
      answers: {
        V1: 'standard', V2_main: 'evaluative',
        V2_freetext_original: null, V3: 'external', V4: 'personal', V5: 'hitl_strict',
      },
      expected: 'orange',
    },
    {
      label: '4. Rode route: V1 technische modificatie',
      answers: {
        V1: 'technical_modification', V2_main: 'supportive',
        V2_freetext_original: null, V3: 'self', V4: 'public', V5: 'hitl_strict',
      },
      expected: 'red',
    },
    {
      label: '5. Escalatie: groen → geel door extern + persoonsgegevens',
      answers: {
        V1: 'standard', V2_main: 'supportive', V2_sub: 'text_generation',
        V2_freetext_original: null, V3: 'external', V4: 'personal', V5: 'hitl_alert',
      },
      expected: 'yellow',
    },
    {
      label: '6. Escalatie: groen → oranje door bijzondere persoonsgegevens',
      answers: {
        V1: 'standard', V2_main: 'supportive', V2_sub: 'creative',
        V2_freetext_original: null, V3: 'internal', V4: 'sensitive', V5: 'hitl_strict',
      },
      expected: 'orange',
    },
  ];

  console.log('=== RouteAI Risk Engine — Test Routing ===');
  console.log(`Decision version: ${DECISION_VERSION}\n`);

  let passed = 0;
  for (const s of scenarios) {
    const result = determineRoute(s.answers);
    const ok = result.route === s.expected;
    if (ok) passed++;
    console.log(
      `${ok ? '✅' : '❌'} ${s.label}`,
      `\n   Route: ${result.route} (verwacht: ${s.expected})`,
      `| Archetype: ${result.primaryArchetype}`,
      `| Method: ${result.routingMethod}`,
      result.escalationRefs.length > 0 ? `| Escalaties: ${result.escalationRefs.join(', ')}` : '',
    );
  }

  console.log(`\n=== Resultaat: ${passed}/${scenarios.length} geslaagd ===`);

  // V6 trigger test
  console.log('\n=== V6 Trigger Tests ===');
  const v6Tests = [
    { label: 'evaluative+vulnerable+automated', v2: 'evaluative' as const, v3: 'vulnerable' as const, v4: 'public' as const, v5: 'automated' as const, expected: true },
    { label: 'supportive+internal+hitl', v2: 'supportive' as const, v3: 'internal' as const, v4: 'public' as const, v5: 'hitl_strict' as const, expected: false },
    { label: 'decision_prep+vulnerable+sensitive', v2: 'decision_prep' as const, v3: 'vulnerable' as const, v4: 'sensitive' as const, v5: 'hitl_alert' as const, expected: true },
  ];

  for (const t of v6Tests) {
    const result = shouldShowV6({ V2_main: t.v2, V3: t.v3, V4: t.v4, V5: t.v5 });
    const ok = result === t.expected;
    console.log(`${ok ? '✅' : '❌'} V6 ${t.label}: ${result} (verwacht: ${t.expected})`);
  }
}

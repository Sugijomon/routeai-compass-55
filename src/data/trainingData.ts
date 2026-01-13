import { TrainingModule, AssessmentQuestion } from '../types';

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'module-1',
    slug: 'what-is-ai',
    title: 'Wat is AI?',
    description: 'Basis mechanica van AI, wat het wel/niet kan, common misconceptions',
    durationMinutes: 10,
    order: 1,
    content: `
# Wat is Kunstmatige Intelligentie?

AI (Artificial Intelligence) is software die patronen herkent in data en daar
op basis van voorspellingen doet of content genereert.

## Hoe werken Large Language Models?

LLMs zoals ChatGPT zijn getraind op miljarden teksten om te voorspellen
welk woord logisch volgt in een zin. Dit geeft de indruk van "begrip",
maar het is patroonherkenning.

## Wat AI WEL kan:

- Patronen herkennen in grote datasets
- Tekst genereren die menselijk klinkt
- Beelden maken uit beschrijvingen
- Code schrijven op basis van voorbeelden

## Wat AI NIET kan:

- Echt "begrijpen" wat het zegt
- 100% betrouwbaar zijn (hallucinations)
- Ethische afwegingen maken
- Verantwoordelijkheid nemen

**Belangrijk:** AI is een tool, geen vervanger van menselijk oordeel.
    `
  },
  
  {
    id: 'module-2',
    slug: 'recognize-risks',
    title: 'Risico\'s Herkennen',
    description: 'Hallucinations, bias, privacy, en wanneer iets hoog-risico is',
    durationMinutes: 15,
    order: 2,
    content: `
# AI Risico's Herkennen

## 1. Hallucinations (Verzinsels)

AI kan zelfverzekerd incorrecte informatie geven.

**Voorbeeld:** ChatGPT verzint juridische zaken die niet bestaan.

**Mitigatie:** Altijd verificeer belangrijke feiten.

## 2. Bias & Unfairness

AI leert van (vooroordelen in) training data.

**Voorbeeld:** Recruitment AI discrimineert tegen vrouwelijke kandidaten.

**Mitigatie:** Menselijke oversight bij beslissingen over personen.

## 3. Privacy & Data Leakage

Data die je invoert kan gebruikt worden voor training.

**Voorbeeld:** Vertrouwelijke bedrijfsinfo in ChatGPT prompt.

**Mitigatie:** Nooit gevoelige/persoonlijke data in publieke AI tools.

## 4. EU AI Act Risiconiveaus

- **Minimal:** Gebruik zonder impact op personen
- **Limited:** Transparantie vereist
- **High:** Annex III domeinen (recruitment, credit scoring, etc.)
- **Unacceptable:** Verboden (social scoring, manipulatie)

**Vuistregel:** Beïnvloedt het mensen? → Hoger risico
    `
  },
  
  {
    id: 'module-3',
    slug: 'safe-usage',
    title: 'Veilig Gebruik',
    description: 'Prompting best practices, wanneer menselijke verificatie nodig is',
    durationMinutes: 15,
    order: 3,
    content: `
# Veilig AI Gebruik

## Effectief Prompten

**DO:**
- Wees specifiek: "Vat dit samen in 3 bullets"
- Geef context: "Voor een technisch publiek"
- Vraag om bronnen: "Met referenties"

**DON'T:**
- Vage vragen: "Vertel over marketing"
- Zonder verificatie: "Geef me juridisch advies"
- Zonder context: "Maak een rapport"

## Wanneer Menselijke Verificatie?

**ALTIJD bij:**
- Beslissingen over personen
- Juridische/medische adviezen
- Financiële transacties
- Publieke communicatie

**GOED IDEE bij:**
- Nieuwe use cases
- Gevoelige onderwerpen
- Factual claims

## De "AI as Draft" Mentaliteit

Behandel AI output als EERSTE CONCEPT, niet finaal product.

**Workflow:**
1. AI genereert draft
2. Mens reviewed en verbetert
3. Mens neemt finale beslissing
4. Mens is verantwoordelijk

**Jij blijft eigenaar van de output.**
    `
  },
  
  {
    id: 'module-4',
    slug: 'eu-ai-act-basics',
    title: 'EU AI Act Basics',
    description: 'Risicocategorieën, verplichtingen, waarom context belangrijk is',
    durationMinutes: 10,
    order: 4,
    content: `
# EU AI Act - Wat Je Moet Weten

## Waarom Deze Wet?

De EU AI Act reguleert AI om burgers te beschermen tegen risico's
terwijl innovatie mogelijk blijft.

**Kernprincipe:** Hoe groter de impact, hoe strenger de eisen.

## Risicocategorieën

### Unacceptable (Verboden)
- Social scoring door overheden
- Manipulatie van kwetsbare groepen
- Real-time biometrische surveillance (met uitzonderingen)

### High Risk (Annex III)
- Recruitment & HR
- Toegang tot onderwijs
- Kredietwaardigheid
- Law enforcement
- Kritieke infrastructuur

**Verplichtingen:** Documentatie, menselijke oversight, transparantie

### Limited Risk
- Chatbots
- AI-gegenereerde content

**Verplichting:** Transparantie (gebruikers moeten weten dat het AI is)

### Minimal Risk
- Spelletjes
- Spamfilters

**Verplichting:** Geen

## Jouw Verantwoordelijkheid

**Als gebruiker ben je "deployer"** - jij bepaalt HOE de AI gebruikt wordt.

**Consequentie:** Dezelfde tool kan minimal OF high-risk zijn afhankelijk
van CONTEXT en DOEL.

**Voorbeeld:**
- ChatGPT voor brainstormen → Minimal
- ChatGPT voor CV screening → High Risk

**RouteAI helpt je bepalen welke categorie van toepassing is.**
    `
  }
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    scenario: 'Je wilt AI gebruiken om inkomende CV\'s automatisch te sorteren op relevantie. De AI geeft elke kandidaat een score van 1-10.',
    question: 'Wat is het GROOTSTE risico in deze situatie?',
    options: [
      { id: 'A', text: 'De AI kan hallucineren over kandidaat-skills', isCorrect: false },
      { id: 'B', text: 'Dit valt onder Annex III (recruitment) en is high-risk', isCorrect: true },
      { id: 'C', text: 'De AI is niet getraind op Nederlandse CV\'s', isCorrect: false },
      { id: 'D', text: 'Het kost te veel rekenkracht', isCorrect: false }
    ],
    explanation: 'Recruitment is een Annex III high-risk domein volgens de EU AI Act. Geautomatiseerde CV-beoordeling vereist menselijke oversight, documentatie en waarborgen tegen discriminatie.',
    category: 'eu-ai-act'
  },
  
  {
    id: 'q2',
    scenario: 'Je gebruikt ChatGPT om een interne memo samen te vatten voor je team. De memo bevat geen persoonsgegevens.',
    question: 'Welk risiconiveau is dit?',
    options: [
      { id: 'A', text: 'Unacceptable - dit mag niet', isCorrect: false },
      { id: 'B', text: 'High risk - vereist approval', isCorrect: false },
      { id: 'C', text: 'Limited risk - transparantie nodig', isCorrect: false },
      { id: 'D', text: 'Minimal risk - met je rijbewijs toegestaan', isCorrect: true }
    ],
    explanation: 'Tekst samenvatten van niet-gevoelige interne documenten is minimal risk en valt onder de "Tekst Operaties" capability van je AI-rijbewijs.',
    category: 'capabilities'
  },
  
  {
    id: 'q3',
    scenario: 'Een collega vraagt of je AI kunt gebruiken om klantfeedback te analyseren en patronen te identificeren. De feedback bevat namen en email adressen.',
    question: 'Wat is de juiste aanpak?',
    options: [
      { id: 'A', text: 'Direct doen - analyse is toegestaan', isCorrect: false },
      { id: 'B', text: 'Eerst data anonymiseren, dan analyseren', isCorrect: true },
      { id: 'C', text: 'Mag niet - klantdata is altijd verboden', isCorrect: false },
      { id: 'D', text: 'Alleen met toestemming van elke klant', isCorrect: false }
    ],
    explanation: 'Je "Basis Data-Analyse" capability dekt alleen geanonimiseerde/geaggregeerde data. Persoonlijke data (namen, emails) moet eerst geanonimiseerd worden, of je hebt een uitzondering nodig via RouteAI.',
    category: 'capabilities'
  },
  
  {
    id: 'q4',
    scenario: 'Je vraagt ChatGPT om een juridisch contract op te stellen voor een leverancier.',
    question: 'Wat is het probleem hiermee?',
    options: [
      { id: 'A', text: 'ChatGPT is niet getraind op juridische teksten', isCorrect: false },
      { id: 'B', text: 'Dit valt buiten je capabilities - juridisch advies is verboden zonder extra waarborgen', isCorrect: true },
      { id: 'C', text: 'Het kost te veel tokens', isCorrect: false },
      { id: 'D', text: 'Contracten mogen alleen in het Engels', isCorrect: false }
    ],
    explanation: 'Juridische documenten opstellen valt NIET onder je basiscapabilities. Dit vereist menselijke juridische expertise. AI kan hooguit een draft leveren die een jurist moet reviewen.',
    category: 'capabilities'
  },
  
  {
    id: 'q5',
    scenario: 'Je ziet dat AI een feitelijke fout heeft gemaakt in een gegenereerde tekst (een jaartal klopt niet).',
    question: 'Wat leer je hieruit?',
    options: [
      { id: 'A', text: 'Deze AI is slecht, gebruik een ander model', isCorrect: false },
      { id: 'B', text: 'Hallucinations zijn normaal - altijd verificeer belangrijke feiten', isCorrect: true },
      { id: 'C', text: 'Dit gebeurt alleen bij gratis versies', isCorrect: false },
      { id: 'D', text: 'Je prompt was niet goed genoeg', isCorrect: false }
    ],
    explanation: 'Hallucinations (verzinsels) zijn inherent aan hoe LLMs werken. Ze voorspellen waarschijnlijke woorden, niet waarheid. Menselijke verificatie van feiten blijft essentieel.',
    category: 'risks'
  },
  
  {
    id: 'q6',
    scenario: 'Je wilt Midjourney gebruiken om beelden te genereren voor een marketingcampagne.',
    question: 'Welke capability dekt dit?',
    options: [
      { id: 'A', text: 'Tekst Operaties', isCorrect: false },
      { id: 'B', text: 'Basis Data-Analyse', isCorrect: false },
      { id: 'C', text: 'Ideation & Brainstormen', isCorrect: true },
      { id: 'D', text: 'Geen - beeldgeneratie is altijd verboden', isCorrect: false }
    ],
    explanation: 'Creatieve beeldgeneratie voor marketing valt onder "Ideation & Brainstormen" - je gebruikt AI als inspiratiebron voor visuele concepten.',
    category: 'capabilities'
  },
  
  {
    id: 'q7',
    scenario: 'Een manager vraagt je om AI te gebruiken voor het beoordelen van de prestaties van teamleden.',
    question: 'Wat is hier het probleem?',
    options: [
      { id: 'A', text: 'AI is niet nauwkeurig genoeg', isCorrect: false },
      { id: 'B', text: 'Dit is een beslissing over personen en valt buiten je capabilities', isCorrect: true },
      { id: 'C', text: 'Het is te duur', isCorrect: false },
      { id: 'D', text: 'Alleen HR mag dit doen', isCorrect: false }
    ],
    explanation: 'Prestatiebeoordeling is een beslissing over personen en valt onder "prohibitedWhen: personnel_decisions". Dit vereist menselijke beoordeling en extra waarborgen.',
    category: 'capabilities'
  },
  
  {
    id: 'q8',
    scenario: 'Je wilt een AI-chatbot inzetten voor klantenservice om FAQ\'s te beantwoorden.',
    question: 'Welk risiconiveau is dit volgens de EU AI Act?',
    options: [
      { id: 'A', text: 'Minimal risk', isCorrect: false },
      { id: 'B', text: 'Limited risk - gebruikers moeten weten dat het AI is', isCorrect: true },
      { id: 'C', text: 'High risk', isCorrect: false },
      { id: 'D', text: 'Unacceptable', isCorrect: false }
    ],
    explanation: 'Chatbots vallen onder "Limited Risk" in de EU AI Act. De belangrijkste verplichting is transparantie: gebruikers moeten weten dat ze met een AI praten.',
    category: 'eu-ai-act'
  },
  
  {
    id: 'q9',
    scenario: 'Je wilt GitHub Copilot gebruiken om authenticatiecode te schrijven voor een login systeem.',
    question: 'Wat is de juiste aanpak?',
    options: [
      { id: 'A', text: 'Direct gebruiken - code generatie is toegestaan', isCorrect: false },
      { id: 'B', text: 'Security-critical code vereist expert review, niet alleen AI', isCorrect: true },
      { id: 'C', text: 'Alleen de gratis versie gebruiken', isCorrect: false },
      { id: 'D', text: 'Mag niet - AI code is altijd onveilig', isCorrect: false }
    ],
    explanation: 'Security-critical code (authenticatie, encryptie, payments) is high-risk. AI kan helpen, maar menselijke security expertise en code review zijn essentieel.',
    category: 'risks'
  },
  
  {
    id: 'q10',
    scenario: 'Je collega stopt klantgegevens inclusief BSN-nummers in ChatGPT voor een analyse.',
    question: 'Wat is hier mis?',
    options: [
      { id: 'A', text: 'ChatGPT is niet de beste tool voor analyse', isCorrect: false },
      { id: 'B', text: 'BSN is special category data - dit is verboden in je capabilities', isCorrect: true },
      { id: 'C', text: 'Het duurt te lang', isCorrect: false },
      { id: 'D', text: 'Alleen Claude mag dit', isCorrect: false }
    ],
    explanation: 'BSN-nummers zijn bijzondere persoonsgegevens (special category). Dit valt expliciet onder "prohibitedWhen: dataTypes: special_category" en is verboden zonder speciale toestemming.',
    category: 'capabilities'
  }
];

// Helper functies
export function getModuleBySlug(slug: string): TrainingModule | undefined {
  return TRAINING_MODULES.find(m => m.slug === slug);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return TRAINING_MODULES.find(m => m.id === id);
}

export const PASSING_SCORE = 75;
export const MIN_ASSESSMENT_QUESTIONS = 5;

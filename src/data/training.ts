import { TrainingModule, AssessmentQuestion } from '@/types';

export const trainingModules: TrainingModule[] = [
  {
    id: 'module-1',
    slug: 'ai-basics',
    title: 'AI Fundamenten',
    description: 'Begrijp wat AI is, hoe het werkt en wat de mogelijkheden en beperkingen zijn.',
    durationMinutes: 15,
    order: 1,
    content: `
# AI Fundamenten

## Wat is Generatieve AI?

Generatieve AI is een type kunstmatige intelligentie dat nieuwe content kan creëren - tekst, afbeeldingen, code en meer. In tegenstelling tot traditionele software die regels volgt, leert generatieve AI patronen uit enorme hoeveelheden data.

### Hoe werkt het?

Large Language Models (LLMs) zoals ChatGPT, Claude en Gemini zijn getraind op miljarden teksten. Ze voorspellen het meest waarschijnlijke volgende woord op basis van de input die ze ontvangen.

**Belangrijk om te begrijpen:**
- AI "begrijpt" niet echt - het herkent patronen
- AI kan overtuigend klinken maar feitelijk onjuist zijn
- AI heeft geen toegang tot actuele informatie (tenzij specifiek gekoppeld)
- AI kan niet redeneren zoals mensen, maar simuleert dit goed

### Mogelijkheden

✅ Tekst genereren, samenvatten en herschrijven
✅ Brainstormen en ideeën genereren
✅ Code schrijven en debuggen
✅ Informatie structureren en analyseren
✅ Vertalen en lokaliseren

### Beperkingen

❌ Geen garantie op feitelijke juistheid
❌ Kan verouderde informatie geven
❌ Moeite met complexe logica en wiskunde
❌ Geen echte creativiteit of begrip
❌ Gevoelig voor de manier waarop vragen gesteld worden
    `,
  },
  {
    id: 'module-2',
    slug: 'responsible-use',
    title: 'Verantwoord Gebruik',
    description: 'Leer de principes van verantwoord AI-gebruik in een zakelijke context.',
    durationMinutes: 20,
    order: 2,
    content: `
# Verantwoord AI Gebruik

## De Kernprincipes

### 1. Menselijke Controle

AI is een hulpmiddel, geen beslisser. De mens blijft altijd verantwoordelijk voor:
- Het controleren van AI-output op juistheid
- Het nemen van uiteindelijke beslissingen
- Het herkennen wanneer AI niet geschikt is

### 2. Transparantie

- Wees open over het gebruik van AI
- Documenteer wanneer AI is ingezet
- Communiceer duidelijk naar belanghebbenden

### 3. Privacy & Vertrouwelijkheid

**Deel NOOIT met AI-tools:**
- Persoonsgegevens van klanten of medewerkers
- Financiële details van individuen
- Medische of gezondheidsgegevens
- Wachtwoorden, API keys of toegangscodes
- Vertrouwelijke bedrijfsinformatie

### 4. Kwaliteitscontrole

- Verifieer feiten via betrouwbare bronnen
- Controleer gegenereerde tekst op juistheid
- Review code voordat deze in productie gaat
- Laat belangrijke output door een collega checken

## De "STOP" Methode

Voordat je AI gebruikt, doorloop:

**S** - Sensitieve data? → Niet invoeren
**T** - Transparant? → Documenteer gebruik
**O** - Output gecontroleerd? → Verifieer altijd
**P** - Proportioneel? → Is AI hier nodig?
    `,
  },
  {
    id: 'module-3',
    slug: 'risk-assessment',
    title: 'Risico Beoordeling',
    description: 'Leer risico\'s van AI-gebruik te herkennen en te classificeren.',
    durationMinutes: 20,
    order: 3,
    content: `
# Risico Beoordeling

## Risiconiveaus

### 🟢 Minimaal Risico

Gebruik waarbij:
- Alleen publieke of niet-gevoelige informatie betrokken is
- De output geen directe impact heeft op mensen
- Menselijke review altijd plaatsvindt

**Voorbeelden:**
- Brainstormen over projectideeën
- Publieke informatie samenvatten
- Eerste concept van een blogpost

### 🟡 Beperkt Risico

Gebruik waarbij:
- Interne niet-gevoelige informatie betrokken kan zijn
- De output invloed kan hebben op bedrijfsprocessen
- Extra controle nodig is

**Voorbeelden:**
- Interne communicatie opstellen
- Data-analyse van geaggregeerde gegevens
- Klantcommunicatie concepten

### 🔴 Hoog Risico

Gebruik waarbij:
- Gevoelige of persoonsgegevens betrokken zijn
- Beslissingen directe impact hebben op mensen
- Wettelijke of ethische implicaties spelen

**Voorbeelden:**
- HR-gerelateerde beslissingen
- Juridische documenten
- Financiële adviezen voor individuen
- Medische informatie

## Beslisboom

1. Bevat de input gevoelige gegevens? → **STOP**
2. Heeft de output directe impact op mensen? → **Extra review nodig**
3. Zijn er juridische implicaties? → **Raadpleeg expert**
4. Is menselijke controle gegarandeerd? → **Doorgaan met zorg**
    `,
  },
  {
    id: 'module-4',
    slug: 'practical-guidelines',
    title: 'Praktische Richtlijnen',
    description: 'Concrete do\'s en don\'ts voor dagelijks AI-gebruik op de werkvloer.',
    durationMinutes: 15,
    order: 4,
    content: `
# Praktische Richtlijnen

## ✅ DO's

### Effectief Prompten

- Wees specifiek in je verzoek
- Geef context zonder gevoelige details
- Vraag om bronnen of onderbouwing
- Gebruik stapsgewijze instructies

**Voorbeeld goed:**
"Schrijf een eerste concept voor een interne memo over ons nieuwe werkrooster. De toon moet professioneel maar vriendelijk zijn. Focus op de voordelen voor medewerkers."

**Voorbeeld slecht:**
"Schrijf een memo over Jan die minder gaat werken vanwege zijn gezondheidsproblemen."

### Kwaliteitscontrole

- Lees alle output kritisch door
- Verifieer feiten via betrouwbare bronnen
- Laat belangrijke teksten door een collega checken
- Documenteer waar AI is gebruikt

## ❌ DON'Ts

### Nooit Delen

- Namen + persoonsgegevens
- Financiële data van individuen
- Gezondheids- of medische informatie
- Wachtwoorden en toegangscodes
- Concurrentiegevoelige strategieën
- Inhoud van vertrouwelijke gesprekken

### Vermijd

- Blind vertrouwen op AI-output
- AI gebruiken voor definitieve beslissingen over mensen
- Juridische teksten zonder expert review
- Automatische verzending van AI-gegenereerde content

## Dagelijkse Checklist

☐ Is de input vrij van gevoelige gegevens?
☐ Heb ik de output gecontroleerd?
☐ Is menselijke review uitgevoerd waar nodig?
☐ Is het gebruik gedocumenteerd?
☐ Ben ik transparant over AI-gebruik?
    `,
  },
];

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q1',
    scenario: 'Je collega vraagt of je ChatGPT kunt gebruiken om een samenvatting te maken van de notulen van het MT-overleg, waarin personeelsmutaties en salarisaanpassingen besproken zijn.',
    question: 'Wat is de juiste handelswijze?',
    options: [
      {
        id: 'q1-a',
        text: 'Ja, het is een interne samenvatting dus dat mag',
        isCorrect: false,
      },
      {
        id: 'q1-b',
        text: 'Nee, dit bevat gevoelige personeelsgegevens die niet gedeeld mogen worden met AI-tools',
        isCorrect: true,
      },
      {
        id: 'q1-c',
        text: 'Alleen als je de namen weglaat',
        isCorrect: false,
      },
      {
        id: 'q1-d',
        text: 'Alleen met toestemming van de betrokken medewerkers',
        isCorrect: false,
      },
    ],
    explanation: 'Notulen met personeelsmutaties en salarisgegevens bevatten gevoelige persoonsgegevens. Deze mogen nooit met externe AI-tools worden gedeeld, ook niet geanonimiseerd omdat de context vaak herleidbaar is.',
    category: 'data_privacy',
  },
  {
    id: 'q2',
    scenario: 'Je wilt AI gebruiken om een eerste concept te schrijven voor een blogpost over de trends in jouw industrie.',
    question: 'Wat moet je doen voordat je de tekst publiceert?',
    options: [
      {
        id: 'q2-a',
        text: 'Direct publiceren, AI is goed in schrijven',
        isCorrect: false,
      },
      {
        id: 'q2-b',
        text: 'De tekst controleren op juistheid en laten reviewen door een collega',
        isCorrect: true,
      },
      {
        id: 'q2-c',
        text: 'Alleen de spelling controleren',
        isCorrect: false,
      },
      {
        id: 'q2-d',
        text: 'Vermelden dat het door AI geschreven is',
        isCorrect: false,
      },
    ],
    explanation: 'AI kan overtuigend klinken maar feitelijk onjuist zijn. Alle AI-gegenereerde content moet gecontroleerd worden op feitelijke juistheid. Voor publicatie is ook een review door een collega aan te raden.',
    category: 'quality_control',
  },
  {
    id: 'q3',
    scenario: 'Een klant stuurt een uitgebreide klacht per e-mail. Je overweegt AI te gebruiken om een antwoord op te stellen.',
    question: 'Wat is het belangrijkste aandachtspunt?',
    options: [
      {
        id: 'q3-a',
        text: 'De volledige e-mail in AI plakken voor analyse',
        isCorrect: false,
      },
      {
        id: 'q3-b',
        text: 'AI gebruiken voor een concept zonder klantgegevens, daarna personaliseren en laten reviewen',
        isCorrect: true,
      },
      {
        id: 'q3-c',
        text: 'AI het antwoord laten verzenden namens jou',
        isCorrect: false,
      },
      {
        id: 'q3-d',
        text: 'AI nooit gebruiken voor klantcommunicatie',
        isCorrect: false,
      },
    ],
    explanation: 'AI kan helpen bij het opstellen van een conceptreactie, maar deel nooit de originele klacht met persoonsgegevens. Het concept moet altijd gepersonaliseerd en gecontroleerd worden voor verzending.',
    category: 'customer_communication',
  },
  {
    id: 'q4',
    scenario: 'Je team wil GitHub Copilot gebruiken voor een nieuw softwareproject.',
    question: 'Welke actie is het belangrijkst voor verantwoord gebruik?',
    options: [
      {
        id: 'q4-a',
        text: 'Alle gegenereerde code direct in productie nemen voor snelheid',
        isCorrect: false,
      },
      {
        id: 'q4-b',
        text: 'Code review verplicht stellen voor alle AI-gegenereerde code',
        isCorrect: true,
      },
      {
        id: 'q4-c',
        text: 'API keys in comments zetten zodat de AI ze kan vinden',
        isCorrect: false,
      },
      {
        id: 'q4-d',
        text: 'GitHub Copilot niet gebruiken',
        isCorrect: false,
      },
    ],
    explanation: 'AI-gegenereerde code kan bugs, security issues of onefficiënte oplossingen bevatten. Code review is essentieel. Deel nooit secrets of API keys in code of comments.',
    category: 'code_safety',
  },
  {
    id: 'q5',
    scenario: 'Je manager vraagt je om met AI een analyse te maken van individuele verkoopprestaties om te bepalen wie een bonus krijgt.',
    question: 'Wat is de juiste reactie?',
    options: [
      {
        id: 'q5-a',
        text: 'De analyse maken met AI, het is objectiever dan menselijke beoordeling',
        isCorrect: false,
      },
      {
        id: 'q5-b',
        text: 'Aangeven dat dit een hoog-risico toepassing is die niet geschikt is voor AI',
        isCorrect: true,
      },
      {
        id: 'q5-c',
        text: 'Alleen geaggregeerde data gebruiken',
        isCorrect: false,
      },
      {
        id: 'q5-d',
        text: 'Dit mag alleen met de juiste AI-licentie',
        isCorrect: false,
      },
    ],
    explanation: 'Beslissingen over individuele beoordelingen, bonussen of beloningen zijn "consequential decisions" die directe impact hebben op mensen. Dit valt onder hoog-risico AI-gebruik en is niet toegestaan.',
    category: 'risk_assessment',
  },
  {
    id: 'q6',
    scenario: 'Je wilt DeepL gebruiken om een intern beleidsdocument te vertalen naar het Engels voor je internationale collega\'s.',
    question: 'Welke overweging is het belangrijkst?',
    options: [
      {
        id: 'q6-a',
        text: 'DeepL is Europees dus alles mag',
        isCorrect: false,
      },
      {
        id: 'q6-b',
        text: 'Controleren of het document gevoelige informatie bevat en de Pro versie gebruiken',
        isCorrect: true,
      },
      {
        id: 'q6-c',
        text: 'Alleen korte teksten vertalen',
        isCorrect: false,
      },
      {
        id: 'q6-d',
        text: 'Een beëdigd vertaler inschakelen',
        isCorrect: false,
      },
    ],
    explanation: 'Controleer altijd of documenten gevoelige informatie bevatten. De Pro versie van DeepL bewaart geen teksten, wat belangrijk is voor interne documenten. Voor juridisch bindende vertalingen is wel een professionele vertaler nodig.',
    category: 'tool_selection',
  },
  {
    id: 'q7',
    scenario: 'Tijdens een brainstormsessie wil iemand AI gebruiken om ideeën te genereren voor de nieuwe marketingstrategie.',
    question: 'Is dit een geschikt gebruik van AI?',
    options: [
      {
        id: 'q7-a',
        text: 'Nee, strategische beslissingen mogen niet met AI',
        isCorrect: false,
      },
      {
        id: 'q7-b',
        text: 'Ja, mits geen concurrentiegevoelige informatie wordt gedeeld en de ideeën als startpunt dienen, niet als eindproduct',
        isCorrect: true,
      },
      {
        id: 'q7-c',
        text: 'Alleen met toestemming van het MT',
        isCorrect: false,
      },
      {
        id: 'q7-d',
        text: 'Ja, AI is objectiever dan mensen',
        isCorrect: false,
      },
    ],
    explanation: 'Brainstormen is een laag-risico toepassing mits je geen vertrouwelijke bedrijfsinformatie deelt. AI-ideeën zijn een startpunt voor menselijke discussie, niet het eindproduct.',
    category: 'ideation',
  },
  {
    id: 'q8',
    scenario: 'Je ontdekt dat een AI-tool die je gebruikt, de ingevoerde data gebruikt om het model te trainen.',
    question: 'Wat moet je doen?',
    options: [
      {
        id: 'q8-a',
        text: 'Doorgaan met gebruik, training maakt de tool beter',
        isCorrect: false,
      },
      {
        id: 'q8-b',
        text: 'De tool niet meer gebruiken voor werkgerelateerde data en dit melden',
        isCorrect: true,
      },
      {
        id: 'q8-c',
        text: 'Alleen privédata gebruiken',
        isCorrect: false,
      },
      {
        id: 'q8-d',
        text: 'De privacy-instellingen aanpassen',
        isCorrect: false,
      },
    ],
    explanation: 'Als een AI-tool data gebruikt voor training, kan bedrijfsinformatie onderdeel worden van het model en mogelijk terugkomen in output voor anderen. Dit is een serieus privacy-risico dat gemeld moet worden.',
    category: 'data_privacy',
  },
];

export const getModuleBySlug = (slug: string): TrainingModule | undefined => {
  return trainingModules.find(module => module.slug === slug);
};

export const getModuleById = (id: string): TrainingModule | undefined => {
  return trainingModules.find(module => module.id === id);
};

export const PASSING_SCORE = 75; // Percentage needed to pass
export const MIN_ASSESSMENT_QUESTIONS = 6; // Minimum questions to show

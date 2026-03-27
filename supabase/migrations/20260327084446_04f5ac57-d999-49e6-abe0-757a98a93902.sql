
DO $$
DECLARE
  v_course_id  uuid := 'f1a00000-0000-0000-0000-000000000001';
  v_lesson_1   uuid := 'f1b00000-0000-0000-0000-000000000001';
  v_lesson_2   uuid := 'f1b00000-0000-0000-0000-000000000002';
  v_lesson_3   uuid := 'f1b00000-0000-0000-0000-000000000003';
  v_lesson_4   uuid := 'f1b00000-0000-0000-0000-000000000004';
  v_lesson_5   uuid := 'f1b00000-0000-0000-0000-000000000005';
  v_lesson_6   uuid := 'f1b00000-0000-0000-0000-000000000006';
  v_lesson_7   uuid := 'f1b00000-0000-0000-0000-000000000007';
BEGIN

  -- 1. Cursus
  INSERT INTO public.courses (id, title, description, required_for_onboarding, unlocks_capability, is_published, passing_threshold)
  VALUES (
    v_course_id,
    'AI Literacy voor Verantwoord AI-gebruik',
    'Verplichte onboarding-cursus. Na voltooiing en het behalen van het examen ontvang je jouw AI-rijbewijs — de toegangspoort tot de Risk Engine van RouteAI.',
    true,
    'ai_check',
    true,
    80
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Les 1 — Wat is AI?
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_1,
    'Wat is AI?',
    'Begrijp wat AI is en wat het niet is — de basis voor verantwoord gebruik.',
    'course_module',
    10,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t1-wat-is-ai",
        "title": "Wat is AI?",
        "order": 0,
        "blocks": [
          {"id": "l1-hero", "type": "hero", "title": "Wat is AI?", "subtitle": "Begrijp wat AI is en wat het niet is — de basis voor verantwoord gebruik"},
          {"id": "l1-p1", "type": "paragraph", "html": "<p>Kunstmatige intelligentie (AI) is software die taken uitvoert die normaal menselijke intelligentie vereisen: tekst schrijven, patronen herkennen, beslissingen ondersteunen. Belangrijk: AI heeft geen bewustzijn, geen intentie en geeft geen garantie op correcte uitkomsten.</p>"},
          {"id": "l1-p2", "type": "paragraph", "html": "<p>Er zijn drie typen AI die je in de praktijk tegenkomt. <strong>Rule-based systemen</strong> volgen vaste regels (spamfilter, if-then-logica). <strong>Machine learning-modellen</strong> leren van data en herkennen patronen (aanbevelingssystemen, fraudedetectie). <strong>Generatieve AI (GPAI)</strong> produceert nieuwe inhoud — tekst, beelden, code — op basis van patronen in enorme trainingsdatasets.</p>"},
          {"id": "l1-callout1", "type": "callout", "variant": "blue", "title": "Wat AI niet is", "text": "AI heeft geen bewustzijn en begrijpt niet wat het produceert. Het maakt statistische voorspellingen op basis van trainingsdata. Fouten zijn inherent aan het systeem — niet door slechte bedoelingen."},
          {"id": "l1-kt1", "type": "key_takeaways", "items": ["AI voert taken uit die menselijke intelligentie vereisen, maar heeft geen bewustzijn", "Generatieve AI (ChatGPT, Claude) produceert nieuwe inhoud op basis van trainingsdata", "AI-output is altijd een voorspelling — altijd controleren"]},
          {"id": "l1-q1", "type": "quiz_mc", "question": "Welk van deze is een voorbeeld van generatieve AI?", "options": [{"id": "a", "text": "Een spamfilter die e-mails sorteert", "isCorrect": false}, {"id": "b", "text": "Een chatbot die tekst genereert op basis van een prompt", "isCorrect": true}, {"id": "c", "text": "Een rekensysteem dat facturen verwerkt", "isCorrect": false}], "explanation": "Generatieve AI produceert nieuwe inhoud — tekst, code, beelden — op basis van patronen in trainingsdata."},
          {"id": "l1-q2", "type": "quiz_mc", "question": "Wat is het grootste verschil tussen rule-based AI en machine learning?", "options": [{"id": "a", "text": "Rule-based AI is altijd veiliger", "isCorrect": false}, {"id": "b", "text": "Machine learning leert van data; rule-based volgt vaste regels", "isCorrect": true}, {"id": "c", "text": "Machine learning heeft bewustzijn", "isCorrect": false}], "explanation": "Rule-based systemen volgen geprogrammeerde regels. ML-modellen leren patronen uit data."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Les 2 — AI-risico's en de EU AI Act
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_2,
    'AI-risico''s en de EU AI Act',
    'Vier risicoklassen, één doel: veilig en verantwoord AI-gebruik.',
    'course_module',
    12,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t2-risicos-eu-ai-act",
        "title": "AI-risico''s en de EU AI Act",
        "order": 0,
        "blocks": [
          {"id": "l2-hero", "type": "hero", "title": "AI-risico''s en de EU AI Act", "subtitle": "Vier risicoklassen, één doel: veilig en verantwoord AI-gebruik"},
          {"id": "l2-p1", "type": "paragraph", "html": "<p>De EU AI Act categoriseert AI-systemen in vier risicoklassen. Elk niveau brengt andere verplichtingen mee voor organisaties die AI inzetten.</p>"},
          {"id": "l2-callout1", "type": "callout", "variant": "red", "title": "Verboden AI (Art. 5)", "text": "Sommige AI-toepassingen zijn volledig verboden in de EU: social scoring door overheden, subliminale manipulatie, real-time biometrische identificatie in openbare ruimtes voor handhaving, en AI die kwetsbaarheden van mensen uitbuit."},
          {"id": "l2-p2", "type": "paragraph", "html": "<p><strong>Hoog-risico AI</strong> (Annex III) omvat systemen die worden ingezet bij CV-screening, kredietbeoordeling, medische diagnose, studentbeoordeling en rechtshandhaving. Deze systemen vereisen een DPIA, menselijk toezicht en DPO-betrokkenheid.</p><p><strong>Beperkt risico</strong> (bv. chatbots met externen) vereist transparantie: gebruikers moeten weten dat ze met AI communiceren.</p><p><strong>Minimaal risico</strong> (bv. spamfilters) kent geen specifieke verplichtingen.</p>"},
          {"id": "l2-callout2", "type": "callout", "variant": "yellow", "title": "Deployer vs. provider", "text": "Als jouw organisatie een AI-tool inkoopt en inzet (deployer), ben je verantwoordelijk voor correct gebruik. De leverancier (provider) is verantwoordelijk voor het systeem zelf. Beide hebben eigen verplichtingen."},
          {"id": "l2-kt1", "type": "key_takeaways", "items": ["Vier risicoklassen: verboden, hoog-risico, beperkt-risico, minimaal-risico", "Hoog-risico AI vereist DPIA, menselijk toezicht en DPO-betrokkenheid", "Als deployer ben je medeverantwoordelijk voor correct AI-gebruik"]},
          {"id": "l2-q1", "type": "quiz_mc", "question": "Een organisatie gebruikt AI voor CV-screening. Welke risicoklasse is van toepassing?", "options": [{"id": "a", "text": "Minimaal risico — het is slechts een hulpmiddel", "isCorrect": false}, {"id": "b", "text": "Hoog risico — Annex III omvat personeelsselectie", "isCorrect": true}, {"id": "c", "text": "Beperkt risico — alleen transparantie vereist", "isCorrect": false}], "explanation": "Annex III van de EU AI Act benoemt personeelsselectie expliciet als hoog-risico toepassing."},
          {"id": "l2-q2", "type": "quiz_mc", "question": "Welke AI-toepassing is verboden onder Art. 5 EU AI Act?", "options": [{"id": "a", "text": "Een chatbot die klantvragen beantwoordt", "isCorrect": false}, {"id": "b", "text": "Real-time gezichtsherkenning in openbare ruimtes voor handhaving", "isCorrect": true}, {"id": "c", "text": "Een aanbevelingssysteem voor films", "isCorrect": false}], "explanation": "Real-time biometrische identificatie voor handhaving in openbare ruimtes valt onder de verboden praktijken van Art. 5."},
          {"id": "l2-q3", "type": "quiz_tf", "question": "Als een medewerker een AI-tool onjuist gebruikt, is alleen de leverancier aansprakelijk.", "correctAnswer": false, "explanation": "Als deployer is de organisatie medeverantwoordelijk voor correct gebruik. Interne richtlijnen en training zijn vereist."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Les 3 — Verantwoord gebruik en menselijk toezicht
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_3,
    'Verantwoord gebruik en menselijk toezicht',
    'AI als gereedschap — jij blijft verantwoordelijk.',
    'course_module',
    10,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t3-verantwoord-gebruik",
        "title": "Verantwoord gebruik en menselijk toezicht",
        "order": 0,
        "blocks": [
          {"id": "l3-hero", "type": "hero", "title": "Verantwoord gebruik en menselijk toezicht", "subtitle": "AI als gereedschap — jij blijft verantwoordelijk"},
          {"id": "l3-p1", "type": "paragraph", "html": "<p>Menselijk toezicht (Human-in-the-Loop, HITL) betekent dat een mens de AI-output controleert vóór er een beslissing op wordt gebaseerd. Dit is niet optioneel bij hoog-risico toepassingen — het is een wettelijke verplichting (EU AI Act Art. 14).</p>"},
          {"id": "l3-p2", "type": "paragraph", "html": "<p>Er zijn drie toezichtsniveaus. <strong>Strikt HITL</strong>: elk resultaat wordt individueel gecontroleerd vóór gebruik — verplicht bij beslissingen over mensen. <strong>Toezicht met alertheid</strong>: outputs worden kritisch beoordeeld en bij twijfel gecheckt via het incidentsysteem. <strong>Geautomatiseerd</strong>: directe toepassing zonder menselijke tussenkomst — alleen toegestaan bij minimaal-risico toepassingen.</p>"},
          {"id": "l3-callout1", "type": "callout", "variant": "yellow", "title": "Verificatie is jouw verantwoordelijkheid", "text": "AI maakt fouten — ook bij hoge zekerheidsscores. Controleer feitelijke claims, bereken formules zelf na, en verifieer namen en datums. Gebruik AI als startpunt, niet als eindproduct."},
          {"id": "l3-kt1", "type": "key_takeaways", "items": ["Menselijk toezicht is wettelijk verplicht bij hoog-risico AI (Art. 14)", "Drie niveaus: strikt HITL, toezicht met alertheid, geautomatiseerd", "Fouten in AI-output zijn jouw verantwoordelijkheid als gebruiker — controleer altijd"]},
          {"id": "l3-q1", "type": "quiz_mc", "question": "Je gebruikt AI om een financieel rapport te analyseren voor een klant. Welk toezichtsniveau is vereist?", "options": [{"id": "a", "text": "Geautomatiseerd — AI is nauwkeurig genoeg", "isCorrect": false}, {"id": "b", "text": "Strikt HITL — elk resultaat controleren vóór gebruik", "isCorrect": true}, {"id": "c", "text": "Geen toezicht nodig bij betrouwbare AI", "isCorrect": false}], "explanation": "Bij beslissingen die klanten beïnvloeden is strikt menselijk toezicht vereist. AI-fouten in financiële analyses kunnen aanzienlijke schade veroorzaken."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 5. Les 4 — Privacy en AI
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_4,
    'Privacy en AI',
    'AVG-verplichtingen bij AI-gebruik met persoonsgegevens.',
    'course_module',
    10,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t4-privacy-ai",
        "title": "Privacy en AI",
        "order": 0,
        "blocks": [
          {"id": "l4-hero", "type": "hero", "title": "Privacy en AI", "subtitle": "AVG-verplichtingen bij AI-gebruik met persoonsgegevens"},
          {"id": "l4-p1", "type": "paragraph", "html": "<p>Wanneer AI persoonsgegevens verwerkt, gelden de AVG-regels volledig. Dit omvat namen, e-mailadressen, functietitels en zakelijke contactgegevens. Voor bijzondere persoonsgegevens (medische data, biometrische gegevens, financiële kwetsbaarheid, strafrechtelijke gegevens) gelden aanvullende, strengere eisen.</p>"},
          {"id": "l4-p2", "type": "paragraph", "html": "<p>Voer nooit klantdata, medewerkersdossiers of medische informatie in bij publieke AI-diensten tenzij de organisatie een verwerkersovereenkomst (DPA) met de provider heeft. Controleer of de tool data opslaat voor modeltraining — dit is standaard bij veel gratis tools.</p>"},
          {"id": "l4-callout1", "type": "callout", "variant": "red", "title": "Nooit invoeren zonder DPA", "text": "Persoonsgegevens in ChatGPT, Claude of andere publieke AI-tools invoeren zonder verwerkersovereenkomst is een AVG-overtreding. Gebruik bij twijfel alleen anonieme of geanonimiseerde data."},
          {"id": "l4-kt1", "type": "key_takeaways", "items": ["AVG geldt volledig bij AI-verwerking van persoonsgegevens", "Bijzondere persoonsgegevens (Art. 9 AVG) vereisen expliciete grondslag en verhoogde bescherming", "Controleer altijd of een verwerkersovereenkomst bestaat vóór je data invoert"]},
          {"id": "l4-q1", "type": "quiz_mc", "question": "Een collega wil sollicitantgegevens invoeren in ChatGPT voor snellere CV-analyse. Wat doe je?", "options": [{"id": "a", "text": "Prima — ChatGPT is betrouwbaar", "isCorrect": false}, {"id": "b", "text": "Alleen als er een getekende verwerkersovereenkomst is met OpenAI", "isCorrect": true}, {"id": "c", "text": "Mag altijd als de data geanonimiseerd is", "isCorrect": false}], "explanation": "Persoonsgegevens mogen alleen worden ingevoerd in AI-tools waarmee een verwerkersovereenkomst bestaat. OpenAI''s standaard gebruiksvoorwaarden voldoen hier niet automatisch aan."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 6. Les 5 — EU AI Act verplichtingen
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_5,
    'EU AI Act: jouw verplichtingen',
    'Wat de wet van jou verwacht als AI-gebruiker.',
    'course_module',
    12,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t5-eu-ai-act-verplichtingen",
        "title": "EU AI Act: jouw verplichtingen",
        "order": 0,
        "blocks": [
          {"id": "l5-hero", "type": "hero", "title": "EU AI Act: jouw verplichtingen", "subtitle": "Wat de wet van jou verwacht als AI-gebruiker"},
          {"id": "l5-p1", "type": "paragraph", "html": "<p>De EU AI Act is de eerste uitgebreide AI-wet ter wereld en geldt per augustus 2026 volledig. Als medewerker die AI inzet (deployer) heb je verplichtingen die voortvloeien uit de deployer-rol. De belangrijkste: <strong>AI-geletterdheid</strong> (Art. 4), <strong>transparantie</strong> naar eindgebruikers (Art. 50), en <strong>menselijk toezicht</strong> (Art. 14).</p>"},
          {"id": "l5-p2", "type": "paragraph", "html": "<p>AI-geletterdheid (Art. 4) is van kracht per 2 februari 2025. Organisaties moeten aantoonbaar maken dat medewerkers die met AI werken voldoende training hebben gevolgd. Dit is de wettelijke basis voor de cursus die je nu volgt en voor het AI-rijbewijs dat je na het examen ontvangt.</p>"},
          {"id": "l5-callout1", "type": "callout", "variant": "blue", "title": "Deployer vs. provider — wie is verantwoordelijk?", "text": "De provider (OpenAI, Google) is verantwoordelijk voor het AI-systeem. De deployer (jouw organisatie) is verantwoordelijk voor correct gebruik: juiste toepassing, training van medewerkers, menselijk toezicht, en melding van incidenten."},
          {"id": "l5-kt1", "type": "key_takeaways", "items": ["AI-geletterdheidsplicht (Art. 4) geldt al per 2 februari 2025", "Als deployer ben je verantwoordelijk voor correct gebruik van AI", "Transparantie naar externen is verplicht bij chatbots en AI-gegenereerde communicatie (Art. 50)"]},
          {"id": "l5-q1", "type": "quiz_mc", "question": "Vanaf wanneer geldt de AI-geletterdheidsplicht (Art. 4) van de EU AI Act?", "options": [{"id": "a", "text": "Augustus 2026 — dan gaat de wet pas in", "isCorrect": false}, {"id": "b", "text": "2 februari 2025 — al van kracht", "isCorrect": true}, {"id": "c", "text": "Pas na publicatie van technische standaarden", "isCorrect": false}], "explanation": "De AI-geletterdheidsplicht (Art. 4) is het eerste onderdeel van de EU AI Act dat van kracht is gegaan, per 2 februari 2025."},
          {"id": "l5-q2", "type": "quiz_tf", "question": "Als een medewerker een AI-tool fout gebruikt, is alleen de leverancier aansprakelijk.", "correctAnswer": false, "explanation": "Als deployer is de organisatie medeverantwoordelijk voor correct gebruik inclusief training en toezicht."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 7. Les 6 — RouteAI: het governance-systeem
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_6,
    'RouteAI: hoe het werkt',
    'Survey → route → instructies → Passport.',
    'course_module',
    12,
    true,
    null,
    '{
      "version": 2,
      "topics": [{
        "id": "t6-routeai-systeem",
        "title": "RouteAI: hoe het werkt",
        "order": 0,
        "blocks": [
          {"id": "l6-hero", "type": "hero", "title": "RouteAI: hoe het werkt", "subtitle": "Survey → route → instructies → Passport"},
          {"id": "l6-p1", "type": "paragraph", "html": "<p>RouteAI helpt jou en je organisatie om AI-gebruik te registreren, beoordelen en verantwoorden. Het systeem werkt via vier routes: <strong>Groen</strong> (vrij gebruik), <strong>Geel</strong> (transparantieplicht), <strong>Oranje</strong> (DPO-goedkeuring vereist) en <strong>Rood</strong> (geblokkeerd). De route wordt bepaald door een korte survey van 5–6 vragen over de specifieke toepassing.</p>"},
          {"id": "l6-p2", "type": "paragraph", "html": "<p>Een assessment aanmaken doe je via ''AI Check starten''. Je beschrijft de tool en het gebruik, en RouteAI bepaalt de route deterministisch op basis van de EU AI Act. Bij Oranje ontvangt je DPO automatisch een melding. Het resultaat wordt vastgelegd in het Accountability Passport — de documentatie die bij een audit getoond kan worden.</p>"},
          {"id": "l6-callout1", "type": "callout", "variant": "blue", "title": "Het Accountability Passport", "text": "Het Passport bevat een register van alle AI-assessments, tool-gebruik, en leeractiviteiten van je organisatie. Auditors en toezichthouders kunnen hiermee aantonen dat jouw organisatie AI verantwoord inzet."},
          {"id": "l6-callout2", "type": "callout", "variant": "yellow", "title": "Incidenten melden is goed gedrag", "text": "Als iets misgaat met AI — ongewenst resultaat, datalek, ongepaste uitvoer — meld dit direct via het incidentformulier. Melden is geen aanklacht maar een governance-actie die helpt de organisatie te beschermen."},
          {"id": "l6-kt1", "type": "key_takeaways", "items": ["RouteAI bepaalt de route via 5–6 vragen over de specifieke AI-toepassing", "Vier routes: Groen, Geel, Oranje (DPO-melding), Rood (geblokkeerd)", "Alle assessments worden vastgelegd in het Accountability Passport voor audit-doeleinden"]},
          {"id": "l6-q1", "type": "quiz_mc", "question": "Je wilt een nieuwe AI-tool inzetten voor klantcommunicatie. Wat is je eerste stap in RouteAI?", "options": [{"id": "a", "text": "De tool direct gebruiken en achteraf melden", "isCorrect": false}, {"id": "b", "text": "Een AI Check (assessment) aanmaken voor deze specifieke toepassing", "isCorrect": true}, {"id": "c", "text": "Toestemming vragen aan de IT-afdeling", "isCorrect": false}], "explanation": "Elke nieuwe AI-toepassing vereist een assessment via de AI Check. Dit registreert het gebruik en bepaalt de route."},
          {"id": "l6-q2", "type": "quiz_mc", "question": "Wie heeft schrijftoegang tot het rijbewijs-veld in het Accountability Passport?", "options": [{"id": "a", "text": "De medewerker zelf", "isCorrect": false}, {"id": "b", "text": "De org_admin", "isCorrect": false}, {"id": "c", "text": "Niemand — het systeem schrijft automatisch bij slagen (SYSTEM_ONLY)", "isCorrect": true}], "explanation": "Het AI-rijbewijs-veld is SYSTEM_ONLY: alleen het systeem kan dit veld bijwerken bij het succesvol afleggen van het examen."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 8. Les 7 — Examen (15 vragen)
  INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, is_published, passing_score, blocks)
  VALUES (
    v_lesson_7,
    'AI-rijbewijs Examen',
    'Toets je kennis over AI, de EU AI Act en verantwoord gebruik. Slagingsgrens: 80%.',
    'ai_literacy_exam',
    15,
    true,
    80,
    '{
      "version": 2,
      "topics": [{
        "id": "t7-examen",
        "title": "AI-rijbewijs Examen",
        "order": 0,
        "blocks": [
          {"id": "ex-q1", "type": "quiz_mc", "question": "Welk type AI produceert nieuwe inhoud zoals tekst en beelden?", "options": [{"id": "a", "text": "Rule-based systeem", "isCorrect": false}, {"id": "b", "text": "Generatieve AI (GPAI)", "isCorrect": true}, {"id": "c", "text": "Een beslissingsboom", "isCorrect": false}], "explanation": "Generatieve AI zoals GPT-4 of Claude produceert nieuwe inhoud op basis van patronen in trainingsdata."},
          {"id": "ex-q2", "type": "quiz_tf", "question": "AI heeft bewustzijn en begrijpt de inhoud die het produceert.", "correctAnswer": false, "explanation": "AI maakt statistische voorspellingen op basis van trainingsdata — er is geen begrip of bewustzijn."},
          {"id": "ex-q3", "type": "quiz_mc", "question": "Welke risicoklasse heeft CV-screening met AI?", "options": [{"id": "a", "text": "Minimaal risico", "isCorrect": false}, {"id": "b", "text": "Hoog risico (Annex III)", "isCorrect": true}, {"id": "c", "text": "Beperkt risico", "isCorrect": false}], "explanation": "Annex III noemt personeelsselectie expliciet als hoog-risico toepassing."},
          {"id": "ex-q4", "type": "quiz_mc", "question": "Welke AI-toepassing is volledig verboden onder Art. 5 EU AI Act?", "options": [{"id": "a", "text": "Chatbot voor klantenservice", "isCorrect": false}, {"id": "b", "text": "Social scoring door overheidsinstanties", "isCorrect": true}, {"id": "c", "text": "Aanbevelingssysteem voor producten", "isCorrect": false}], "explanation": "Social scoring door overheden is een van de verboden praktijken in Art. 5."},
          {"id": "ex-q5", "type": "quiz_tf", "question": "Bij beperkt-risico AI geldt uitsluitend een transparantieverplichting.", "correctAnswer": true, "explanation": "Beperkt-risico AI (bv. chatbots) vereist transparantie naar eindgebruikers dat ze met AI communiceren — geen DPIA."},
          {"id": "ex-q6", "type": "quiz_mc", "question": "Wat betekent strikt Human-in-the-Loop (HITL)?", "options": [{"id": "a", "text": "De mens controleert output steekproefsgewijs", "isCorrect": false}, {"id": "b", "text": "Elk resultaat wordt door een mens gecontroleerd vóór gebruik", "isCorrect": true}, {"id": "c", "text": "Er is geen menselijke betrokkenheid", "isCorrect": false}], "explanation": "Strikt HITL vereist menselijke controle van elk individueel resultaat."},
          {"id": "ex-q7", "type": "quiz_mc", "question": "Een AI genereert een medisch advies. Welk toezichtsniveau is vereist?", "options": [{"id": "a", "text": "Geautomatiseerd — AI is nauwkeurig", "isCorrect": false}, {"id": "b", "text": "Strikt HITL — altijd menselijke controle", "isCorrect": true}, {"id": "c", "text": "Alertheid is voldoende", "isCorrect": false}], "explanation": "Medische beslissingen vereisen altijd strikt menselijk toezicht vanwege hoog-risico classificatie."},
          {"id": "ex-q8", "type": "quiz_tf", "question": "AI-output is altijd betrouwbaar genoeg om direct te gebruiken zonder verificatie.", "correctAnswer": false, "explanation": "AI maakt fouten — ook bij hoge zekerheidsscores. Verificatie is altijd vereist."},
          {"id": "ex-q9", "type": "quiz_mc", "question": "Je wilt klantgegevens verwerken met een externe AI-tool. Wat is een vereiste?", "options": [{"id": "a", "text": "Toestemming van de IT-afdeling", "isCorrect": false}, {"id": "b", "text": "Een verwerkersovereenkomst (DPA) met de AI-provider", "isCorrect": true}, {"id": "c", "text": "Alleen technische beveiliging is voldoende", "isCorrect": false}], "explanation": "Verwerking van persoonsgegevens via externe tools vereist een getekende verwerkersovereenkomst."},
          {"id": "ex-q10", "type": "quiz_tf", "question": "Geanonimiseerde data mag altijd worden ingevoerd in publieke AI-tools.", "correctAnswer": false, "explanation": "Echte anonimisering is technisch moeilijk. Pseudonimisering beschermt de AVG-bescherming niet volledig. Controleer altijd de DPA."},
          {"id": "ex-q11", "type": "quiz_mc", "question": "Welke categorie vereist de hoogste bescherming bij AI-verwerking?", "options": [{"id": "a", "text": "Bedrijfsvertrouwelijke documenten", "isCorrect": false}, {"id": "b", "text": "Bijzondere persoonsgegevens (AVG Art. 9)", "isCorrect": true}, {"id": "c", "text": "Publieke informatie", "isCorrect": false}], "explanation": "Bijzondere persoonsgegevens (medisch, biometrisch, strafrechtelijk) vereisen expliciete grondslag en verhoogde bescherming."},
          {"id": "ex-q12", "type": "quiz_mc", "question": "Vanaf wanneer geldt de AI-geletterdheidsplicht (Art. 4 EU AI Act)?", "options": [{"id": "a", "text": "Augustus 2026", "isCorrect": false}, {"id": "b", "text": "2 februari 2025", "isCorrect": true}, {"id": "c", "text": "Pas bij nationale implementatie", "isCorrect": false}], "explanation": "Art. 4 is het eerste onderdeel van de EU AI Act dat in werking is getreden, per 2 februari 2025."},
          {"id": "ex-q13", "type": "quiz_tf", "question": "Als deployer is de organisatie medeverantwoordelijk voor correct AI-gebruik.", "correctAnswer": true, "explanation": "De deployer (gebruikende organisatie) is verantwoordelijk voor juiste toepassing, training en toezicht."},
          {"id": "ex-q14", "type": "quiz_mc", "question": "Wat is de functie van het Accountability Passport in RouteAI?", "options": [{"id": "a", "text": "Persoonlijke portfolio van vaardigheden", "isCorrect": false}, {"id": "b", "text": "Organisatie-breed register van AI-assessments voor audit-doeleinden", "isCorrect": true}, {"id": "c", "text": "Dashboard voor DPO-meldingen", "isCorrect": false}], "explanation": "Het Passport documenteert alle assessments, tools en leeractiviteiten voor auditoren en toezichthouders."},
          {"id": "ex-q15", "type": "quiz_mc", "question": "Wanneer maak je een assessment aan in RouteAI?", "options": [{"id": "a", "text": "Alleen bij hoog-risico toepassingen", "isCorrect": false}, {"id": "b", "text": "Bij elke nieuwe AI-toepassing die je wilt inzetten", "isCorrect": true}, {"id": "c", "text": "Jaarlijks als overzicht", "isCorrect": false}], "explanation": "Elke nieuwe AI-toepassing (tool + use-case combinatie) vereist een assessment."}
        ]
      }]
    }'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 9. Course-lessons koppeltabel
  INSERT INTO public.course_lessons (id, course_id, lesson_id, sequence_order, is_required) VALUES
    ('f1c00000-0000-0000-0000-000000000001', v_course_id, v_lesson_1, 1, true),
    ('f1c00000-0000-0000-0000-000000000002', v_course_id, v_lesson_2, 2, true),
    ('f1c00000-0000-0000-0000-000000000003', v_course_id, v_lesson_3, 3, true),
    ('f1c00000-0000-0000-0000-000000000004', v_course_id, v_lesson_4, 4, true),
    ('f1c00000-0000-0000-0000-000000000005', v_course_id, v_lesson_5, 5, true),
    ('f1c00000-0000-0000-0000-000000000006', v_course_id, v_lesson_6, 6, true),
    ('f1c00000-0000-0000-0000-000000000007', v_course_id, v_lesson_7, 7, true)
  ON CONFLICT (id) DO NOTHING;

END $$;

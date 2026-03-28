
-- 1. Create archetype_ml_map table
CREATE TABLE IF NOT EXISTS public.archetype_ml_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_code text NOT NULL,
  library_item_id uuid NOT NULL REFERENCES public.learning_library(id) ON DELETE CASCADE,
  context_card_text text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (archetype_code, library_item_id)
);

ALTER TABLE public.archetype_ml_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_archetype_ml_map"
  ON public.archetype_ml_map FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "content_editor_manage_archetype_ml_map"
  ON public.archetype_ml_map FOR ALL TO authenticated
  USING (is_content_editor(auth.uid()))
  WITH CHECK (is_content_editor(auth.uid()));

CREATE POLICY "authenticated_read_active_archetype_ml_map"
  ON public.archetype_ml_map FOR SELECT TO authenticated
  USING (is_active = true);

-- 2. Insert three lessons
INSERT INTO public.lessons (id, title, description, lesson_type, estimated_duration, passing_score, is_published, blocks)
VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'ML-O01: Verification Gatekeeper',
  'CL-1 gedragspatroon — controleer AI-oordelen vóór je handelt',
  'standalone', 8, null, true,
  '[
    {"type":"hero","version":2,"topic":"Verification Gatekeeper","title":"ML-O01: Verification Gatekeeper","subtitle":"CL-1 gedragspatroon — controleer AI-oordelen vóór je handelt"},
    {"type":"paragraph","version":2,"topic":"Verification Gatekeeper","html":"<p>Deze module geldt voor alle toepassingen waarbij AI mensen beoordeelt, rankt of van een score voorziet. Denk aan CV-screening, prestatiebeoordeling, studentbeoordeling of kredietwaardigheidsanalyse. Gemeenschappelijk kenmerk: een AI-uitkomst vormt de basis voor een beslissing die iemands kansen of positie beïnvloedt.</p><p>Het CL-1 gedragspatroon vereist één kernhandeling: <strong>verifieer elk AI-oordeel voordat het gevolgen heeft</strong>. Dit is geen aanbeveling — het is een wettelijke vereiste onder EU AI Act Art. 14 (Human Oversight).</p>"},
    {"type":"callout","version":2,"topic":"Verification Gatekeeper","variant":"yellow","title":"Waarom is verificatie verplicht?","text":"AI-modellen reproduceren patronen uit trainingsdata. Als die data historische bias bevat — bv. over geslacht, afkomst of leeftijd — produceert het model systematisch bevooroordeelde uitkomsten. Menselijke controle is het enige mechanisme dat dit kan corrigeren."},
    {"type":"paragraph","version":2,"topic":"Verification Gatekeeper","html":"<p><strong>Scenario:</strong> Een AI-tool screent 80 sollicitanten en geeft elk een score van 1–10. De top 20 worden uitgenodigd voor een gesprek.</p><p><strong>Wat de Verification Gatekeeper doet:</strong> De scores worden niet klakkeloos overgenomen. Per kandidaat controleert de beoordelaar (1) of de score aansluit bij de daadwerkelijke kwalificaties, (2) of de afwijzing van een lager gescoorde kandidaat verdedigbaar is bij navraag, en (3) of er demografische patronen zichtbaar zijn in de afwijzingen.</p>"},
    {"type":"key_takeaways","version":2,"topic":"Verification Gatekeeper","items":["Controleer elk AI-oordeel individueel vóór het een beslissing beïnvloedt","Documenteer je verificatie: noteer afwijkingen van de AI-score én je reden","Signaleer herhalende afwijkingen — dit kan een systeem-bias indicatie zijn","Bij twijfel: de mens beslist, niet het systeem"]},
    {"type":"quiz_mc","version":2,"topic":"Verification Gatekeeper","question":"Een AI-screeningstool geeft kandidaat A een score van 3/10 en kandidaat B een 8/10. Wat doe je als Verification Gatekeeper?","options":[{"id":"a","text":"Nodig B uit en wijs A af op basis van de scores","isCorrect":false},{"id":"b","text":"Controleer voor beide kandidaten of de score aansluit bij hun kwalificaties vóór je besluit","isCorrect":true},{"id":"c","text":"Gebruik de AI-score als startpunt maar corrigeer alleen bij evidente fouten","isCorrect":false}],"explanation":"Elk AI-oordeel vereist individuele verificatie. ''Evidente fouten'' is een te hoge drempel — subtiele bias is per definitie niet meteen evident."},
    {"type":"callout","version":2,"topic":"Verification Gatekeeper","variant":"blue","title":"Jouw verificatie is de governance-actie","text":"Het feit dat jij dit controlemoment serieus neemt, is wat Art. 14 vereist. Documenteer je verificatie in het systeem — dit is de audit-trail die bij een toezichtsonderzoek het verschil maakt."}
  ]'::jsonb
),
(
  'a1000000-0000-0000-0000-000000000002',
  'ML-O02: Decision Preparation Gatekeeper',
  'CL-1 gedragspatroon voor beslissingsondersteuning — jij beslist, AI bereidt voor',
  'standalone', 8, null, true,
  '[
    {"type":"hero","version":2,"topic":"Decision Preparation Gatekeeper","title":"ML-O02: Decision Preparation Gatekeeper","subtitle":"CL-1 gedragspatroon voor beslissingsondersteuning — jij beslist, AI bereidt voor"},
    {"type":"paragraph","version":2,"topic":"Decision Preparation Gatekeeper","html":"<p>Deze module geldt voor toepassingen waarbij AI een analyse, aanbeveling of risicobeoordeling levert als voorbereiding op een beslissing die mensen direct beïnvloedt. Denk aan kredietbeoordeling, juridisch advies, medische risicoanalyse of HR-beslissingen over functiewijzigingen en beloningen.</p><p>Het onderscheid met ML-O01 (Verification Gatekeeper) is subtiel maar essentieel: bij ML-O02 neemt AI niet zelf een oordeel over een persoon, maar bereidt het een menselijke beslissing voor. De menselijke beslisser draagt volledige verantwoordelijkheid — ook voor de kwaliteit van de AI-invoer die die beslissing voedde.</p>"},
    {"type":"callout","version":2,"topic":"Decision Preparation Gatekeeper","variant":"yellow","title":"De AI is de voorbereiding — jij bent de beslissing","text":"Als een kredietbeslissing wordt aangevochten, telt alleen jouw beslissing en jouw onderbouwing mee voor de rechter. De AI-analyse die je gebruikte is relevant als context — maar ontslaat je niet van de verantwoordelijkheid om die analyse kritisch te toetsen."},
    {"type":"paragraph","version":2,"topic":"Decision Preparation Gatekeeper","html":"<p><strong>Scenario:</strong> Een AI-systeem analyseert financiële data van een klant en geeft een aanbeveling: ''hoog risico — krediet niet toekennen''. De kredietbeoordelaar gebruikt dit als input voor de beslissing.</p><p><strong>Wat de Decision Preparation Gatekeeper doet:</strong> (1) Vraagt welke factoren het zwaarst wogen in de AI-aanbeveling. (2) Controleert of die factoren fair en relevant zijn voor déze klant in déze context. (3) Beoordeelt of er informatie beschikbaar is die de AI niet had (recente inkomenswijziging, persoonlijke context). (4) Neemt de definitieve beslissing met eigen redenering — niet als bevestiging van de AI maar als zelfstandige beoordeling.</p>"},
    {"type":"key_takeaways","version":2,"topic":"Decision Preparation Gatekeeper","items":["Vraag jezelf bij elke AI-aanbeveling: welke factoren wogen zwaar — zijn die fair en relevant?","Voeg informatie toe die de AI niet had: context, recente wijzigingen, persoonlijke omstandigheden","De definitieve beslissing is altijd van jou — niet een bekrachtiging van de AI","Documenteer je eigen redenering, niet alleen de AI-output"]},
    {"type":"quiz_mc","version":2,"topic":"Decision Preparation Gatekeeper","question":"Een AI-analyse adviseert ''krediet niet toekennen''. De klant meldt echter een recente salarisverhoging die de AI niet meewoog. Wat doe je?","options":[{"id":"a","text":"Volg de AI-aanbeveling — die is gebaseerd op meer data dan jij hebt","isCorrect":false},{"id":"b","text":"Weeg de nieuwe informatie mee in je eigen beoordeling en neem een gemotiveerde beslissing","isCorrect":true},{"id":"c","text":"Vraag een second opinion aan een collega zonder de AI-analyse te noemen","isCorrect":false}],"explanation":"De AI-aanbeveling is een startpunt. Als relevante nieuwe informatie beschikbaar is die de AI niet had, is het jouw verantwoordelijkheid die mee te wegen. De beslissing — inclusief motivatie — is altijd van jou."}
  ]'::jsonb
),
(
  'a1000000-0000-0000-0000-000000000003',
  'ML-O03: Risk Monitor & Escalator',
  'CL-2 gedragspatroon — detecteer afwijkingen en escaleer vóór schade zich verspreidt',
  'standalone', 8, null, true,
  '[
    {"type":"hero","version":2,"topic":"Risk Monitor & Escalator","title":"ML-O03: Risk Monitor & Escalator","subtitle":"CL-2 gedragspatroon — detecteer afwijkingen en escaleer vóór schade zich verspreidt"},
    {"type":"paragraph","version":2,"topic":"Risk Monitor & Escalator","html":"<p>Deze module geldt voor autonome AI-systemen die zelfstandig acties uitvoeren: agents die e-mails versturen, systemen die processen triggeren, of werkstromen die zonder menselijke tussenkomst doorgaan. Het onderscheid met evaluatieve toepassingen is cruciaal: bij autonome systemen is de schade vaak al aangericht vóór iemand het opmerkt.</p><p>Het CL-2 gedragspatroon vereist actieve monitoring, niet passief toezicht. Wacht niet tot een klacht binnenkomt — stel drempelwaarden in, observeer actief, en escaleer bij twijfel eerder dan later.</p>"},
    {"type":"callout","version":2,"topic":"Risk Monitor & Escalator","variant":"red","title":"Autonome systemen handelen sneller dan je kan bijsturen","text":"Een autonome agent die per minuut tien klantberichten verstuurt, kan in één uur honderd foutieve berichten hebben verstuurd. Monitoring-drempelwaarden zijn geen luxe — ze zijn het enige mechanisme dat schaalbaarschade voorkomt."},
    {"type":"paragraph","version":2,"topic":"Risk Monitor & Escalator","html":"<p><strong>Scenario:</strong> Een AI-agent is geconfigureerd om automatisch antwoorden te sturen op klantvragen. Normaal verwerkt het systeem 50 berichten per dag. Op dag 3 piekt het naar 400 berichten.</p><p><strong>Wat de Risk Monitor & Escalator doet:</strong> (1) De piek triggert een alert — dit valt buiten de ingestelde drempelwaarde. (2) De monitor controleert een steekproef van 10 berichten: zijn ze correct, relevant, en niet schadelijk? (3) Bij twijfel: systeem pauzeren, niet wachten op meer data. (4) Incident melden via het incidentformulier — ook als het vals alarm blijkt. Niet melden is nooit de juiste keuze.</p>"},
    {"type":"key_takeaways","version":2,"topic":"Risk Monitor & Escalator","items":["Stel expliciete drempelwaarden in: volume, frequentie, type acties — alles buiten drempel triggert verificatie","Monitor actief: wacht niet op klachten maar observeer het systeem proactief","Escaleer vroeg: bij twijfel pauzeer het systeem — de kosten van een vals alarm zijn lager dan de kosten van gemiste schade","Meld incidenten altijd — ook als het vals alarm was. Niet melden schaadt het leerproces van de organisatie"]},
    {"type":"quiz_mc","version":2,"topic":"Risk Monitor & Escalator","question":"Een autonome e-mail-agent verwerkt normaal 30 berichten per uur. Vandaag verwerkt het er 200 in het eerste uur. Wat doe je?","options":[{"id":"a","text":"Wacht af of er klachten binnenkomen — meer berichten is mogelijk gewoon drukte","isCorrect":false},{"id":"b","text":"Pauzeer het systeem, controleer een steekproef en meld het incident","isCorrect":true},{"id":"c","text":"Vraag de beheerder of hij de instelling heeft gewijzigd voordat je actie onderneemt","isCorrect":false}],"explanation":"Een afwijking van 570% is een signaal dat onmiddellijke verificatie vereist. Pauzeer eerst, analyseer dan. Wachten op klachten is CL-2 gedragsfout — dan is de schade al verspreid."}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert learning_library entries
INSERT INTO public.learning_library (
  id, content_type, title, description, status, version,
  cluster_id, archetype_codes, is_activation_req, context_card, lesson_id
) VALUES
(
  'a2000000-0000-0000-0000-000000000001',
  'microlearning',
  'ML-O01: Verification Gatekeeper',
  'CL-1 module voor evaluatieve toepassingen: CV-screening, prestatiebeoordeling, studentbeoordeling.',
  'published', '1.0', 'CL-1',
  ARRAY['O-01'],
  true,
  'Controleer elk AI-oordeel over een persoon individueel vóór het een beslissing beïnvloedt. Documenteer afwijkingen.',
  'a1000000-0000-0000-0000-000000000001'
),
(
  'a2000000-0000-0000-0000-000000000002',
  'microlearning',
  'ML-O02: Decision Preparation Gatekeeper',
  'CL-1 module voor beslissingsondersteunende toepassingen: krediet, juridisch advies, HR-beslissingen.',
  'published', '1.0', 'CL-1',
  ARRAY['O-02'],
  true,
  'De AI bereidt de beslissing voor — jij beslist. Weeg informatie mee die de AI niet had en documenteer je eigen redenering.',
  'a1000000-0000-0000-0000-000000000002'
),
(
  'a2000000-0000-0000-0000-000000000003',
  'microlearning',
  'ML-O03: Risk Monitor & Escalator',
  'CL-2 module voor autonome systemen: agents, automated workflows, directe communicatie.',
  'published', '1.0', 'CL-2',
  ARRAY['O-03'],
  true,
  'Stel drempelwaarden in en monitor actief. Escaleer bij afwijkingen voordat schade zich verspreidt.',
  'a1000000-0000-0000-0000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert archetype_ml_map entries
INSERT INTO public.archetype_ml_map (
  id, archetype_code, library_item_id, context_card_text, is_active
) VALUES
(
  'a3000000-0000-0000-0000-000000000001',
  'O-01',
  'a2000000-0000-0000-0000-000000000001',
  'Deze toepassing beoordeelt of rankt mensen of hun output. Het vereiste gedrag: verifieer elk AI-oordeel handmatig vóór een beslissing wordt genomen of gecommuniceerd. Documenteer je verificatie.',
  true
),
(
  'a3000000-0000-0000-0000-000000000002',
  'O-02',
  'a2000000-0000-0000-0000-000000000002',
  'Deze toepassing bereidt beslissingen voor die mensen direct beïnvloeden. Jouw rol: verifieer de AI-analyse, voeg context toe die de AI niet had, en neem de definitieve beslissing zelf met eigen motivatie.',
  true
),
(
  'a3000000-0000-0000-0000-000000000003',
  'O-03',
  'a2000000-0000-0000-0000-000000000003',
  'Deze toepassing handelt zelfstandig namens de organisatie. Stel drempelwaarden in voor volume en frequentie, monitor actief op afwijkingen, en pauzeer bij twijfel — eerder dan later.',
  true
)
ON CONFLICT (id) DO NOTHING;

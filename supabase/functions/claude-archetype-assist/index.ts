import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ARCHETYPE_LIST = `
G-01: Tekst genereren (e-mails, rapporten, samenvattingen)
G-02: Tekst herschrijven of redigeren
G-03: Creatieve ideegeneratie (brainstorm, slogans)
G-04: Informatiezoekopdracht in eigen documenten (RAG/kennisbank)
Y-01: Klantgerichte communicatie met AI-vermelding vereist (Art. 50)
Y-02: Vertaling van teksten
Y-03: Data-analyse, statistieken, patroonherkenning
O-01: Evaluatie of ranking van mensen (personeelsselectie, prestatiebeoordeling)
O-02: Beslissingsondersteuning met impact op personen (financieel, juridisch, HR)
O-03: Autonoom handelend systeem (agents, automated workflows, directe communicatie)
R-01: Verboden praktijk of technische modificatie die wettelijke review vereist
`;

const SYSTEM_PROMPT = `Je bent de RouteAI risk engine reasoning layer voor edge cases.
Een medewerker heeft een AI-toepassing beschreven via vrije tekst. Het deterministische systeem kon geen archetype bepalen.

Jouw taak: bepaal het meest passende archetype en de route.

REGELS:
- Kies uitsluitend uit de archetypes in de lijst hieronder
- Escaleer alleen omhoog — als de deterministische route al O-xx is, mag je niet afschalen naar G-xx of Y-xx
- Bij twijfel: kies het zwaardere archetype
- Output ALLEEN JSON, geen extra tekst, geen markdown

PII-FILTERING (verplicht):
Schrijf in het reason_filtered veld uitsluitend een functionele beschrijving van de use case.
Verwijder alle namen, e-mailadressen, bedrijfsnamen, telefoonnummers en andere identificeerbare informatie.
Vervang door: [persoonsnaam], [bedrijfsnaam], [afdeling].
Het reason_filtered veld beschrijft de use case, niet de specifieke context.
Maximaal 40 woorden.

ARCHETYPES:
${ARCHETYPE_LIST}

OUTPUT FORMAT (exact):
{"archetype":"G-01","route":"green","reason_filtered":"<max 40 woorden, PII-vrij>"}

Routes: "green" | "yellow" | "orange" | "red"`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { tool_name_raw, v2_freetext, deterministic_route } = await req.json();

    if (!tool_name_raw || !v2_freetext || !deterministic_route) {
      return new Response(JSON.stringify({ error: 'missing_fields' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `Tool: ${tool_name_raw}
Beschrijving medewerker: ${v2_freetext}
Deterministische route: ${deterministic_route}

Bepaal het archetype en de route.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '{}';

    // Verwijder mogelijke markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validatie: escaleer alleen omhoog
    const ROUTE_LEVEL: Record<string, number> = { green: 0, yellow: 1, orange: 2, red: 3 };
    const detLevel = ROUTE_LEVEL[deterministic_route] ?? 0;
    const claudeLevel = ROUTE_LEVEL[parsed.route] ?? 0;
    const finalRoute = claudeLevel >= detLevel ? parsed.route : deterministic_route;

    return new Response(JSON.stringify({
      archetype: parsed.archetype ?? null,
      route: finalRoute,
      reason_filtered: (parsed.reason_filtered ?? '').slice(0, 300),
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('claude-archetype-assist error:', err);
    // Timeout of parse-fout → signaal voor frontend om pending_review te gebruiken
    return new Response(JSON.stringify({ error: 'timeout_or_parse', archetype: null, route: null }), {
      status: 200, // Bewust 200 — frontend bepaalt wat te doen
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

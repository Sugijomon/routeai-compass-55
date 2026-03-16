# CLAUDE.md

> Lees dit volledig voordat je iets doet. Sla geen stap over.

---

## Wie ik ben

Rink Weijs — oprichter van **Digidactics** (Nederland, Zeeland-regio). Achtergrond: Industrial Ecology (TU Delft), organisatieontwikkeling, AI-governance, educatie. Co-auteur van *Homo Zappiens*. Voormalig sabbatical in China voor full-time AI-studie.

Werkt op het snijvlak van AI-governance, EU AI Act-compliance en het opbouwen van AI-vaardigheden in MKB-organisaties. Vertaalt complexe technologische en regulatoire vraagstukken naar concrete instrumenten.

---

## Producten

### RouteAI

AI-governance en EU AI Act-compliance platform voor Nederlands MKB (25–250 mwk).

- Kernmetafoor: **rijbewijs-model** — capability-based compliance, geen checkbox-oefening
- Doelgroep: DPO's en compliance consultants als acquisitiekanaal, MKB als eindklant
- Stack: React 18 / TypeScript / Supabase / Lovable.dev
- Status: MVP-build (gestart maart 2026), go-to-market target augustus 2026

**Lees `00_CONTEXT.md` voor volledige projectdetails, MVP-scope en technische constraints.**

### AISA — AI Skills Accelerator

Trainingsprogramma voor AI-vaardigheden in MKB-context. Van AI-literacy naar AI-proficiency. Zelfstandig product, geen technische koppeling met RouteAI.

---

## Kritieke projectconstraint

Alle databaseoperaties gaan via Lovable-chat-prompts. Er is **geen directe toegang** tot het Supabase Dashboard of SQL Editor.

```
❌ "Voer dit SQL-script uit in Supabase"
✅ "Voeg tabel X toe met velden Y en Z"

❌ "Controleer de RLS-policies in het dashboard"
✅ "Wat zijn de huidige RLS-policies op de organizations-tabel?"
```

Verificatie van DB-wijzigingen: via frontend-queries of Lovable Preview-modus.

---

## Projectstructuur (Project Knowledge)

Bestanden zijn genummerd per categorie (boekhoudsysteem — decade-gaps voor invoegen zonder hernummering):

| Reeks | Categorie | Sleutelbestanden |
|---|---|---|
| 00–09 | Meta & Projectoverzicht | `00_CONTEXT.md` ← startpunt |
| 10–19 | Strategie | Shadow AI, game theory, partnerstrategie |
| 20–29 | Product & Roadmap | MVP scope, architectuur, implementatie |
| 30–39 | Risk Engine | Survey V1–V6, beslislogica, archetypen, EU AI Act |
| 40–49 | Platform & Techniek | Techstack, datamodel, navigatie, learning system |
| 50–59 | Oversight & Compliance | DPO-model, Accountability Passport |
| 90–99 | Sessielogboek | Sessiesamenvattingen per datum |

---

## Werkwijze

- **Modulair** — schrijf kleine, samengestelde eenheden: custom hooks voor logica, componenten voor UI, utilities voor hergebruik. Geen monolithische blokken.
- **Volledig** — geen samenvattingen tenzij expliciet gevraagd.
- **Nederlands** — ook code-comments, tenzij anders aangegeven.
- **Direct** — geen intro-zinnen als "Zeker!", "Goed idee!" of "Dat is een uitstekende vraag."
- **Structuur boven volledigheid** — liever een helder skelet dan een uitputtende brij.
- Bij onduidelijkheid: stel eerst één vraag, ga niet gokken.

---

## Tone of voice (content & communicatie)

| Dimensie | Score (1–10) |
|---|---|
| Formeel ↔ Informeel | 6 |
| Serieus ↔ Speels | 4 |
| Technisch ↔ Eenvoudig | 7 |
| Gereserveerd ↔ Expressief | 6 |
| Bescheiden ↔ Zelfverzekerd | 7 |

**Verboden woorden:** "innovatief", "baanbrekend", "revolutionair", "in de snel veranderende wereld van...", "oplossing" (als leeg containerbegrip), "synergie", "ecosysteem" (tenzij letterlijk bedoeld).

**Verboden structuren:** bullet-lijsten als vervanging voor een argument, conclusies die niet volgen uit wat ervoor staat, forced rule of three, zinnen die beginnen met "Als AI-taalmodel...".

---

## Wat je niet hoeft te doen

- Mijn achtergrond opnieuw uitleggen.
- Vragen of ik zeker weet wat ik wil — tenzij er een echte tegenstrijdigheid is.
- Ongevraagde opties aanbieden — tenzij één ervan duidelijk beter is.

---

*Laatste update: 2026-03-16*

/**
 * Shadow AI Scan V8.1 — Scherm 01: Intro
 *
 * Visueel gebaseerd op screen-01-intro.html (glassmorphism, Manrope/Inter,
 * Material Symbols). Roept createSurveyRun aan en geeft het resulterende
 * surveyRunId terug aan de parent via onStart.
 */

import { useState } from "react";
import { createSurveyRun } from "@/lib/shadowSurveyEngineV8";

interface Step01IntroProps {
  orgId: string;
  waveId?: string;
  waveClosesAt?: string;
  onStart: (surveyRunId: string) => void;
}

function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className ?? ""}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}

export function Step01Intro({ orgId, waveId, waveClosesAt, onStart }: Step01IntroProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const orgMissing = !orgId;

  const handleStart = async () => {
    if (isLoading || orgMissing) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const surveyRunId = await createSurveyRun(orgId, waveId);
      onStart(surveyRunId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Onbekende fout";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const formattedDeadline = waveClosesAt
    ? new Date(waveClosesAt).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background:
          "radial-gradient(ellipse at 10% 0%, #c4e7ff 0%, #f7fafc 55%), radial-gradient(ellipse at 90% 100%, #e5e9eb 0%, transparent 50%)",
      }}
    >
      {/* Decoratieve blobs */}
      <div
        className="pointer-events-none fixed -left-40 -top-40 h-[600px] w-[600px] rounded-full"
        style={{ background: "#7dd0ff", filter: "blur(80px)", opacity: 0.25 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed right-[-150px] top-1/3 h-[500px] w-[500px] rounded-full"
        style={{ background: "#bae6ff", filter: "blur(80px)", opacity: 0.25 }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#00658b" }}>
            <Icon name="shield_lock" style={{ fontSize: 32, color: "#fff" }} />
          </div>
          <div>
            <div
              className="text-2xl"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#181c1e", lineHeight: 1.1 }}
            >
              Shadow AI Scan
            </div>
            <div style={{ fontSize: 13, color: "#6993aa" }}>Veilig innoveren met AI</div>
          </div>
        </div>
        <div
          className="rounded-full bg-white px-3 py-1.5 text-xs"
          style={{ borderWidth: 1, borderStyle: "solid", borderColor: "rgba(191,199,207,0.4)", color: "#40484e" }}
        >
          Intern Onderzoek
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-16">
        {formattedDeadline && (
          <div
            className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs"
            style={{
              background: "#faf5e8",
              border: "1px solid #e5c687",
              color: "#ca8a04",
              fontWeight: 700,
            }}
          >
            <Icon name="timer" style={{ fontSize: 14 }} />
            <span>Scan is open t/m {formattedDeadline}</span>
          </div>
        )}

        <div className="mx-auto mb-10 max-w-3xl text-center pt-2">
          <h1
            className="mb-5 text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#00658b", lineHeight: 1.1 }}
          >
            Breng{" "}
            <span
              style={{
                background: "linear-gradient(to right, #00658b, #396379)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              jouw AI-gebruik
            </span>{" "}
            veilig in kaart
          </h1>

          <p className="mx-auto max-w-3xl text-base md:text-lg" style={{ color: "#40484e", lineHeight: 1.6 }}>
            AI-tools bieden enorme kansen, maar brengen ook vragen met zich mee over dataveiligheid.
            Met deze korte scan inventariseren we welke tools we binnen de organisatie gebruiken.
            Jouw input helpt ons om de juiste, veilige faciliteiten en licenties voor je te regelen.
          </p>
        </div>

        {/* Drie kaarten */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: "lightbulb",
              iconBg: "#c4e7ff",
              iconColor: "#00658b",
              title: "Wat levert het op?",
              text: "Door de behoeften in kaart te brengen, kunnen we gericht investeren in de juiste zakelijke licenties en gerichte AI-trainingen.",
            },
            {
              icon: "gpp_good",
              iconBg: "#eef7e1",
              iconColor: "#527a1b",
              title: "Privacy & Veiligheid",
              text: "Inzicht in datastromen helpt ons datalekken via onbeveiligde 'gratis' AI-tools te voorkomen en veilig beleid op te stellen.",
            },
            {
              icon: "diversity_3",
              iconBg: "#bae6ff",
              iconColor: "#396379",
              title: "Bouw mee",
              text: "Bouw mee aan onze AI-roadmap. Jouw feedback bepaalt welke tools we gaan ondersteunen. Er zijn geen foute antwoorden!",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[1.25rem] p-5 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 4px 20px rgba(0,101,139,0.04)",
              }}
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: card.iconBg }}
              >
                <Icon name={card.icon} style={{ fontSize: 22, color: card.iconColor }} />
              </div>
              <div
                className="mb-1.5 text-base"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#181c1e" }}
              >
                {card.title}
              </div>
              <p style={{ fontSize: 13.5, color: "#40484e", lineHeight: 1.55 }}>{card.text}</p>
            </div>
          ))}
        </div>

        {/* Privacyblok */}
        <div
          className="mx-auto mb-10 max-w-2xl rounded-[1.25rem] bg-white p-1 shadow-sm"
          style={{ border: "1px solid rgba(191,199,207,0.4)" }}
        >
          <button
            type="button"
            onClick={() => setPrivacyOpen((v) => !v)}
            aria-expanded={privacyOpen}
            className="flex w-full items-center justify-between gap-3 rounded-[1rem] px-4 py-3 text-left"
          >
            <span className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "#ebeef0" }}
              >
                <Icon name="visibility_off" style={{ fontSize: 18, color: "#40484e" }} />
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#181c1e" }}>
                Jouw privacy is gewaarborgd
              </span>
            </span>
            <Icon
              name="expand_more"
              style={{
                fontSize: 22,
                color: "#40484e",
                transition: "transform 0.25s",
                transform: privacyOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {privacyOpen && (
            <div className="space-y-3 px-5 pb-5 pt-1" style={{ fontSize: 13.5, color: "#40484e", lineHeight: 1.6 }}>
              <p>
                <strong>Geen controle, maar inzicht.</strong> Het doel van deze scan is niet om te kijken wie wat doet,
                maar om te begrijpen wat we als organisatie nodig hebben.
              </p>
              <p>
                Jouw antwoorden worden losgekoppeld van je naam en alleen op geaggregeerd niveau geanalyseerd door de
                DPO en het management.
              </p>
              <p>
                Aan het einde van de survey kun je er vrijwillig voor kiezen om je naam achter te laten als je wilt
                meedenken als AI-ambassadeur.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          {orgMissing ? (
            <div
              className="rounded-xl px-5 py-4 text-center text-sm"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              Geen organisatie gevonden. Gebruik de uitnodigingslink.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStart}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full px-10 py-4 text-lg text-white shadow-lg transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                style={{
                  background: isLoading ? "#003d55" : "#004c6a",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#003d55";
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#004c6a";
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden="true"
                    />
                    Bezig...
                  </>
                ) : (
                  <>
                    Start de scan
                    <Icon name="arrow_forward" style={{ fontSize: 22, color: "#fff" }} />
                  </>
                )}
              </button>
              {errorMessage && (
                <div className="text-center text-sm" style={{ color: "#dc2626" }} role="alert">
                  Kon de scan niet starten: {errorMessage}
                </div>
              )}
              <p className="mt-1 text-center text-xs" style={{ color: "#6993aa" }}>
                Duurt ca. 8-10 minuten · Antwoorden anoniem verwerkt · Je kunt stoppen wanneer je wilt
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="mt-16 text-center"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#bfc7cf",
          }}
        >
          Powered by RouteAI
        </div>
      </main>
    </div>
  );
}

export default Step01Intro;

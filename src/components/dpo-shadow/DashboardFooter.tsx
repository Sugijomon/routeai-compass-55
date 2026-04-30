// Consistente footer voor alle DPO Shadow AI dashboardpagina's.
// Toont disclaimer over zelfrapportage en menselijk oordeel.
export function DashboardFooter() {
  return (
    <footer className="mt-10 border-t pt-6 pb-4 text-xs text-muted-foreground">
      <p className="leading-relaxed">
        Alle signalen op deze dashboards zijn <strong>indicatief</strong> en gebaseerd op{" "}
        <strong>zelfrapportage</strong> uit de Shadow AI Scan. Menselijk oordeel van de DPO
        blijft leidend bij elke governance-beslissing. Individuele medewerkers worden niet
        getoond; clusters met minder dan 5 respondenten worden samengevoegd.
      </p>
    </footer>
  );
}

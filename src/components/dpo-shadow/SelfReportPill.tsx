// Pill rechtsboven in dashboardcomponenten — markeert zelfrapportage.
import { Info } from "lucide-react";

export function SelfReportPill() {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-sky-700"
      title="Indicatief beeld op basis van zelfrapportage."
    >
      <Info className="h-3 w-3" />
      Op basis van zelfrapportage
    </span>
  );
}

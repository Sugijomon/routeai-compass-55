// Centrale labels en metadata voor V8 review-triggers en tiers.
// DPO-vriendelijke Nederlandse labels.

export interface TriggerMeta {
  label: string;
  cls: "hard" | "warn" | "info" | "default";
  description: string;
}

export const TRIGGER_META: Record<string, TriggerMeta> = {
  prohibited_tool: {
    label: "Verboden tool",
    cls: "hard",
    description: "Tool met beleidsstatus prohibited.",
  },
  special_category_data: {
    label: "Bijzondere data",
    cls: "hard",
    description: "Hoogste data_boost (gevoelige persoonsgegevens, klant- of financiële data).",
  },
  hr_evaluation_context: {
    label: "HR-context",
    cls: "hard",
    description: "Tool gebruikt in HR-evaluatie of personeelsbeoordeling.",
  },
  agentic_usage: {
    label: "Autonome AI",
    cls: "hard",
    description: "Use case waarbij AI workflows uitvoert of systemen aanstuurt.",
  },
  automation_unmanaged: {
    label: "Onbeheerde automatisering",
    cls: "warn",
    description: "Automatisering buiten chat zonder beleidsinkadering.",
  },
  extension_unmanaged: {
    label: "Onbeheerde extensie",
    cls: "warn",
    description: "AI via browserextensie zonder centrale licentie.",
  },
  priority_threshold: {
    label: "Drempel overschreden",
    cls: "info",
    description: "Priority score boven de configured drempelwaarde.",
  },
  manual_override: {
    label: "Handmatige override",
    cls: "info",
    description: "DPO heeft een handmatige beoordelingsstatus toegekend.",
  },
};

export function triggerLabel(code: string): string {
  return TRIGGER_META[code]?.label ?? code;
}

export const TIER_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  standard: {
    label: "Standaard",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  priority_review: {
    label: "Prioriteit",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  toxic_shadow: {
    label: "Toxic combo",
    bg: "bg-red-100",
    text: "text-red-800",
  },
};

export function tierLabel(code: string): string {
  return TIER_META[code]?.label ?? code;
}

export const ACCOUNT_LABELS: Record<string, string> = {
  zakelijke_licentie: "Zakelijk",
  prive_gratis: "Privé (gratis)",
  prive_betaald: "Privé (betaald)",
  beide: "Beide",
};

// Mock fixture overgenomen uit de HTML-referentie (V9.2).
// Deze data wordt gebruikt zolang er nog geen voltooide V8-runs zijn.
// Hex-kleuren komen 1:1 uit de design-referentie.

export type AssignedTier = "toxic_shadow" | "priority_review" | "standard";

export interface RiskClusterRow {
  id: string;
  dept: string;
  tool: string;
  useCase: string;
  context: string;
  account: "zakelijke_licentie" | "prive_gratis" | "prive_betaald" | "beide";
  data: string;
  n: number;
  shadow: number;
  exposure: number;
  priority: number;
  assigned_tier: AssignedTier;
  triggers: string[];
  components: {
    base: number;
    data: number;
    frequency: number;
    automation: number;
    extension: number;
    agentic: number;
  };
  intervention: string;
}

export const THRESHOLD = {
  priority_review: 40,
  toxic_shadow: 50,
  toxic_exposure: 50,
  dashboard_min_cell_size: 5,
};

// Palet uit de HTML
export const RISK_COLORS = {
  primary: "#0E5A75",
  green: "#3e6a00",
  amber: "#C06000",
  red: "#b4292d",
  blue: "#0369a1",
  violet: "#6d28d9",
  cyan: "#0e7490",
  ink: "#1a2028",
  muted: "#566166",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate700: "#334155",
};

export const MOCK_CLUSTERS: RiskClusterRow[] = [
  {
    id: "SAI-1042", dept: "HR & Recruitment", tool: "ChatGPT", useCase: "Samenvatten",
    context: "HR-evaluatie", account: "prive_betaald", data: "gevoelig_persoonsgegeven",
    n: 8, shadow: 80, exposure: 100, priority: 100, assigned_tier: "toxic_shadow",
    triggers: ["prohibited_tool", "special_category_data", "hr_evaluation_context", "priority_threshold"],
    components: { base: 36, data: 30, frequency: 15, automation: 15, extension: 10, agentic: 0 },
    intervention: "direct",
  },
  {
    id: "SAI-0826", dept: "Marketing & Communicatie", tool: "Stable Diffusion", useCase: "Afbeeldingen genereren",
    context: "Klantgerichte toepassing", account: "prive_betaald", data: "klantdata",
    n: 6, shadow: 80, exposure: 88, priority: 95.6, assigned_tier: "toxic_shadow",
    triggers: ["prohibited_tool", "priority_threshold"],
    components: { base: 33, data: 30, frequency: 15, automation: 0, extension: 10, agentic: 0 },
    intervention: "direct",
  },
  {
    id: "SAI-0734", dept: "Operations & Support", tool: "Claude", useCase: "Workflow uitvoeren",
    context: "Intern gebruik", account: "prive_gratis", data: "interne_documenten",
    n: 9, shadow: 20, exposure: 99, priority: 53.55, assigned_tier: "priority_review",
    triggers: ["agentic_usage", "automation_unmanaged", "priority_threshold"],
    components: { base: 49, data: 15, frequency: 0, automation: 15, extension: 0, agentic: 20 },
    intervention: "automation",
  },
  {
    id: "SAI-1181", dept: "IT, Data & Development", tool: "GitHub Copilot", useCase: "Code schrijven",
    context: "Klantgerichte toepassing", account: "prive_betaald", data: "broncode_logica",
    n: 12, shadow: 20, exposure: 66, priority: 38.7, assigned_tier: "standard",
    triggers: ["manual_override"],
    components: { base: 31, data: 15, frequency: 10, automation: 0, extension: 10, agentic: 0 },
    intervention: "monitor",
  },
  {
    id: "SAI-0995", dept: "Finance & Legal", tool: "Notion AI", useCase: "Samenvatten",
    context: "Financieel juridisch", account: "prive_gratis", data: "financiele_data",
    n: 11, shadow: 20, exposure: 48, priority: 40, assigned_tier: "priority_review",
    triggers: ["priority_threshold"],
    components: { base: 14, data: 30, frequency: 4, automation: 0, extension: 0, agentic: 0 },
    intervention: "training",
  },
  {
    id: "SAI-0612", dept: "Marketing & Communicatie", tool: "ChatGPT", useCase: "Contentcreatie",
    context: "Klantgericht", account: "beide", data: "publiek",
    n: 15, shadow: 20, exposure: 50, priority: 31.5, assigned_tier: "standard",
    triggers: ["extension_unmanaged"],
    components: { base: 40, data: 0, frequency: 0, automation: 0, extension: 10, agentic: 0 },
    intervention: "communication",
  },
  {
    id: "SAI-0471", dept: "IT, Data & Development", tool: "DeepL Write", useCase: "Vertalen",
    context: "Intern gebruik", account: "zakelijke_licentie", data: "interne_documenten",
    n: 7, shadow: 0, exposure: 25, priority: 11.25, assigned_tier: "standard",
    triggers: [],
    components: { base: 10, data: 15, frequency: 0, automation: 0, extension: 0, agentic: 0 },
    intervention: "monitor",
  },
];

export interface TriggerMetaV2 {
  label: string;
  cls: "hard" | "warn" | "info";
  icon: string; // material-symbols of lucide-name
}

export const TRIGGER_META_V2: Record<string, TriggerMetaV2> = {
  prohibited_tool: { label: "Verboden tool", cls: "hard", icon: "Ban" },
  agentic_usage: { label: "Autonome AI", cls: "hard", icon: "Bot" },
  automation_unmanaged: { label: "Onbeheerd", cls: "warn", icon: "Settings2" },
  extension_unmanaged: { label: "Browserextensie", cls: "warn", icon: "Puzzle" },
  special_category_data: { label: "Bijzondere data", cls: "hard", icon: "Lock" },
  hr_evaluation_context: { label: "HR / juridisch", cls: "hard", icon: "Gavel" },
  priority_threshold: { label: "Review nodig", cls: "info", icon: "Flag" },
  manual_override: { label: "Handmatig", cls: "info", icon: "BadgeCheck" },
};

export function tierLabelV2(tier: string): string {
  if (tier === "toxic_shadow") return "Toxic Shadow";
  if (tier === "priority_review") return "Review nodig";
  return "Standaard";
}

export function tierColorV2(tier: string): string {
  if (tier === "toxic_shadow") return RISK_COLORS.red;
  if (tier === "priority_review") return RISK_COLORS.amber;
  return RISK_COLORS.green;
}

export function tierClassV2(tier: string): string {
  if (tier === "toxic_shadow") return "bg-[#fdecea] text-[#b4292d]";
  if (tier === "priority_review") return "bg-[#FDE8C4] text-[#C06000]";
  return "bg-[#E8F5E0] text-[#3e6a00]";
}

export function accountLabelV2(code: string): string {
  return ({
    zakelijke_licentie: "Zakelijke licentie",
    prive_gratis: "Privé gratis",
    prive_betaald: "Privé betaald",
    beide: "Gemengd",
  } as Record<string, string>)[code] ?? code;
}

export function shortDept(dept: string): string {
  return dept
    .replace(" & Recruitment", "")
    .replace(" & Communicatie", "")
    .replace(" & Development", "")
    .replace(" & Support", "");
}

export function dataLabel(value: string): string {
  if (["gevoelig_persoonsgegeven", "klantdata", "financiele_data", "juridische_documenten"].includes(value))
    return "Gevoelig";
  if (["interne_documenten", "broncode_logica", "interne_email", "notulen", "excel_sheets"].includes(value))
    return "Intern";
  if (value === "publiek") return "Publiek";
  return value ? value.replaceAll("_", " ") : "Onbekend";
}

export function isHardReview(c: RiskClusterRow): boolean {
  const HARD = ["prohibited_tool", "special_category_data", "hr_evaluation_context", "agentic_usage"];
  return c.triggers.some((t) => HARD.includes(t));
}

export function isOpenReview(c: RiskClusterRow): boolean {
  return c.assigned_tier !== "standard" || isHardReview(c) || c.triggers.includes("manual_override");
}

export function isPrivateAccount(c: RiskClusterRow): boolean {
  return ["prive_gratis", "prive_betaald", "beide"].includes(c.account);
}

export function primaryTrigger(c: RiskClusterRow): string {
  const order = [
    "prohibited_tool", "special_category_data", "hr_evaluation_context", "agentic_usage",
    "automation_unmanaged", "extension_unmanaged", "priority_threshold", "manual_override",
  ];
  return order.find((code) => c.triggers.includes(code)) ?? c.triggers[0] ?? "-";
}

export function shadowBand(score: number): number {
  if (score >= 80) return 0;
  if (score >= 40) return 1;
  if (score >= 20) return 2;
  return 3;
}
export function exposureBand(score: number): number {
  if (score >= 75) return 3;
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}

export function formatScore(v: number): string {
  return Number(v).toFixed(2).replace(/\.00$/, "").replace(/0$/, "");
}

export function riskNarrativeFor(c: RiskClusterRow): string {
  const notes: string[] = [];
  if (c.shadow >= 80) notes.push("beleidsstatus is prohibited");
  else if (c.shadow >= 40) notes.push("beleidsstatus is beperkt");
  else if (c.shadow > 0) notes.push("tool is nog niet volledig geborgd");
  if (c.exposure >= 75) notes.push("exposure is kritiek");
  else if (c.exposure >= 50) notes.push("exposure is hoog");
  if (["gevoelig_persoonsgegeven", "klantdata", "financiele_data", "juridische_documenten"].includes(c.data))
    notes.push("gevoelige data betrokken");
  if (["prive_gratis", "prive_betaald", "beide"].includes(c.account))
    notes.push("niet-volledig zakelijk accountgebruik");
  if (c.triggers.includes("agentic_usage")) notes.push("agentic of workflow-gebruik aanwezig");
  if (c.triggers.includes("automation_unmanaged")) notes.push("automatisering mogelijk onbeheerd");
  if (c.triggers.includes("extension_unmanaged")) notes.push("browserextensie mogelijk onbeheerd");
  if (c.triggers.includes("hr_evaluation_context")) notes.push("HR-evaluatiecontext vraagt extra voorzichtigheid");
  if (!notes.length)
    return "Geen dominante risicoversterker zichtbaar. Gebruik score-opbouw en context om te bepalen of monitoring volstaat.";
  return `Dit cluster vraagt review omdat ${notes.slice(0, 4).join(", ")}. Bekijk Governance voor maatregelen, eigenaar en opvolging.`;
}

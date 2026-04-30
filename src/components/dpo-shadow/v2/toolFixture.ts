// Mock fixture voor Tool Inventaris — overgenomen uit HTML-referentie 02_Tool_Inventaris.
// Wordt gebruikt zolang er nog geen voltooide V8 tool-aggregaten beschikbaar zijn.
// Hex-kleuren komen 1:1 uit de design-referentie.

export type RiskClass = "minimal" | "limited" | "high" | "unacceptable";
export type PolicyStatus = "approved" | "under_review" | "not_approved" | "known_unconfigured";
export type AccountMix = "zakelijke_licentie" | "prive_gratis" | "prive_betaald" | "beide";
export type DataMix = "publiek" | "intern" | "gevoelig";

export interface ToolRow {
  id: string;
  name: string;
  vendor: string;
  category: string;
  riskClass: RiskClass;
  policy: PolicyStatus;
  reports: number;
  uniqueDepts: number;
  topDept: string;
  accountMix: AccountMix;
  dataMix: DataMix;
  trend: number; // +/- pct vs vorige scan
  euAiActFlag: boolean; // hard signaal Annex III / Art.5
  topUseCase: string;
  hostingLocation: string;
  hasContract: boolean;
  hasDpa: boolean;
  triggers: string[]; // codes uit TRIGGER_META_V2 voor consistentie
  // breakdown voor drawer
  byDept: { dept: string; n: number }[];
  byAccount: { account: AccountMix; n: number }[];
  byData: { data: DataMix; n: number }[];
}

export const TOOL_COLORS = {
  primary: "#0E5A75",
  green: "#3e6a00",
  amber: "#C06000",
  red: "#b4292d",
  blue: "#0369a1",
  violet: "#6d28d9",
  cyan: "#0e7490",
  ink: "#1a2028",
  muted: "#566166",
};

export const RISK_CLASS_META: Record<
  RiskClass,
  { label: string; chip: string; dot: string; sort: number }
> = {
  unacceptable: { label: "Onacceptabel", chip: "bg-[#fdecea] text-[#b4292d]", dot: "#b4292d", sort: 0 },
  high: { label: "Hoog risico", chip: "bg-[#FDE8C4] text-[#C06000]", dot: "#C06000", sort: 1 },
  limited: { label: "Beperkt", chip: "bg-[#fef3c7] text-[#a16207]", dot: "#a16207", sort: 2 },
  minimal: { label: "Minimaal", chip: "bg-[#E8F5E0] text-[#3e6a00]", dot: "#3e6a00", sort: 3 },
};

export const POLICY_META: Record<
  PolicyStatus,
  { label: string; chip: string; dot: string; sort: number }
> = {
  approved: { label: "Goedgekeurd", chip: "bg-[#E8F5E0] text-[#3e6a00]", dot: "#3e6a00", sort: 0 },
  under_review: { label: "In review", chip: "bg-[#FDE8C4] text-[#C06000]", dot: "#C06000", sort: 1 },
  not_approved: { label: "Niet goedgekeurd", chip: "bg-[#fdecea] text-[#b4292d]", dot: "#b4292d", sort: 2 },
  known_unconfigured: {
    label: "Niet geconfigureerd",
    chip: "bg-slate-100 text-slate-600",
    dot: "#94a3b8",
    sort: 3,
  },
};

export const ACCOUNT_META: Record<AccountMix, { label: string; chip: string }> = {
  zakelijke_licentie: { label: "Zakelijke licentie", chip: "bg-green-50 text-[#3e6a00]" },
  prive_gratis: { label: "Privé gratis", chip: "bg-orange-50 text-[#C06000]" },
  prive_betaald: { label: "Privé betaald", chip: "bg-red-50 text-[#b4292d]" },
  beide: { label: "Gemengd", chip: "bg-violet-50 text-violet-700" },
};

export const DATA_META: Record<DataMix, { label: string; chip: string }> = {
  publiek: { label: "Publiek", chip: "bg-slate-100 text-slate-600" },
  intern: { label: "Intern", chip: "bg-blue-50 text-[#0369a1]" },
  gevoelig: { label: "Gevoelig", chip: "bg-red-50 text-[#b4292d]" },
};

export const MOCK_TOOLS: ToolRow[] = [
  {
    id: "TL-001",
    name: "ChatGPT (privé account)",
    vendor: "OpenAI",
    category: "LLM Chat",
    riskClass: "unacceptable",
    policy: "not_approved",
    reports: 47,
    uniqueDepts: 6,
    topDept: "HR & Recruitment",
    accountMix: "prive_betaald",
    dataMix: "gevoelig",
    trend: 18,
    euAiActFlag: true,
    topUseCase: "Samenvatten + HR-evaluatie",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["prohibited_tool", "special_category_data", "hr_evaluation_context"],
    byDept: [
      { dept: "HR & Recruitment", n: 14 },
      { dept: "Marketing & Communicatie", n: 11 },
      { dept: "Operations & Support", n: 8 },
      { dept: "Finance & Legal", n: 7 },
      { dept: "IT, Data & Development", n: 4 },
      { dept: "Directie", n: 3 },
    ],
    byAccount: [
      { account: "prive_betaald", n: 28 },
      { account: "prive_gratis", n: 12 },
      { account: "beide", n: 7 },
    ],
    byData: [
      { data: "gevoelig", n: 21 },
      { data: "intern", n: 18 },
      { data: "publiek", n: 8 },
    ],
  },
  {
    id: "TL-002",
    name: "Stable Diffusion",
    vendor: "Stability AI",
    category: "Image generatie",
    riskClass: "high",
    policy: "not_approved",
    reports: 19,
    uniqueDepts: 3,
    topDept: "Marketing & Communicatie",
    accountMix: "prive_betaald",
    dataMix: "intern",
    trend: 9,
    euAiActFlag: true,
    topUseCase: "Klantgerichte beelden",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["prohibited_tool", "extension_unmanaged"],
    byDept: [
      { dept: "Marketing & Communicatie", n: 12 },
      { dept: "Directie", n: 4 },
      { dept: "IT, Data & Development", n: 3 },
    ],
    byAccount: [
      { account: "prive_betaald", n: 14 },
      { account: "prive_gratis", n: 5 },
    ],
    byData: [
      { data: "intern", n: 11 },
      { data: "publiek", n: 8 },
    ],
  },
  {
    id: "TL-003",
    name: "Claude",
    vendor: "Anthropic",
    category: "LLM Chat",
    riskClass: "high",
    policy: "under_review",
    reports: 32,
    uniqueDepts: 5,
    topDept: "Operations & Support",
    accountMix: "prive_gratis",
    dataMix: "intern",
    trend: 22,
    euAiActFlag: false,
    topUseCase: "Workflow-uitvoering",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["agentic_usage", "automation_unmanaged"],
    byDept: [
      { dept: "Operations & Support", n: 13 },
      { dept: "IT, Data & Development", n: 9 },
      { dept: "Marketing & Communicatie", n: 5 },
      { dept: "HR & Recruitment", n: 3 },
      { dept: "Finance & Legal", n: 2 },
    ],
    byAccount: [
      { account: "prive_gratis", n: 18 },
      { account: "prive_betaald", n: 9 },
      { account: "beide", n: 5 },
    ],
    byData: [
      { data: "intern", n: 22 },
      { data: "publiek", n: 7 },
      { data: "gevoelig", n: 3 },
    ],
  },
  {
    id: "TL-004",
    name: "Microsoft Copilot",
    vendor: "Microsoft",
    category: "Productivity",
    riskClass: "limited",
    policy: "approved",
    reports: 64,
    uniqueDepts: 8,
    topDept: "Finance & Legal",
    accountMix: "zakelijke_licentie",
    dataMix: "intern",
    trend: 31,
    euAiActFlag: false,
    topUseCase: "Documenten + e-mail",
    hostingLocation: "EU",
    hasContract: true,
    hasDpa: true,
    triggers: [],
    byDept: [
      { dept: "Finance & Legal", n: 17 },
      { dept: "Operations & Support", n: 12 },
      { dept: "Directie", n: 9 },
      { dept: "HR & Recruitment", n: 8 },
      { dept: "Marketing & Communicatie", n: 7 },
      { dept: "IT, Data & Development", n: 6 },
      { dept: "Sales", n: 3 },
      { dept: "Inkoop", n: 2 },
    ],
    byAccount: [{ account: "zakelijke_licentie", n: 64 }],
    byData: [
      { data: "intern", n: 41 },
      { data: "gevoelig", n: 14 },
      { data: "publiek", n: 9 },
    ],
  },
  {
    id: "TL-005",
    name: "GitHub Copilot",
    vendor: "GitHub",
    category: "Code-assistent",
    riskClass: "limited",
    policy: "under_review",
    reports: 23,
    uniqueDepts: 2,
    topDept: "IT, Data & Development",
    accountMix: "prive_betaald",
    dataMix: "intern",
    trend: 5,
    euAiActFlag: false,
    topUseCase: "Code schrijven",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["manual_override"],
    byDept: [
      { dept: "IT, Data & Development", n: 19 },
      { dept: "Operations & Support", n: 4 },
    ],
    byAccount: [
      { account: "prive_betaald", n: 16 },
      { account: "zakelijke_licentie", n: 7 },
    ],
    byData: [
      { data: "intern", n: 21 },
      { data: "publiek", n: 2 },
    ],
  },
  {
    id: "TL-006",
    name: "Notion AI",
    vendor: "Notion Labs",
    category: "Productivity",
    riskClass: "limited",
    policy: "under_review",
    reports: 28,
    uniqueDepts: 5,
    topDept: "Finance & Legal",
    accountMix: "prive_gratis",
    dataMix: "intern",
    trend: 12,
    euAiActFlag: false,
    topUseCase: "Notuleren + samenvatten",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: [],
    byDept: [
      { dept: "Finance & Legal", n: 11 },
      { dept: "Operations & Support", n: 7 },
      { dept: "Marketing & Communicatie", n: 5 },
      { dept: "HR & Recruitment", n: 3 },
      { dept: "IT, Data & Development", n: 2 },
    ],
    byAccount: [
      { account: "prive_gratis", n: 18 },
      { account: "prive_betaald", n: 7 },
      { account: "beide", n: 3 },
    ],
    byData: [
      { data: "intern", n: 19 },
      { data: "gevoelig", n: 6 },
      { data: "publiek", n: 3 },
    ],
  },
  {
    id: "TL-007",
    name: "DeepL Write",
    vendor: "DeepL",
    category: "Vertaling",
    riskClass: "minimal",
    policy: "approved",
    reports: 41,
    uniqueDepts: 7,
    topDept: "Marketing & Communicatie",
    accountMix: "zakelijke_licentie",
    dataMix: "intern",
    trend: 4,
    euAiActFlag: false,
    topUseCase: "Vertalen + redactie",
    hostingLocation: "EU",
    hasContract: true,
    hasDpa: true,
    triggers: [],
    byDept: [
      { dept: "Marketing & Communicatie", n: 14 },
      { dept: "Sales", n: 8 },
      { dept: "Finance & Legal", n: 6 },
      { dept: "HR & Recruitment", n: 5 },
      { dept: "Operations & Support", n: 4 },
      { dept: "IT, Data & Development", n: 3 },
      { dept: "Inkoop", n: 1 },
    ],
    byAccount: [{ account: "zakelijke_licentie", n: 41 }],
    byData: [
      { data: "intern", n: 26 },
      { data: "publiek", n: 13 },
      { data: "gevoelig", n: 2 },
    ],
  },
  {
    id: "TL-008",
    name: "Gemini",
    vendor: "Google",
    category: "LLM Chat",
    riskClass: "high",
    policy: "not_approved",
    reports: 14,
    uniqueDepts: 4,
    topDept: "Marketing & Communicatie",
    accountMix: "beide",
    dataMix: "intern",
    trend: -3,
    euAiActFlag: false,
    topUseCase: "Brainstorm + research",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["extension_unmanaged"],
    byDept: [
      { dept: "Marketing & Communicatie", n: 6 },
      { dept: "Sales", n: 4 },
      { dept: "IT, Data & Development", n: 2 },
      { dept: "HR & Recruitment", n: 2 },
    ],
    byAccount: [
      { account: "beide", n: 7 },
      { account: "prive_gratis", n: 5 },
      { account: "zakelijke_licentie", n: 2 },
    ],
    byData: [
      { data: "intern", n: 8 },
      { data: "publiek", n: 5 },
      { data: "gevoelig", n: 1 },
    ],
  },
  {
    id: "TL-009",
    name: "Otter.ai",
    vendor: "Otter",
    category: "Notuleren",
    riskClass: "high",
    policy: "known_unconfigured",
    reports: 11,
    uniqueDepts: 3,
    topDept: "HR & Recruitment",
    accountMix: "prive_gratis",
    dataMix: "gevoelig",
    trend: 8,
    euAiActFlag: false,
    topUseCase: "Vergaderingen transcriberen",
    hostingLocation: "VS",
    hasContract: false,
    hasDpa: false,
    triggers: ["special_category_data"],
    byDept: [
      { dept: "HR & Recruitment", n: 6 },
      { dept: "Operations & Support", n: 3 },
      { dept: "Directie", n: 2 },
    ],
    byAccount: [
      { account: "prive_gratis", n: 8 },
      { account: "prive_betaald", n: 3 },
    ],
    byData: [
      { data: "gevoelig", n: 7 },
      { data: "intern", n: 4 },
    ],
  },
  {
    id: "TL-010",
    name: "Grammarly",
    vendor: "Grammarly",
    category: "Schrijfassistent",
    riskClass: "limited",
    policy: "approved",
    reports: 22,
    uniqueDepts: 5,
    topDept: "Marketing & Communicatie",
    accountMix: "beide",
    dataMix: "intern",
    trend: 2,
    euAiActFlag: false,
    topUseCase: "Tekst redactie",
    hostingLocation: "VS",
    hasContract: true,
    hasDpa: false,
    triggers: ["extension_unmanaged"],
    byDept: [
      { dept: "Marketing & Communicatie", n: 8 },
      { dept: "Sales", n: 5 },
      { dept: "HR & Recruitment", n: 4 },
      { dept: "Finance & Legal", n: 3 },
      { dept: "Operations & Support", n: 2 },
    ],
    byAccount: [
      { account: "zakelijke_licentie", n: 12 },
      { account: "prive_gratis", n: 7 },
      { account: "beide", n: 3 },
    ],
    byData: [
      { data: "intern", n: 14 },
      { data: "publiek", n: 7 },
      { data: "gevoelig", n: 1 },
    ],
  },
];

export function shortDept(dept: string): string {
  return dept
    .replace(" & Recruitment", "")
    .replace(" & Communicatie", "")
    .replace(" & Development", "")
    .replace(" & Support", "")
    .replace(" & Legal", "");
}

export function trendLabel(trend: number): string {
  if (trend > 0) return `+${trend}%`;
  if (trend < 0) return `${trend}%`;
  return "0%";
}

export function trendColor(trend: number): string {
  if (trend >= 15) return "#b4292d";
  if (trend >= 5) return "#C06000";
  if (trend < 0) return "#3e6a00";
  return "#566166";
}

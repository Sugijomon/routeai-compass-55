// Mapt rauwe tool_discoveries (één rij per gebruikersrapportage) naar geaggregeerde ToolRow[].
// Houdt de structuur bewust dicht bij MOCK_TOOLS zodat dezelfde componenten herbruikbaar zijn.
import type {
  ToolRow,
  RiskClass,
  PolicyStatus,
  AccountMix,
  DataMix,
} from "./toolFixture";

type Discovery = {
  id: string;
  org_id: string;
  tool_name: string;
  vendor: string | null;
  application_risk_class: string | null;
  data_types_used: string[] | null;
  department: string | null;
  eu_ai_act_context: string | null;
  resulting_tool_id: string | null;
  review_status: string;
  use_case: string | null;
  use_frequency: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
};

const VALID_RISK: RiskClass[] = ["minimal", "limited", "high", "unacceptable"];

function pickRisk(value: string | null): RiskClass {
  if (value && (VALID_RISK as string[]).includes(value)) return value as RiskClass;
  return "limited";
}

function pickPolicy(reviewStatus: string, hasResultingTool: boolean): PolicyStatus {
  switch (reviewStatus) {
    case "approved":
      return "approved";
    case "rejected":
      return "not_approved";
    case "in_review":
    case "pending":
      return "under_review";
    default:
      return hasResultingTool ? "known_unconfigured" : "under_review";
  }
}

function pickDataMix(types: string[] | null): DataMix {
  const t = (types ?? []).map((x) => x.toLowerCase());
  if (t.some((x) => ["gevoelig", "sensitive", "special", "bijzonder"].some((k) => x.includes(k))))
    return "gevoelig";
  if (t.some((x) => ["intern", "internal", "client", "klant"].some((k) => x.includes(k))))
    return "intern";
  return "publiek";
}

function dominant<T extends string>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  const counts = new Map<T, number>();
  items.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function mapDiscoveriesToToolRows(rows: Discovery[]): ToolRow[] {
  // Groepeer op normalized tool_name + vendor
  const groups = new Map<string, Discovery[]>();
  for (const r of rows) {
    const key = `${(r.tool_name ?? "").trim().toLowerCase()}|${(r.vendor ?? "").trim().toLowerCase()}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const result: ToolRow[] = [];
  for (const [key, items] of groups) {
    const first = items[0];
    const reports = items.length;

    // Risk: hoogste van alle meldingen
    const riskOrder: Record<RiskClass, number> = {
      unacceptable: 0,
      high: 1,
      limited: 2,
      minimal: 3,
    };
    const risks = items
      .map((i) => pickRisk(i.application_risk_class))
      .sort((a, b) => riskOrder[a] - riskOrder[b]);
    const riskClass = risks[0];

    const policy = pickPolicy(first.review_status, !!first.resulting_tool_id);

    // Departments
    const depts = items.map((i) => i.department ?? "Onbekend");
    const byDeptMap = new Map<string, number>();
    depts.forEach((d) => byDeptMap.set(d, (byDeptMap.get(d) ?? 0) + 1));
    const byDept = [...byDeptMap.entries()]
      .map(([dept, n]) => ({ dept, n }))
      .sort((a, b) => b.n - a.n);

    // Data
    const dataPerItem: DataMix[] = items.map((i) => pickDataMix(i.data_types_used));
    const byDataMap = new Map<DataMix, number>();
    dataPerItem.forEach((d) => byDataMap.set(d, (byDataMap.get(d) ?? 0) + 1));
    const byData = [...byDataMap.entries()]
      .map(([data, n]) => ({ data, n }))
      .sort((a, b) => b.n - a.n);
    const dataMix = (dominant(dataPerItem) ?? "intern") as DataMix;

    // Account mix: niet aanwezig in tool_discoveries → default zakelijke_licentie wanneer
    // er een resulting_tool_id is (dus uit catalogus), anders prive_gratis als heuristiek.
    const accountMix: AccountMix = first.resulting_tool_id ? "zakelijke_licentie" : "prive_gratis";
    const byAccount = [{ account: accountMix, n: reports }];

    const euAiActFlag = !!first.eu_ai_act_context || riskClass === "unacceptable";

    result.push({
      id: first.id,
      name: first.tool_name,
      vendor: first.vendor ?? "Onbekend",
      category: first.use_case ?? "Onbekend",
      riskClass,
      policy,
      reports,
      uniqueDepts: byDept.length,
      topDept: byDept[0]?.dept ?? "Onbekend",
      accountMix,
      dataMix,
      trend: 0,
      euAiActFlag,
      topUseCase: first.use_case ?? "—",
      hostingLocation: "Onbekend",
      hasContract: !!first.resulting_tool_id,
      hasDpa: false,
      triggers: euAiActFlag ? ["special_category_data"] : [],
      byDept,
      byAccount,
      byData,
    });
    void key;
  }

  // Sorteer op risico, dan reports
  const order: Record<RiskClass, number> = {
    unacceptable: 0,
    high: 1,
    limited: 2,
    minimal: 3,
  };
  return result.sort((a, b) => order[a.riskClass] - order[b.riskClass] || b.reports - a.reports);
}

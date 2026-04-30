// Gedeelde filterstate voor Tool Inventaris.
// Wordt gebruikt door ToolRegisterTable, DpoMatrix en UsageFlows.
import { useMemo, useState } from "react";
import type { ToolRow } from "./toolFixture";

export type QuickFilter = "all" | "flagged" | "not_approved" | "private_account" | "high_risk";

export interface ToolFiltersState {
  quick: QuickFilter;
  query: string;
  riskClass: string;
  policy: string;
  account: string;
  data: string;
}

const DEFAULT_STATE: ToolFiltersState = {
  quick: "all",
  query: "",
  riskClass: "all",
  policy: "all",
  account: "all",
  data: "all",
};

export function useToolFilters(tools: ToolRow[]) {
  const [state, setState] = useState<ToolFiltersState>(DEFAULT_STATE);

  const set = <K extends keyof ToolFiltersState>(k: K, v: ToolFiltersState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const reset = () => setState(DEFAULT_STATE);

  const filtered = useMemo(() => applyToolFilters(tools, state), [tools, state]);

  const isActive = useMemo(() => {
    return (
      state.quick !== "all" ||
      state.query.trim() !== "" ||
      state.riskClass !== "all" ||
      state.policy !== "all" ||
      state.account !== "all" ||
      state.data !== "all"
    );
  }, [state]);

  return { state, set, reset, filtered, isActive };
}

export function applyToolFilters(tools: ToolRow[], state: ToolFiltersState): ToolRow[] {
  return tools.filter((t) => {
    if (state.quick === "flagged" && !t.euAiActFlag) return false;
    if (state.quick === "not_approved" && t.policy !== "not_approved") return false;
    if (
      state.quick === "private_account" &&
      !["prive_gratis", "prive_betaald", "beide"].includes(t.accountMix)
    )
      return false;
    if (state.quick === "high_risk" && !["high", "unacceptable"].includes(t.riskClass)) return false;
    if (state.riskClass !== "all" && t.riskClass !== state.riskClass) return false;
    if (state.policy !== "all" && t.policy !== state.policy) return false;
    if (state.account !== "all" && t.accountMix !== state.account) return false;
    if (state.data !== "all" && t.dataMix !== state.data) return false;
    if (state.query.trim()) {
      const q = state.query.toLowerCase();
      if (
        !t.name.toLowerCase().includes(q) &&
        !t.vendor.toLowerCase().includes(q) &&
        !t.category.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

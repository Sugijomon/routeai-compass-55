import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "./useUserProfile";

/**
 * Interface voor org_tools_catalog entries.
 * Vervangt het oude Library+Catalog merge-patroon.
 */
export interface OrgToolWithCatalog {
  id: string;
  tool_name: string;
  name: string; // alias voor tool_name (backward compat)
  vendor: string;
  description: string | null;
  category: string | null;
  gpai_status: boolean | null;
  hosting_location: string | null;
  data_residency: string | null;
  capabilities: string[] | null;
  model_type: string | null;
  api_available: boolean | null;
  contract_required: boolean | null;
  vendor_website_url: string | null;
  // Catalog-specifieke velden
  catalog_id: string;
  is_enabled: boolean;
  status: string;
  notes: string | null;
  typekaart_id: string | null;
  // Legacy compat — niet beschikbaar in org_tools_catalog
  custom_guidelines: string | null;
  custom_risk_notes: string | null;
  usage_limits: string | null;
  contract_reference: string | null;
  monthly_cost: number | null;
  requires_approval: boolean;
  allowed_roles: string[] | null;
}

export interface CatalogUpdateInput {
  tool_id: string;
  is_enabled?: boolean;
  custom_guidelines?: string;
  custom_risk_notes?: string;
  usage_limits?: string;
  contract_reference?: string;
  monthly_cost?: number | null;
  requires_approval?: boolean;
  allowed_roles?: string[];
}

/**
 * Haalt org_tools_catalog op en verrijkt met tools_library data indien beschikbaar.
 */
export function useOrgToolsCatalog() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-tools-catalog", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Haal org_tools_catalog entries op
      const { data: catalogEntries, error: catalogError } = await supabase
        .from("org_tools_catalog")
        .select("*")
        .eq("org_id", orgId)
        .order("tool_name", { ascending: true });

      if (catalogError) throw catalogError;

      // Haal published tools_library op voor verrijking
      const { data: libraryTools } = await supabase
        .from("tools_library")
        .select("*")
        .eq("status", "published");

      // Bouw lookup op naam (case-insensitive)
      const libraryByName = new Map(
        (libraryTools ?? []).map((t) => [t.name.toLowerCase(), t])
      );

      const merged: OrgToolWithCatalog[] = (catalogEntries ?? []).map((entry) => {
        const lib = libraryByName.get(entry.tool_name.toLowerCase());
        return {
          id: lib?.id ?? entry.id,
          tool_name: entry.tool_name,
          name: entry.tool_name,
          vendor: lib?.vendor ?? "",
          description: lib?.description ?? null,
          category: lib?.category ?? null,
          gpai_status: lib?.gpai_status ?? null,
          hosting_location: lib?.hosting_location ?? null,
          data_residency: lib?.data_residency ?? null,
          capabilities: lib?.capabilities ?? null,
          model_type: lib?.model_type ?? null,
          api_available: lib?.api_available ?? null,
          contract_required: lib?.contract_required ?? null,
          vendor_website_url: lib?.vendor_website_url ?? null,
          catalog_id: entry.id,
          is_enabled: entry.status === "approved",
          status: entry.status,
          notes: entry.notes,
          typekaart_id: entry.typekaart_id,
          // Velden die niet bestaan in org_tools_catalog — notes als fallback
          custom_guidelines: entry.notes,
          custom_risk_notes: null,
          usage_limits: null,
          contract_reference: null,
          monthly_cost: null,
          requires_approval: entry.status === "under_review",
          allowed_roles: null,
        };
      });

      return merged;
    },
    enabled: !!orgId,
  });
}

export function useOrgToolsStats() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-tools-stats", orgId],
    queryFn: async () => {
      if (!orgId) return { enabledCount: 0, totalCost: 0 };

      const { data, error } = await supabase
        .from("org_tools_catalog")
        .select("status")
        .eq("org_id", orgId)
        .eq("status", "approved");

      if (error) throw error;

      return {
        enabledCount: data?.length ?? 0,
        totalCost: 0, // org_tools_catalog heeft geen kosten-veld
      };
    },
    enabled: !!orgId,
  });
}

export function useToggleToolCatalog() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useMutation({
    mutationFn: async ({ toolId, enable }: { toolId: string; enable: boolean }) => {
      if (!orgId) throw new Error("No organization found");

      const newStatus = enable ? "approved" : "not_approved";

      const { error } = await supabase
        .from("org_tools_catalog")
        .update({ status: newStatus })
        .eq("id", toolId);

      if (error) throw error;
      return { toolId, enable };
    },
    onSuccess: (_, { enable }) => {
      queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-tools-stats", orgId] });
      toast({
        title: enable ? "Tool goedgekeurd" : "Tool uitgeschakeld",
        description: enable
          ? "De tool is nu goedgekeurd voor gebruik."
          : "De tool is niet langer goedgekeurd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateToolCatalog() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useMutation({
    mutationFn: async (input: CatalogUpdateInput) => {
      if (!orgId) throw new Error("No organization found");

      // Update notes als fallback voor custom_guidelines
      const { error } = await supabase
        .from("org_tools_catalog")
        .update({
          notes: input.custom_guidelines ?? null,
          status: input.is_enabled ? "approved" : "not_approved",
        })
        .eq("id", input.tool_id);

      if (error) throw error;
      return input;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-tools-stats", orgId] });
      toast({
        title: "Instellingen opgeslagen",
        description: "De tool configuratie is bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

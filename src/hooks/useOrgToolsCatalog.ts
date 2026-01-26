import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "./useUserProfile";

export interface OrgToolWithCatalog {
  // From tools_library
  id: string;
  name: string;
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
  // From tools_catalog (org-specific)
  catalog_id: string | null;
  is_enabled: boolean;
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

export function useOrgToolsCatalog() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-tools-catalog", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // First, get all published tools from the library
      const { data: libraryTools, error: libraryError } = await supabase
        .from("tools_library")
        .select("*")
        .eq("status", "published")
        .order("name", { ascending: true });

      if (libraryError) throw libraryError;

      // Then, get the org's catalog entries
      const { data: catalogEntries, error: catalogError } = await supabase
        .from("tools_catalog")
        .select("*")
        .eq("org_id", orgId);

      if (catalogError) throw catalogError;

      // Create a map for quick lookup
      const catalogMap = new Map(
        catalogEntries?.map((entry) => [entry.tool_id, entry]) || []
      );

      // Merge the data
      const mergedTools: OrgToolWithCatalog[] = (libraryTools || []).map((tool) => {
        const catalogEntry = catalogMap.get(tool.id);
        return {
          id: tool.id,
          name: tool.name,
          vendor: tool.vendor,
          description: tool.description,
          category: tool.category,
          gpai_status: tool.gpai_status,
          hosting_location: tool.hosting_location,
          data_residency: tool.data_residency,
          capabilities: tool.capabilities,
          model_type: tool.model_type,
          api_available: tool.api_available,
          contract_required: tool.contract_required,
          vendor_website_url: tool.vendor_website_url,
          // Catalog fields
          catalog_id: catalogEntry?.id || null,
          is_enabled: catalogEntry?.is_enabled || false,
          custom_guidelines: catalogEntry?.custom_guidelines || null,
          custom_risk_notes: catalogEntry?.custom_risk_notes || null,
          usage_limits: catalogEntry?.usage_limits || null,
          contract_reference: catalogEntry?.contract_reference || null,
          monthly_cost: catalogEntry?.monthly_cost || null,
          requires_approval: catalogEntry?.requires_approval || false,
          allowed_roles: catalogEntry?.allowed_roles || null,
        };
      });

      return mergedTools;
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
        .from("tools_catalog")
        .select("is_enabled, monthly_cost")
        .eq("org_id", orgId)
        .eq("is_enabled", true);

      if (error) throw error;

      const enabledCount = data?.length || 0;
      const totalCost = data?.reduce((sum, item) => sum + (Number(item.monthly_cost) || 0), 0) || 0;

      return { enabledCount, totalCost };
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

      // Check if catalog entry exists
      const { data: existing } = await supabase
        .from("tools_catalog")
        .select("id")
        .eq("tool_id", toolId)
        .eq("org_id", orgId)
        .maybeSingle();

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from("tools_catalog")
          .update({ is_enabled: enable, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else if (enable) {
        // Insert new entry only when enabling
        const { error } = await supabase
          .from("tools_catalog")
          .insert({
            tool_id: toolId,
            org_id: orgId,
            is_enabled: true,
          });

        if (error) throw error;
      }

      return { toolId, enable };
    },
    onSuccess: (_, { enable }) => {
      queryClient.invalidateQueries({ queryKey: ["org-tools-catalog", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-tools-stats", orgId] });
      toast({
        title: enable ? "Tool ingeschakeld" : "Tool uitgeschakeld",
        description: enable 
          ? "De tool is nu beschikbaar voor gebruikers in je organisatie." 
          : "Gebruikers kunnen deze tool niet meer gebruiken.",
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

      // Check if catalog entry exists
      const { data: existing } = await supabase
        .from("tools_catalog")
        .select("id")
        .eq("tool_id", input.tool_id)
        .eq("org_id", orgId)
        .maybeSingle();

      const updateData = {
        custom_guidelines: input.custom_guidelines,
        custom_risk_notes: input.custom_risk_notes,
        usage_limits: input.usage_limits,
        contract_reference: input.contract_reference,
        monthly_cost: input.monthly_cost,
        requires_approval: input.requires_approval,
        allowed_roles: input.allowed_roles,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("tools_catalog")
          .update(updateData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tools_catalog")
          .insert({
            tool_id: input.tool_id,
            org_id: orgId,
            is_enabled: input.is_enabled ?? false,
            ...updateData,
          });

        if (error) throw error;
      }

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

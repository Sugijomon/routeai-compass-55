import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ToolLibraryItem {
  id: string;
  name: string;
  vendor: string;
  description: string | null;
  category: string | null;
  gpai_status: boolean | null;
  hosting_location: string | null;
  data_residency: string | null;
  capabilities: string[] | null;
  status: string | null;
  version: string | null;
  api_available: boolean | null;
  contract_required: boolean | null;
  model_type: string | null;
  vendor_website_url: string | null;
  vendor_terms_url: string | null;
  vendor_privacy_policy_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateToolInput {
  name: string;
  vendor: string;
  description?: string;
  category?: string;
  gpai_status?: boolean;
  hosting_location?: string;
  data_residency?: string;
  capabilities?: string[];
  status?: string;
  model_type?: string;
  api_available?: boolean;
  contract_required?: boolean;
  vendor_website_url?: string;
  vendor_terms_url?: string;
  vendor_privacy_policy_url?: string;
}

export interface UpdateToolInput extends Partial<CreateToolInput> {
  id: string;
}

export function useToolsLibrary() {
  return useQuery({
    queryKey: ["tools-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools_library")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ToolLibraryItem[];
    },
  });
}

export function useToolUsageCount(toolId: string) {
  return useQuery({
    queryKey: ["tool-usage-count", toolId],
    queryFn: async () => {
      // Zoek tool naam op in library, dan tel org_tools_catalog entries
      const { data: tool } = await supabase
        .from("tools_library")
        .select("name")
        .eq("id", toolId)
        .single();

      if (!tool) return 0;

      const { count, error } = await supabase
        .from("org_tools_catalog")
        .select("*", { count: "exact", head: true })
        .ilike("tool_name", tool.name);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!toolId,
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateToolInput) => {
      const { data, error } = await supabase
        .from("tools_library")
        .insert({
          name: input.name,
          vendor: input.vendor,
          description: input.description || null,
          category: input.category || null,
          gpai_status: input.gpai_status || false,
          hosting_location: input.hosting_location || null,
          data_residency: input.data_residency || null,
          capabilities: input.capabilities || [],
          status: input.status || "draft",
          model_type: input.model_type || null,
          api_available: input.api_available || false,
          contract_required: input.contract_required || false,
          vendor_website_url: input.vendor_website_url || null,
          vendor_terms_url: input.vendor_terms_url || null,
          vendor_privacy_policy_url: input.vendor_privacy_policy_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools-library"] });
      toast({
        title: "Tool aangemaakt",
        description: "De tool is succesvol toegevoegd aan de bibliotheek.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateToolInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("tools_library")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools-library"] });
      toast({
        title: "Tool bijgewerkt",
        description: "De tool is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tools_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools-library"] });
      toast({
        title: "Tool verwijderd",
        description: "De tool is succesvol verwijderd uit de bibliotheek.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

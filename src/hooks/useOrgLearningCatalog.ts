import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type LearningLibraryRow = Database["public"]["Tables"]["learning_library"]["Row"];
type LearningCatalogRow = Database["public"]["Tables"]["learning_catalog"]["Row"];

export interface OrgLearningItem extends LearningLibraryRow {
  catalog_id: string | null;
  is_enabled: boolean;
  is_mandatory: boolean;
  custom_deadline: string | null;
  assigned_to_roles: string[] | null;
  custom_intro: string | null;
  custom_title: string | null;
  custom_notes: string | null;
  priority: number;
  completion_reward_points: number;
}

export function useOrgLearningCatalog() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-learning-catalog", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("No organization found");

      // Get all published learning items
      const { data: libraryItems, error: libraryError } = await supabase
        .from("learning_library")
        .select("*")
        .eq("status", "published")
        .order("title", { ascending: true });

      if (libraryError) throw libraryError;

      // Get org's catalog entries
      const { data: catalogItems, error: catalogError } = await supabase
        .from("learning_catalog")
        .select("*")
        .eq("org_id", orgId);

      if (catalogError) throw catalogError;

      // Create a map of catalog entries by library_item_id
      const catalogMap = new Map<string, LearningCatalogRow>();
      catalogItems?.forEach((item) => {
        catalogMap.set(item.library_item_id, item);
      });

      // Merge library items with catalog settings
      const mergedItems: OrgLearningItem[] = (libraryItems || []).map((lib) => {
        const catalog = catalogMap.get(lib.id);
        return {
          ...lib,
          catalog_id: catalog?.id || null,
          is_enabled: catalog?.is_enabled || false,
          is_mandatory: catalog?.is_mandatory || false,
          custom_deadline: catalog?.custom_deadline || null,
          assigned_to_roles: catalog?.assigned_to_roles || null,
          custom_intro: catalog?.custom_intro || null,
          custom_title: catalog?.custom_title || null,
          custom_notes: catalog?.custom_notes || null,
          priority: catalog?.priority || 0,
          completion_reward_points: catalog?.completion_reward_points || 0,
        };
      });

      // Sort: enabled first, then by title
      return mergedItems.sort((a, b) => {
        if (a.is_enabled !== b.is_enabled) {
          return a.is_enabled ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });
    },
    enabled: !!orgId,
  });
}

export function useOrgLearningStats() {
  const { profile } = useUserProfile();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-learning-stats", orgId],
    queryFn: async () => {
      if (!orgId) return { enabledCount: 0, mandatoryCount: 0 };

      const { data, error } = await supabase
        .from("learning_catalog")
        .select("is_enabled, is_mandatory")
        .eq("org_id", orgId)
        .eq("is_enabled", true);

      if (error) throw error;

      return {
        enabledCount: data?.length || 0,
        mandatoryCount: data?.filter((item) => item.is_mandatory).length || 0,
      };
    },
    enabled: !!orgId,
  });
}

export function useToggleLearningCatalog() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  return useMutation({
    mutationFn: async ({
      libraryItemId,
      catalogId,
      isEnabled,
    }: {
      libraryItemId: string;
      catalogId: string | null;
      isEnabled: boolean;
    }) => {
      if (!profile?.org_id) throw new Error("No organization found");

      if (catalogId) {
        // Update existing catalog entry
        const { error } = await supabase
          .from("learning_catalog")
          .update({ is_enabled: isEnabled })
          .eq("id", catalogId);

        if (error) throw error;
      } else if (isEnabled) {
        // Create new catalog entry
        const { error } = await supabase.from("learning_catalog").insert({
          org_id: profile.org_id,
          library_item_id: libraryItemId,
          is_enabled: true,
          is_mandatory: false,
          priority: 0,
        });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["org-learning-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["org-learning-stats"] });
      toast({
        title: variables.isEnabled ? "Training ingeschakeld" : "Training uitgeschakeld",
        description: variables.isEnabled
          ? "Deze training is nu beschikbaar voor je organisatie."
          : "Gebruikers kunnen deze training niet meer starten.",
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

export interface UpdateLearningCatalogInput {
  catalogId: string;
  is_mandatory?: boolean;
  custom_deadline?: string | null;
  assigned_to_roles?: string[] | null;
  custom_intro?: string | null;
  custom_notes?: string | null;
  priority?: number;
}

export function useUpdateLearningCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLearningCatalogInput) => {
      const { catalogId, ...updates } = input;

      const { error } = await supabase
        .from("learning_catalog")
        .update(updates)
        .eq("id", catalogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-learning-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["org-learning-stats"] });
      toast({
        title: "Instellingen opgeslagen",
        description: "De training configuratie is bijgewerkt.",
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

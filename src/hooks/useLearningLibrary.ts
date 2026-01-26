import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database, Json } from "@/integrations/supabase/types";

type LearningContentType = Database["public"]["Enums"]["learning_content_type"];
type LearningDifficultyLevel = Database["public"]["Enums"]["learning_difficulty_level"];
type LearningStatus = Database["public"]["Enums"]["learning_status"];

export interface LearningLibraryItem {
  id: string;
  title: string;
  description: string | null;
  content_type: LearningContentType;
  difficulty_level: LearningDifficultyLevel | null;
  status: LearningStatus;
  version: string | null;
  content: Json | null;
  estimated_duration_minutes: number | null;
  learning_objectives: string[] | null;
  required_for_license: string[] | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  org_id: string | null;
}

export interface CreateLearningInput {
  title: string;
  description?: string;
  content_type: LearningContentType;
  difficulty_level?: LearningDifficultyLevel;
  status?: LearningStatus;
  version?: string;
  content?: Json;
  estimated_duration_minutes?: number;
  learning_objectives?: string[];
  required_for_license?: string[];
}

export interface UpdateLearningInput extends Partial<CreateLearningInput> {
  id: string;
}

export function useLearningLibrary() {
  return useQuery({
    queryKey: ["learning-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_library")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as LearningLibraryItem[];
    },
  });
}

export function useLearningUsageCount(itemId: string) {
  return useQuery({
    queryKey: ["learning-usage-count", itemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("learning_catalog")
        .select("*", { count: "exact", head: true })
        .eq("library_item_id", itemId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!itemId,
  });
}

export function useCreateLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLearningInput) => {
      const insertData = {
        title: input.title,
        description: input.description || null,
        content_type: input.content_type,
        difficulty_level: input.difficulty_level || "basic" as LearningDifficultyLevel,
        status: input.status || "draft" as LearningStatus,
        version: input.version || "1.0",
        content: input.content || {},
        estimated_duration_minutes: input.estimated_duration_minutes || null,
        learning_objectives: input.learning_objectives || [],
        required_for_license: input.required_for_license || [],
      };

      const { data, error } = await supabase
        .from("learning_library")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-library"] });
      toast({
        title: "Content aangemaakt",
        description: "De content is succesvol toegevoegd aan de bibliotheek.",
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

export function useUpdateLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLearningInput) => {
      const { id, ...updates } = input;
      
      // Build update object with proper typing
      const updateData: Database["public"]["Tables"]["learning_library"]["Update"] = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.content_type !== undefined) updateData.content_type = updates.content_type;
      if (updates.difficulty_level !== undefined) updateData.difficulty_level = updates.difficulty_level;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.version !== undefined) updateData.version = updates.version;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = updates.estimated_duration_minutes;
      if (updates.learning_objectives !== undefined) updateData.learning_objectives = updates.learning_objectives;
      if (updates.required_for_license !== undefined) updateData.required_for_license = updates.required_for_license;

      const { data, error } = await supabase
        .from("learning_library")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-library"] });
      toast({
        title: "Content bijgewerkt",
        description: "De content is succesvol bijgewerkt.",
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

export function useDeleteLearning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("learning_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-library"] });
      toast({
        title: "Content verwijderd",
        description: "De content is succesvol verwijderd uit de bibliotheek.",
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

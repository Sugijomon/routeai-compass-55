export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      course_lessons: {
        Row: {
          course_id: string | null
          id: string
          is_required: boolean | null
          lesson_id: string | null
          sequence_order: number
        }
        Insert: {
          course_id?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          sequence_order: number
        }
        Update: {
          course_id?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          org_id: string
          passing_threshold: number | null
          required_for_onboarding: boolean | null
          title: string
          unlocks_capability: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          org_id?: string
          passing_threshold?: number | null
          required_for_onboarding?: boolean | null
          title: string
          unlocks_capability?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          org_id?: string
          passing_threshold?: number | null
          required_for_onboarding?: boolean | null
          title?: string
          unlocks_capability?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_catalog: {
        Row: {
          assigned_to_roles: string[] | null
          completion_reward_points: number | null
          created_at: string | null
          custom_completion_message: string | null
          custom_deadline: string | null
          custom_intro: string | null
          custom_notes: string | null
          custom_title: string | null
          id: string
          is_enabled: boolean | null
          is_mandatory: boolean | null
          library_item_id: string
          org_id: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to_roles?: string[] | null
          completion_reward_points?: number | null
          created_at?: string | null
          custom_completion_message?: string | null
          custom_deadline?: string | null
          custom_intro?: string | null
          custom_notes?: string | null
          custom_title?: string | null
          id?: string
          is_enabled?: boolean | null
          is_mandatory?: boolean | null
          library_item_id: string
          org_id: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to_roles?: string[] | null
          completion_reward_points?: number | null
          created_at?: string | null
          custom_completion_message?: string | null
          custom_deadline?: string | null
          custom_intro?: string | null
          custom_notes?: string | null
          custom_title?: string | null
          id?: string
          is_enabled?: boolean | null
          is_mandatory?: boolean | null
          library_item_id?: string
          org_id?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_catalog_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "learning_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_library: {
        Row: {
          content: Json | null
          content_type: Database["public"]["Enums"]["learning_content_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes: number | null
          id: string
          learning_objectives: string[] | null
          org_id: string | null
          required_for_license: string[] | null
          status: Database["public"]["Enums"]["learning_status"]
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content?: Json | null
          content_type: Database["public"]["Enums"]["learning_content_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          learning_objectives?: string[] | null
          org_id?: string | null
          required_for_license?: string[] | null
          status?: Database["public"]["Enums"]["learning_status"]
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: Json | null
          content_type?: Database["public"]["Enums"]["learning_content_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          learning_objectives?: string[] | null
          org_id?: string | null
          required_for_license?: string[] | null
          status?: Database["public"]["Enums"]["learning_status"]
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_library_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          max_score: number | null
          org_id: string | null
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string
          time_spent: number | null
          user_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          max_score?: number | null
          org_id?: string | null
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_spent?: number | null
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          max_score?: number | null
          org_id?: string | null
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_attempts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          is_published: boolean | null
          lesson_type: string
          org_id: string
          passing_score: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          lesson_type?: string
          org_id?: string
          passing_score?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          lesson_type?: string
          org_id?: string
          passing_score?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          sector: string | null
          settings: Json | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          sector?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sector?: string | null
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_rijbewijs_obtained_at: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          has_ai_rijbewijs: boolean | null
          id: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          ai_rijbewijs_obtained_at?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          has_ai_rijbewijs?: boolean | null
          id: string
          org_id?: string
          updated_at?: string | null
        }
        Update: {
          ai_rijbewijs_obtained_at?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          has_ai_rijbewijs?: boolean | null
          id?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_completions: {
        Row: {
          capability_unlocked: string | null
          completed_at: string | null
          course_id: string
          final_score: number | null
          id: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          capability_unlocked?: string | null
          completed_at?: string | null
          course_id: string
          final_score?: number | null
          id?: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          capability_unlocked?: string | null
          completed_at?: string | null
          course_id?: string
          final_score?: number | null
          id?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_completions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          course_id: string
          id: string
          lessons_completed: number | null
          lessons_required: number
          org_id: string | null
          progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          lessons_completed?: number | null
          lessons_required: number
          org_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          lessons_completed?: number | null
          lessons_required?: number
          org_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_completions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          org_id: string | null
          score: number | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          org_id?: string | null
          score?: number | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          org_id?: string | null
          score?: number | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_completions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          blocks_completed: Json | null
          current_block_index: number | null
          id: string
          lesson_id: string
          org_id: string | null
          progress_percentage: number | null
          quiz_attempts: Json | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocks_completed?: Json | null
          current_block_index?: number | null
          id?: string
          lesson_id: string
          org_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: Json | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocks_completed?: Json | null
          current_block_index?: number | null
          id?: string
          lesson_id?: string
          org_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: Json | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_content_editor: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "content_editor"
        | "org_admin"
        | "manager"
      learning_content_type: "course" | "module" | "assessment" | "document"
      learning_difficulty_level: "basic" | "intermediate" | "advanced"
      learning_status: "draft" | "published" | "deprecated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "content_editor",
        "org_admin",
        "manager",
      ],
      learning_content_type: ["course", "module", "assessment", "document"],
      learning_difficulty_level: ["basic", "intermediate", "advanced"],
      learning_status: ["draft", "published", "deprecated"],
    },
  },
} as const

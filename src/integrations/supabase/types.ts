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
      archetype_ml_map: {
        Row: {
          archetype_code: string
          context_card_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          library_item_id: string
          updated_at: string | null
        }
        Insert: {
          archetype_code: string
          context_card_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          library_item_id: string
          updated_at?: string | null
        }
        Update: {
          archetype_code?: string
          context_card_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          library_item_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_ml_map_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "learning_library"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_ml_assignments: {
        Row: {
          assessment_id: string
          assigned_at: string
          context_card_text: string | null
          id: string
          is_required: boolean
          library_item_id: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          assigned_at?: string
          context_card_text?: string | null
          id?: string
          is_required?: boolean
          library_item_id: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          assigned_at?: string
          context_card_text?: string | null
          id?: string
          is_required?: boolean
          library_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_ml_assignments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_ml_assignments_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "learning_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_ml_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_ml_completions: {
        Row: {
          assessment_id: string
          completed_at: string
          id: string
          library_item_id: string
          module_version: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string
          id?: string
          library_item_id: string
          module_version?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string
          id?: string
          library_item_id?: string
          module_version?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_ml_completions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_ml_completions_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "learning_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_ml_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          archetype_refs: string[]
          claude_input_hash: string | null
          created_at: string
          created_by: string
          decision_version: string
          dpia_required: boolean
          dpo_instructions: string[] | null
          dpo_oversight_required: boolean
          escalation_refs: string[] | null
          eu_act_category: string | null
          fria_required: boolean
          id: string
          org_id: string
          plain_language: string
          primary_archetype: string
          reason_filtered: string | null
          reviewed_at: string | null
          reviewer_admin_id: string | null
          route: Database["public"]["Enums"]["assessment_route"]
          routing_method: Database["public"]["Enums"]["routing_method"]
          secondary_archetypes: string[] | null
          status: Database["public"]["Enums"]["assessment_status"]
          survey_answers: Json
          tool_id: string | null
          tool_name_raw: string
          transparency_required: boolean
          transparency_template: string | null
          updated_at: string
          user_instructions: string[] | null
        }
        Insert: {
          archetype_refs: string[]
          claude_input_hash?: string | null
          created_at?: string
          created_by: string
          decision_version: string
          dpia_required?: boolean
          dpo_instructions?: string[] | null
          dpo_oversight_required?: boolean
          escalation_refs?: string[] | null
          eu_act_category?: string | null
          fria_required?: boolean
          id?: string
          org_id: string
          plain_language: string
          primary_archetype: string
          reason_filtered?: string | null
          reviewed_at?: string | null
          reviewer_admin_id?: string | null
          route: Database["public"]["Enums"]["assessment_route"]
          routing_method?: Database["public"]["Enums"]["routing_method"]
          secondary_archetypes?: string[] | null
          status?: Database["public"]["Enums"]["assessment_status"]
          survey_answers: Json
          tool_id?: string | null
          tool_name_raw: string
          transparency_required?: boolean
          transparency_template?: string | null
          updated_at?: string
          user_instructions?: string[] | null
        }
        Update: {
          archetype_refs?: string[]
          claude_input_hash?: string | null
          created_at?: string
          created_by?: string
          decision_version?: string
          dpia_required?: boolean
          dpo_instructions?: string[] | null
          dpo_oversight_required?: boolean
          escalation_refs?: string[] | null
          eu_act_category?: string | null
          fria_required?: boolean
          id?: string
          org_id?: string
          plain_language?: string
          primary_archetype?: string
          reason_filtered?: string | null
          reviewed_at?: string | null
          reviewer_admin_id?: string | null
          route?: Database["public"]["Enums"]["assessment_route"]
          routing_method?: Database["public"]["Enums"]["routing_method"]
          secondary_archetypes?: string[] | null
          status?: Database["public"]["Enums"]["assessment_status"]
          survey_answers?: Json
          tool_id?: string | null
          tool_name_raw?: string
          transparency_required?: boolean
          transparency_template?: string | null
          updated_at?: string
          user_instructions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_reviewer_admin_id_fkey"
            columns: ["reviewer_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      dpo_notifications: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          assessment_id: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          seen_at: string | null
          status: Database["public"]["Enums"]["dpo_notification_status"]
          type: Database["public"]["Enums"]["dpo_notification_type"]
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          assessment_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["dpo_notification_status"]
          type: Database["public"]["Enums"]["dpo_notification_type"]
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          assessment_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["dpo_notification_status"]
          type?: Database["public"]["Enums"]["dpo_notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "dpo_notifications_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dpo_notifications_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dpo_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assessment_id: string | null
          created_at: string
          description: string
          dpo_action: Database["public"]["Enums"]["incident_dpo_action"] | null
          dpo_notes: string | null
          dpo_notified: boolean
          dpo_reviewed_at: string | null
          dpo_reviewed_by: string | null
          id: string
          org_id: string
          output_used: string | null
          reported_by: string
          severity: Database["public"]["Enums"]["incident_severity"]
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          description: string
          dpo_action?: Database["public"]["Enums"]["incident_dpo_action"] | null
          dpo_notes?: string | null
          dpo_notified?: boolean
          dpo_reviewed_at?: string | null
          dpo_reviewed_by?: string | null
          id?: string
          org_id: string
          output_used?: string | null
          reported_by: string
          severity: Database["public"]["Enums"]["incident_severity"]
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          description?: string
          dpo_action?: Database["public"]["Enums"]["incident_dpo_action"] | null
          dpo_notes?: string | null
          dpo_notified?: boolean
          dpo_reviewed_at?: string | null
          dpo_reviewed_by?: string | null
          id?: string
          org_id?: string
          output_used?: string | null
          reported_by?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_dpo_reviewed_by_fkey"
            columns: ["dpo_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_answers: {
        Row: {
          answered_at: string | null
          attempt_number: number | null
          id: string
          is_correct: boolean | null
          lesson_id: string
          org_id: string | null
          points_earned: number | null
          question_id: string
          time_spent_seconds: number | null
          user_answer: Json
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          attempt_number?: number | null
          id?: string
          is_correct?: boolean | null
          lesson_id: string
          org_id?: string | null
          points_earned?: number | null
          question_id: string
          time_spent_seconds?: number | null
          user_answer: Json
          user_id: string
        }
        Update: {
          answered_at?: string | null
          attempt_number?: number | null
          id?: string
          is_correct?: boolean | null
          lesson_id?: string
          org_id?: string | null
          points_earned?: number | null
          question_id?: string
          time_spent_seconds?: number | null
          user_answer?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_answers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_answers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "learning_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          archetype_codes: string[] | null
          cluster_id: string | null
          content: Json | null
          content_type: Database["public"]["Enums"]["learning_content_type"]
          context_card: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes: number | null
          id: string
          is_activation_req: boolean | null
          learning_objectives: string[] | null
          lesson_id: string | null
          org_id: string | null
          required_for_license: string[] | null
          status: Database["public"]["Enums"]["learning_status"]
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          archetype_codes?: string[] | null
          cluster_id?: string | null
          content?: Json | null
          content_type: Database["public"]["Enums"]["learning_content_type"]
          context_card?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          is_activation_req?: boolean | null
          learning_objectives?: string[] | null
          lesson_id?: string | null
          org_id?: string | null
          required_for_license?: string[] | null
          status?: Database["public"]["Enums"]["learning_status"]
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          archetype_codes?: string[] | null
          cluster_id?: string | null
          content?: Json | null
          content_type?: Database["public"]["Enums"]["learning_content_type"]
          context_card?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["learning_difficulty_level"]
            | null
          estimated_duration_minutes?: number | null
          id?: string
          is_activation_req?: boolean | null
          learning_objectives?: string[] | null
          lesson_id?: string | null
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
            foreignKeyName: "learning_library_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      learning_questions: {
        Row: {
          correct_answer: Json
          created_at: string | null
          created_by: string | null
          explanation: string | null
          id: string
          is_required: boolean | null
          lesson_id: string | null
          order_index: number
          org_id: string | null
          points: number | null
          question_config: Json
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          updated_at: string | null
        }
        Insert: {
          correct_answer?: Json
          created_at?: string | null
          created_by?: string | null
          explanation?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          order_index?: number
          org_id?: string | null
          points?: number | null
          question_config?: Json
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Update: {
          correct_answer?: Json
          created_at?: string | null
          created_by?: string | null
          explanation?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          order_index?: number
          org_id?: string | null
          points?: number | null
          question_config?: Json
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_questions_org_id_fkey"
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
      model_typekaart_updates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_type: string | null
          confidence: string | null
          created_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          source: string | null
          status: string | null
          typekaart_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_type?: string | null
          confidence?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source?: string | null
          status?: string | null
          typekaart_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_type?: string | null
          confidence?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source?: string | null
          status?: string | null
          typekaart_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_typekaart_updates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_typekaart_updates_typekaart_id_fkey"
            columns: ["typekaart_id"]
            isOneToOne: false
            referencedRelation: "model_typekaarten"
            referencedColumns: ["id"]
          },
        ]
      }
      model_typekaarten: {
        Row: {
          canonical_id: string
          contractual_restrictions: Json | null
          created_at: string | null
          created_by: string | null
          data_storage_region: string | null
          display_name: string
          dpa_available: boolean | null
          eu_license_status: string | null
          gpai_designated: boolean | null
          hosting_region: string | null
          id: string
          last_verified_at: string | null
          model_type: string
          provider: string
          status: string | null
          statutory_prohibitions: Json | null
          systemic_risk: boolean | null
          trains_on_input: boolean | null
          typekaart_version: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_id: string
          contractual_restrictions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_storage_region?: string | null
          display_name: string
          dpa_available?: boolean | null
          eu_license_status?: string | null
          gpai_designated?: boolean | null
          hosting_region?: string | null
          id?: string
          last_verified_at?: string | null
          model_type: string
          provider: string
          status?: string | null
          statutory_prohibitions?: Json | null
          systemic_risk?: boolean | null
          trains_on_input?: boolean | null
          typekaart_version?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_id?: string
          contractual_restrictions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_storage_region?: string | null
          display_name?: string
          dpa_available?: boolean | null
          eu_license_status?: string | null
          gpai_designated?: boolean | null
          hosting_region?: string | null
          id?: string
          last_verified_at?: string | null
          model_type?: string
          provider?: string
          status?: string | null
          statutory_prohibitions?: Json | null
          systemic_risk?: boolean | null
          trains_on_input?: boolean | null
          typekaart_version?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_typekaarten_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_tools_catalog: {
        Row: {
          added_at: string | null
          added_by: string | null
          id: string
          notes: string | null
          org_id: string
          override_acknowledged_at: string | null
          override_acknowledged_by: string | null
          override_data_storage: string | null
          override_trains_on_input: boolean | null
          status: string
          tool_name: string
          typekaart_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          override_acknowledged_at?: string | null
          override_acknowledged_by?: string | null
          override_data_storage?: string | null
          override_trains_on_input?: boolean | null
          status?: string
          tool_name: string
          typekaart_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          override_acknowledged_at?: string | null
          override_acknowledged_by?: string | null
          override_data_storage?: string | null
          override_trains_on_input?: boolean | null
          status?: string
          tool_name?: string
          typekaart_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_tools_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_tools_catalog_override_acknowledged_by_fkey"
            columns: ["override_acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          plan_type: string
          postal_code: string | null
          scoreboard_config: Json
          scoreboard_enabled: boolean
          scoreboard_slug: string | null
          sector: string | null
          settings: Json | null
          slug: string | null
          status: string | null
          street_address: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_type: string | null
          updated_at: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          plan_type?: string
          postal_code?: string | null
          scoreboard_config?: Json
          scoreboard_enabled?: boolean
          scoreboard_slug?: string | null
          sector?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string | null
          street_address?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          plan_type?: string
          postal_code?: string | null
          scoreboard_config?: Json
          scoreboard_enabled?: boolean
          scoreboard_slug?: string | null
          sector?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string | null
          street_address?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      passport_identity: {
        Row: {
          ai_policy_url: string | null
          created_at: string | null
          dpo_email: string | null
          dpo_name: string | null
          governance_scope: string | null
          id: string
          last_reviewed_at: string | null
          org_description: string | null
          org_id: string
          review_cycle: string | null
          updated_at: string | null
        }
        Insert: {
          ai_policy_url?: string | null
          created_at?: string | null
          dpo_email?: string | null
          dpo_name?: string | null
          governance_scope?: string | null
          id?: string
          last_reviewed_at?: string | null
          org_description?: string | null
          org_id: string
          review_cycle?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_policy_url?: string | null
          created_at?: string | null
          dpo_email?: string | null
          dpo_name?: string | null
          governance_scope?: string | null
          id?: string
          last_reviewed_at?: string | null
          org_description?: string | null
          org_id?: string
          review_cycle?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passport_identity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          import_batch_id: string | null
          org_id: string
          routeai_invited_at: string | null
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
          import_batch_id?: string | null
          org_id?: string
          routeai_invited_at?: string | null
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
          import_batch_id?: string | null
          org_id?: string
          routeai_invited_at?: string | null
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
      rijbewijs_records: {
        Row: {
          earned_at: string | null
          exam_version: string
          id: string
          lesson_attempt_id: string | null
          org_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          earned_at?: string | null
          exam_version?: string
          id?: string
          lesson_attempt_id?: string | null
          org_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          earned_at?: string | null
          exam_version?: string
          id?: string
          lesson_attempt_id?: string | null
          org_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rijbewijs_records_lesson_attempt_id_fkey"
            columns: ["lesson_attempt_id"]
            isOneToOne: false
            referencedRelation: "lesson_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rijbewijs_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_survey_reports: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          import_status: string | null
          imported_to_routeai_at: string | null
          org_id: string
          report_data: Json
          survey_version: string
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          import_status?: string | null
          imported_to_routeai_at?: string | null
          org_id: string
          report_data?: Json
          survey_version?: string
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          import_status?: string | null
          imported_to_routeai_at?: string | null
          org_id?: string
          report_data?: Json
          survey_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadow_survey_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_survey_runs: {
        Row: {
          ai_maturity_score: number | null
          amnesty_acknowledged: boolean | null
          assigned_tier: string | null
          data_classification: string | null
          department: string | null
          dpo_review_required: boolean | null
          extra_data: Json | null
          id: string
          org_id: string
          primary_concern: string | null
          primary_use_case: string | null
          review_notes: string | null
          risk_score: number | null
          role_description: string | null
          scoreboard_name_visible: boolean | null
          submitted_at: string | null
          survey_completed_at: string | null
          survey_version: string
          user_id: string | null
        }
        Insert: {
          ai_maturity_score?: number | null
          amnesty_acknowledged?: boolean | null
          assigned_tier?: string | null
          data_classification?: string | null
          department?: string | null
          dpo_review_required?: boolean | null
          extra_data?: Json | null
          id?: string
          org_id: string
          primary_concern?: string | null
          primary_use_case?: string | null
          review_notes?: string | null
          risk_score?: number | null
          role_description?: string | null
          scoreboard_name_visible?: boolean | null
          submitted_at?: string | null
          survey_completed_at?: string | null
          survey_version?: string
          user_id?: string | null
        }
        Update: {
          ai_maturity_score?: number | null
          amnesty_acknowledged?: boolean | null
          assigned_tier?: string | null
          data_classification?: string | null
          department?: string | null
          dpo_review_required?: boolean | null
          extra_data?: Json | null
          id?: string
          org_id?: string
          primary_concern?: string | null
          primary_use_case?: string | null
          review_notes?: string | null
          risk_score?: number | null
          role_description?: string | null
          scoreboard_name_visible?: boolean | null
          submitted_at?: string | null
          survey_completed_at?: string | null
          survey_version?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shadow_survey_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_discoveries: {
        Row: {
          application_risk_class: string | null
          data_types_used: string[] | null
          department: string | null
          eu_ai_act_context: string | null
          id: string
          org_id: string
          resulting_tool_id: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          submitted_by: string | null
          survey_run_id: string | null
          tool_name: string
          use_case: string | null
          use_frequency: string | null
          vendor: string | null
        }
        Insert: {
          application_risk_class?: string | null
          data_types_used?: string[] | null
          department?: string | null
          eu_ai_act_context?: string | null
          id?: string
          org_id: string
          resulting_tool_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          survey_run_id?: string | null
          tool_name: string
          use_case?: string | null
          use_frequency?: string | null
          vendor?: string | null
        }
        Update: {
          application_risk_class?: string | null
          data_types_used?: string[] | null
          department?: string | null
          eu_ai_act_context?: string | null
          id?: string
          org_id?: string
          resulting_tool_id?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          survey_run_id?: string | null
          tool_name?: string
          use_case?: string | null
          use_frequency?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_discoveries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_discoveries_resulting_tool_id_fkey"
            columns: ["resulting_tool_id"]
            isOneToOne: false
            referencedRelation: "tools_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_discoveries_survey_run_id_fkey"
            columns: ["survey_run_id"]
            isOneToOne: false
            referencedRelation: "shadow_survey_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tools_catalog: {
        Row: {
          allowed_roles: string[] | null
          contract_expiry_date: string | null
          contract_reference: string | null
          cost_center: string | null
          created_at: string | null
          custom_display_name: string | null
          custom_guidelines: string | null
          custom_icon_url: string | null
          custom_risk_notes: string | null
          display_priority: number | null
          id: string
          is_enabled: boolean | null
          monthly_cost: number | null
          notes: string | null
          org_id: string
          procurement_contact: string | null
          procurement_date: string | null
          requires_approval: boolean | null
          tool_id: string
          updated_at: string | null
          usage_limits: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          contract_expiry_date?: string | null
          contract_reference?: string | null
          cost_center?: string | null
          created_at?: string | null
          custom_display_name?: string | null
          custom_guidelines?: string | null
          custom_icon_url?: string | null
          custom_risk_notes?: string | null
          display_priority?: number | null
          id?: string
          is_enabled?: boolean | null
          monthly_cost?: number | null
          notes?: string | null
          org_id: string
          procurement_contact?: string | null
          procurement_date?: string | null
          requires_approval?: boolean | null
          tool_id: string
          updated_at?: string | null
          usage_limits?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          contract_expiry_date?: string | null
          contract_reference?: string | null
          cost_center?: string | null
          created_at?: string | null
          custom_display_name?: string | null
          custom_guidelines?: string | null
          custom_icon_url?: string | null
          custom_risk_notes?: string | null
          display_priority?: number | null
          id?: string
          is_enabled?: boolean | null
          monthly_cost?: number | null
          notes?: string | null
          org_id?: string
          procurement_contact?: string | null
          procurement_date?: string | null
          requires_approval?: boolean | null
          tool_id?: string
          updated_at?: string | null
          usage_limits?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_catalog_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools_library"
            referencedColumns: ["id"]
          },
        ]
      }
      tools_library: {
        Row: {
          api_available: boolean | null
          capabilities: string[] | null
          category: string | null
          contract_required: boolean | null
          created_at: string | null
          created_by: string | null
          data_residency: string | null
          description: string | null
          gpai_status: boolean | null
          hosting_location: string | null
          id: string
          model_type: string | null
          name: string
          org_id: string | null
          status: string | null
          updated_at: string | null
          vendor: string
          vendor_privacy_policy_url: string | null
          vendor_terms_url: string | null
          vendor_website_url: string | null
          version: string | null
        }
        Insert: {
          api_available?: boolean | null
          capabilities?: string[] | null
          category?: string | null
          contract_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_residency?: string | null
          description?: string | null
          gpai_status?: boolean | null
          hosting_location?: string | null
          id?: string
          model_type?: string | null
          name: string
          org_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor: string
          vendor_privacy_policy_url?: string | null
          vendor_terms_url?: string | null
          vendor_website_url?: string | null
          version?: string | null
        }
        Update: {
          api_available?: boolean | null
          capabilities?: string[] | null
          category?: string | null
          contract_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_residency?: string | null
          description?: string | null
          gpai_status?: boolean | null
          hosting_location?: string | null
          id?: string
          model_type?: string | null
          name?: string
          org_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor?: string
          vendor_privacy_policy_url?: string | null
          vendor_terms_url?: string | null
          vendor_website_url?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_library_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_type: string
          earned_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_org_id_fkey"
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
        | "user"
        | "super_admin"
        | "content_editor"
        | "org_admin"
        | "manager"
        | "dpo"
      assessment_route: "green" | "yellow" | "orange" | "red"
      assessment_status:
        | "active"
        | "paused"
        | "stopped"
        | "superseded"
        | "pending_review"
        | "pending_dpo"
      dpo_notification_status: "pending" | "seen" | "actioned" | "dismissed"
      dpo_notification_type:
        | "orange_route_new"
        | "red_route_blocked"
        | "incident_high"
        | "reexam_required"
        | "tool_discovery_pending"
      incident_dpo_action:
        | "auto_handled"
        | "reviewed"
        | "intervention_planned"
        | "resolved"
      incident_severity: "low" | "medium" | "high"
      learning_content_type:
        | "course"
        | "module"
        | "assessment"
        | "document"
        | "microlearning"
      learning_difficulty_level: "basic" | "intermediate" | "advanced"
      learning_status: "draft" | "published" | "deprecated"
      question_type:
        | "multiple_choice"
        | "multiple_select"
        | "true_false"
        | "fill_in"
        | "essay"
      routing_method: "deterministic" | "claude_assisted"
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
        "user",
        "super_admin",
        "content_editor",
        "org_admin",
        "manager",
        "dpo",
      ],
      assessment_route: ["green", "yellow", "orange", "red"],
      assessment_status: [
        "active",
        "paused",
        "stopped",
        "superseded",
        "pending_review",
        "pending_dpo",
      ],
      dpo_notification_status: ["pending", "seen", "actioned", "dismissed"],
      dpo_notification_type: [
        "orange_route_new",
        "red_route_blocked",
        "incident_high",
        "reexam_required",
        "tool_discovery_pending",
      ],
      incident_dpo_action: [
        "auto_handled",
        "reviewed",
        "intervention_planned",
        "resolved",
      ],
      incident_severity: ["low", "medium", "high"],
      learning_content_type: [
        "course",
        "module",
        "assessment",
        "document",
        "microlearning",
      ],
      learning_difficulty_level: ["basic", "intermediate", "advanced"],
      learning_status: ["draft", "published", "deprecated"],
      question_type: [
        "multiple_choice",
        "multiple_select",
        "true_false",
        "fill_in",
        "essay",
      ],
      routing_method: ["deterministic", "claude_assisted"],
    },
  },
} as const

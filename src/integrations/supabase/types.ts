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
          department: string | null
          id: string
          org_id: string
          role_description: string | null
          submitted_at: string | null
          survey_version: string
          user_id: string | null
        }
        Insert: {
          ai_maturity_score?: number | null
          amnesty_acknowledged?: boolean | null
          department?: string | null
          id?: string
          org_id: string
          role_description?: string | null
          submitted_at?: string | null
          survey_version?: string
          user_id?: string | null
        }
        Update: {
          ai_maturity_score?: number | null
          amnesty_acknowledged?: boolean | null
          department?: string | null
          id?: string
          org_id?: string
          role_description?: string | null
          submitted_at?: string | null
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
          data_types_used: string[] | null
          department: string | null
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
          data_types_used?: string[] | null
          department?: string | null
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
          data_types_used?: string[] | null
          department?: string | null
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
      learning_content_type: "course" | "module" | "assessment" | "document"
      learning_difficulty_level: "basic" | "intermediate" | "advanced"
      learning_status: "draft" | "published" | "deprecated"
      question_type:
        | "multiple_choice"
        | "multiple_select"
        | "true_false"
        | "fill_in"
        | "essay"
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
      ],
      learning_content_type: ["course", "module", "assessment", "document"],
      learning_difficulty_level: ["basic", "intermediate", "advanced"],
      learning_status: ["draft", "published", "deprecated"],
      question_type: [
        "multiple_choice",
        "multiple_select",
        "true_false",
        "fill_in",
        "essay",
      ],
    },
  },
} as const

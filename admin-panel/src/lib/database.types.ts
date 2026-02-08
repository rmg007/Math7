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
      ai_generation_sessions: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          difficulty_distribution: Json | null
          generation_time_ms: number | null
          id: string
          model_used: string
          prompt_text: string
          questions_generated: number
          questions_imported: number
          raw_response: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          skill_id: string | null
          source_document_id: string | null
          status: string | null
          token_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          difficulty_distribution?: Json | null
          generation_time_ms?: number | null
          id?: string
          model_used: string
          prompt_text: string
          questions_generated?: number
          questions_imported?: number
          raw_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_id?: string | null
          source_document_id?: string | null
          status?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          difficulty_distribution?: Json | null
          generation_time_ms?: number | null
          id?: string
          model_used?: string
          prompt_text?: string
          questions_generated?: number
          questions_imported?: number
          raw_response?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skill_id?: string | null
          source_document_id?: string | null
          status?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_sessions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "ai_generation_sessions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      app_landing_pages: {
        Row: {
          app_id: string
          content: Json | null
          created_at: string
          features: Json | null
          hero_headline: string | null
          hero_subtext: string | null
          meta_title: string | null
          meta_description: string | null
          is_published: boolean | null
          landing_page_id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          content?: Json | null
          created_at?: string
          features?: Json | null
          hero_headline?: string | null
          hero_subtext?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean | null
          landing_page_id?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          content?: Json | null
          created_at?: string
          features?: Json | null
          hero_headline?: string | null
          hero_subtext?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean | null
          landing_page_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_landing_pages_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      apps: {
        Row: {
          app_id: string
          color_hex: string | null
          created_at: string
          display_name: string
          grade_level: string | null
          grade_number: number | null
          is_active: boolean
          subject_id: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          app_id?: string
          color_hex?: string | null
          created_at?: string
          display_name: string
          grade_level?: string | null
          grade_number?: number | null
          is_active?: boolean
          subject_id: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          color_hex?: string | null
          created_at?: string
          display_name?: string
          grade_level?: string | null
          grade_number?: number | null
          is_active?: boolean
          subject_id?: string
          subdomain?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apps_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      assignments: {
        Row: {
          completion_trigger: Json | null
          created_at: string
          due_date: string | null
          group_id: string | null
          id: string
          scope: Database["public"]["Enums"]["assignment_scope"] | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          student_id: string | null
          target_id: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at: string
        }
        Insert: {
          completion_trigger?: Json | null
          created_at?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id?: string | null
          target_id: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
        }
        Update: {
          completion_trigger?: Json | null
          created_at?: string
          due_date?: string | null
          group_id?: string | null
          id?: string
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id?: string | null
          target_id?: string
          type?: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answered: Json
          app_id: string | null
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          score_awarded: number
          session_id: string | null
          time_spent_ms: number | null
          user_id: string
        }
        Insert: {
          answered: Json
          app_id?: string | null
          created_at?: string
          id?: string
          is_correct: boolean
          points_earned?: number
          question_id: string
          score_awarded?: number
          session_id?: string | null
          time_spent_ms?: number | null
          user_id: string
        }
        Update: {
          answered?: Json
          app_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          score_awarded?: number
          session_id?: string | null
          time_spent_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_meta: {
        Row: {
          app_id: string
          created_at: string
          last_published_at: string | null
          published_by: string | null
          updated_at: string
          version: number
        }
        Insert: {
          app_id: string
          created_at?: string
          last_published_at?: string | null
          published_by?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          app_id?: string
          created_at?: string
          last_published_at?: string | null
          published_by?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_meta_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "curriculum_meta_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_snapshots: {
        Row: {
          id: string
          version: number
          content: Json
          domains_count: number
          skills_count: number
          questions_count: number
          published_at: string
          created_at: string
        }
        Insert: {
          id?: string
          version: number
          content: Json
          domains_count?: number
          skills_count?: number
          questions_count?: number
          published_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          version?: number
          content?: Json
          domains_count?: number
          skills_count?: number
          questions_count?: number
          published_at?: string
          created_at?: string
        }
        Relationships: []
      }

      domains: {
        Row: {
          app_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          domain_id: string
          title: string
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["curriculum_status"] | null
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string
          title: string
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string
          title?: string
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "domains_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_join_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          anonymous_device_id: string | null
          group_id: string
          id: string
          joined_at: string | null
          nickname: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_device_id?: string | null
          group_id: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_device_id?: string | null
          group_id?: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          allow_anonymous: boolean | null
          app_id: string | null
          created_at: string | null
          id: string
          join_code: string
          name: string
          owner_id: string
          requires_approval: boolean
          type: Database["public"]["Enums"]["group_type"]
          updated_at: string | null
        }
        Insert: {
          allow_anonymous?: boolean | null
          app_id?: string | null
          created_at?: string | null
          id?: string
          join_code: string
          name: string
          owner_id: string
          requires_approval?: boolean
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string | null
        }
        Update: {
          allow_anonymous?: boolean | null
          app_id?: string | null
          created_at?: string | null
          id?: string
          join_code?: string
          name?: string
          owner_id?: string
          requires_approval?: boolean
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      known_issues: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          error_message: string | null
          id: string
          resolution: string | null
          root_cause: string | null
          sentry_link: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          resolution?: string | null
          root_cause?: string | null
          sentry_link?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          resolution?: string | null
          root_cause?: string | null
          sentry_link?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_id: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      questions: {
        Row: {
          app_id: string
          created_at: string
          deleted_at: string | null
          explanation: string | null
          metadata: Json | null
          options: Json | null
          points: number
          question_id: string
          content: string
          skill_id: string
          solution: Json | null
          sort_order: number | null
          status: Database["public"]["Enums"]["curriculum_status"] | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          deleted_at?: string | null
          explanation?: string | null
          metadata?: Json | null
          options?: Json | null
          question_id?: string
          content: string
          skill_id: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          deleted_at?: string | null
          explanation?: string | null
          metadata?: Json | null
          options?: Json | null
          question_id?: string
          content?: string
          skill_id?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      skill_progress: {
        Row: {
          correct_attempts: number | null
          created_at: string
          current_streak: number | null
          id: string
          last_attempt_at: string | null
          longest_streak: number | null
          mastery_level: number | null
          skill_id: string
          total_attempts: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_attempts?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_attempt_at?: string | null
          longest_streak?: number | null
          mastery_level?: number | null
          skill_id: string
          total_attempts?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_attempts?: number | null
          created_at?: string
          current_streak?: number | null
          id?: string
          last_attempt_at?: string | null
          longest_streak?: number | null
          mastery_level?: number | null
          skill_id?: string
          total_attempts?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "skill_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          app_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          difficulty_level: number | null
          domain_id: string | null
          title: string
          skill_id: string
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["curriculum_status"] | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string | null
          title: string
          skill_id?: string
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string | null
          title?: string
          skill_id?: string
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "skills_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["domain_id"]
          },
        ]
      }
      source_documents: {
        Row: {
          app_id: string
          content_extraction_status: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          content_extraction_status?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          content_extraction_status?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      student_recovery_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          student_id: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          student_id: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          student_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_recovery_keys_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon_name: string | null
          name: string
          slug: string
          subject_id: string
          color_hex: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          name: string
          slug: string
          subject_id?: string
          color_hex?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          name?: string
          slug?: string
          subject_id?: string
          color_hex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_tenant_tokens: {
        Args: {
          p_app_id: string
          p_token_count: number
        }
        Returns: Json
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_severity: string
          p_metadata: Json
          p_app_id: string | null
          p_location: string | null
        }
        Returns: boolean
      }
      publish_curriculum: {
        Args: {
          p_app_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      assignment_scope: "mandatory" | "suggested"
      assignment_status: "pending" | "completed" | "late"
      assignment_type: "skill_mastery" | "time_goal" | "custom"
      curriculum_status: "draft" | "published" | "live"
      group_type: "class" | "family"
      question_type:
        | "multiple_choice"
        | "mcq_multi"
        | "text_input"
        | "boolean"
        | "reorder_steps"
      user_role: "super_admin" | "admin" | "student" | "mentor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
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
      assignment_scope: ["mandatory", "suggested"],
      assignment_status: ["pending", "completed", "late"],
      assignment_type: ["skill_mastery", "time_goal", "custom"],
      curriculum_status: ["draft", "published", "live"],
      group_type: ["class", "family"],
      question_type: [
        "multiple_choice",
        "mcq_multi",
        "text_input",
        "boolean",
        "reorder_steps",
      ],
      user_role: ["super_admin", "admin", "student", "mentor"],
    },
  },
} as const

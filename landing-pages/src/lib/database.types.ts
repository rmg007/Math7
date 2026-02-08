export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_sessions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      app_landing_pages: {
        Row: {
          app_id: string
          config: Json | null
          created_at: string
          custom_css: string | null
          id: string
          slug: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          config?: Json | null
          created_at?: string
          custom_css?: string | null
          id?: string
          slug: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          config?: Json | null
          created_at?: string
          custom_css?: string | null
          id?: string
          slug?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_landing_pages_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          }
        ]
      }
      approval_workflows: {
        Row: {
          assigned_to: string | null
          comments: string | null
          created_at: string
          id: string
          metadata: Json
          session_id: string
          stage: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id: string
          stage: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id?: string
          stage?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflows_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      apps: {
        Row: {
          app_id: string
          config: Json | null
          created_at: string
          description: string | null
          name: string
          owner_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          app_id?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          name: string
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          name?: string
          owner_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apps_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          closed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          scope: Database["public"]["Enums"]["assignment_scope"] | null
          skill_id: string
          status: Database["public"]["Enums"]["assignment_status"] | null
          student_id: string
          title: string
          type: Database["public"]["Enums"]["assignment_type"] | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          skill_id: string
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id: string
          title: string
          type?: Database["public"]["Enums"]["assignment_type"] | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          closed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          skill_id?: string
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id?: string
          title?: string
          type?: Database["public"]["Enums"]["assignment_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      attempts: {
        Row: {
          app_id: string | null
          created_at: string
          id: string
          is_correct: boolean
          metadata: Json | null
          question_id: string
          response: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_correct: boolean
          metadata?: Json | null
          question_id: string
          response?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          metadata?: Json | null
          question_id?: string
          response?: Json | null
          session_id?: string
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
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      content_validation_rules: {
        Row: {
          app_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          params: Json
          rule_type: string
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          params?: Json
          rule_type: string
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          params?: Json
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_validation_rules_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          }
        ]
      }
      domains: {
        Row: {
          app_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          subject_id?: string
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
            referencedColumns: ["id"]
          }
        ]
      }
      generation_audit_log: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
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
          }
        ]
      }
      groups: {
        Row: {
          app_id: string | null
          created_at: string
          description: string | null
          id: string
          join_code: string | null
          name: string
          owner_id: string
          type: Database["public"]["Enums"]["group_type"] | null
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string | null
          name: string
          owner_id: string
          type?: Database["public"]["Enums"]["group_type"] | null
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string | null
          name?: string
          owner_id?: string
          type?: Database["public"]["Enums"]["group_type"] | null
          updated_at?: string
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
          }
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_documents: {
        Row: {
          checksum: string
          created_at: string
          filename: string
          id: string
          metadata: Json | null
          path: string
          updated_at: string
        }
        Insert: {
          checksum: string
          created_at?: string
          filename: string
          id?: string
          metadata?: Json | null
          path: string
          updated_at?: string
        }
        Update: {
          checksum?: string
          created_at?: string
          filename?: string
          id?: string
          metadata?: Json | null
          path?: string
          updated_at?: string
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
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          app_id: string
          content: Json
          created_at: string
          explanation: string | null
          id: string
          metadata: Json | null
          skill_id: string
          sort_order: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          app_id: string
          content: Json
          created_at?: string
          explanation?: string | null
          id?: string
          metadata?: Json | null
          skill_id: string
          sort_order?: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          app_id?: string
          content?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          metadata?: Json | null
          skill_id?: string
          sort_order?: number | null
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
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          app_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          skill_id: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          skill_id: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skill_progress: {
        Row: {
          app_id: string | null
          last_practiced: string | null
          mastery_score: number | null
          skill_id: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          last_practiced?: string | null
          mastery_score?: number | null
          skill_id: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          last_practiced?: string | null
          mastery_score?: number | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_progress_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skills: {
        Row: {
          app_id: string
          created_at: string
          description: string | null
          domain_id: string
          id: string
          metadata: Json | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          description?: string | null
          domain_id: string
          id?: string
          metadata?: Json | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          description?: string | null
          domain_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          sort_order?: number | null
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
            referencedColumns: ["id"]
          }
        ]
      }
      source_documents: {
        Row: {
          app_id: string | null
          created_at: string
          deleted_at: string | null
          error_message: string | null
          extracted_text: string | null
          file_size: number
          filename: string
          id: string
          mime_type: string
          page_count: number | null
          status: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          extracted_text?: string | null
          file_size: number
          filename: string
          id?: string
          mime_type: string
          page_count?: number | null
          status?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          extracted_text?: string | null
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          page_count?: number | null
          status?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "source_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_quotas: {
        Row: {
          app_id: string
          created_at: string
          current_token_usage: number
          id: string
          is_throttled: boolean
          last_reset_date: string
          monthly_token_limit: number
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          current_token_usage?: number
          id?: string
          is_throttled?: boolean
          last_reset_date?: string
          monthly_token_limit?: number
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          current_token_usage?: number
          id?: string
          is_throttled?: boolean
          last_reset_date?: string
          monthly_token_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_quotas_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          }
        ]
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
      get_current_app_id: {
        Args: {}
        Returns: string
      }
      get_user_app_id: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      is_admin: {
        Args: {}
        Returns: boolean
      }
      mark_session_imported: {
        Args: {
          p_session_id: string
          p_imported_count: number
        }
        Returns: undefined
      }
      match_knowledge: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
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

type PublicSchema = Database["public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
          app_id: string | null
          benefits_json: Json | null
          canonical_url: string | null
          created_at: string | null
          hero_cta_text: string | null
          hero_headline: string
          hero_image_url: string | null
          hero_subheadline: string | null
          is_published: boolean | null
          landing_page_id: string
          meta_description: string
          meta_title: string
          og_image_url: string | null
          pricing_json: Json | null
          published_at: string | null
          schema_org_json: Json | null
          syllabus_json: Json | null
          testimonials_json: Json | null
          updated_at: string | null
        }
        Insert: {
          app_id?: string | null
          benefits_json?: Json | null
          canonical_url?: string | null
          created_at?: string | null
          hero_cta_text?: string | null
          hero_headline: string
          hero_image_url?: string | null
          hero_subheadline?: string | null
          is_published?: boolean | null
          landing_page_id?: string
          meta_description: string
          meta_title: string
          og_image_url?: string | null
          pricing_json?: Json | null
          published_at?: string | null
          schema_org_json?: Json | null
          syllabus_json?: Json | null
          testimonials_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string | null
          benefits_json?: Json | null
          canonical_url?: string | null
          created_at?: string | null
          hero_cta_text?: string | null
          hero_headline?: string
          hero_image_url?: string | null
          hero_subheadline?: string | null
          is_published?: boolean | null
          landing_page_id?: string
          meta_description?: string
          meta_title?: string
          og_image_url?: string | null
          pricing_json?: Json | null
          published_at?: string | null
          schema_org_json?: Json | null
          syllabus_json?: Json | null
          testimonials_json?: Json | null
          updated_at?: string | null
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
          },
        ]
      }
      apps: {
        Row: {
          app_id: string
          created_at: string | null
          display_name: string
          full_domain: string | null
          grade_level: string
          grade_number: number | null
          is_active: boolean | null
          launch_date: string | null
          subdomain: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          app_id?: string
          created_at?: string | null
          display_name: string
          full_domain?: string | null
          grade_level: string
          grade_number?: number | null
          is_active?: boolean | null
          launch_date?: string | null
          subdomain: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string | null
          display_name?: string
          full_domain?: string | null
          grade_level?: string
          grade_number?: number | null
          is_active?: boolean | null
          launch_date?: string | null
          subdomain?: string
          subject_id?: string | null
          updated_at?: string | null
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
          app_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_correct: boolean
          question_id: string
          response: Json
          score_awarded: number
          time_spent_ms: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_correct?: boolean
          question_id: string
          response: Json
          score_awarded?: number
          time_spent_ms?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          response?: Json
          score_awarded?: number
          time_spent_ms?: number | null
          updated_at?: string
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
          },
        ]
      }
      curriculum_meta: {
        Row: {
          app_id: string
          id: string
          last_published_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          app_id: string
          id?: string
          last_published_at?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          app_id?: string
          id?: string
          last_published_at?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_meta_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      curriculum_snapshots: {
        Row: {
          app_id: string
          content: Json | null
          created_at: string
          domains_count: number
          id: string
          published_at: string
          questions_count: number
          skills_count: number
          version: number
        }
        Insert: {
          app_id: string
          content?: Json | null
          created_at?: string
          domains_count?: number
          id?: string
          published_at?: string
          questions_count?: number
          skills_count?: number
          version: number
        }
        Update: {
          app_id?: string
          content?: Json | null
          created_at?: string
          domains_count?: number
          id?: string
          published_at?: string
          questions_count?: number
          skills_count?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_snapshots_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      domains: {
        Row: {
          app_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          domain_id: string
          is_published: boolean
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["curriculum_status"]
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["curriculum_status"]
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain_id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["curriculum_status"]
          subject_id?: string | null
          title?: string
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
      error_logs: {
        Row: {
          alert_sent: boolean | null
          app_id: string | null
          app_version: string | null
          created_at: string | null
          error_message: string
          error_type: string
          extra_context: Json | null
          id: string
          occurred_at: string | null
          platform: string
          promoted_to_issue_id: string | null
          stack_trace: string | null
          status: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          app_id?: string | null
          app_version?: string | null
          created_at?: string | null
          error_message: string
          error_type: string
          extra_context?: Json | null
          id?: string
          occurred_at?: string | null
          platform: string
          promoted_to_issue_id?: string | null
          stack_trace?: string | null
          status?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          app_id?: string | null
          app_version?: string | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          extra_context?: Json | null
          id?: string
          occurred_at?: string | null
          platform?: string
          promoted_to_issue_id?: string | null
          stack_trace?: string | null
          status?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "error_logs_promoted_to_issue_id_fkey"
            columns: ["promoted_to_issue_id"]
            isOneToOne: false
            referencedRelation: "known_issues"
            referencedColumns: ["id"]
          },
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
          group_id: string
          is_anonymous: boolean | null
          joined_at: string
          nickname: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          is_anonymous?: boolean | null
          joined_at?: string
          nickname?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          is_anonymous?: boolean | null
          joined_at?: string
          nickname?: string | null
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
          },
        ]
      }
      groups: {
        Row: {
          allow_anonymous_join: boolean | null
          app_id: string | null
          code_expires_at: string | null
          created_at: string
          id: string
          join_code: string
          name: string
          owner_id: string
          requires_approval: boolean
          settings: Json | null
          type: Database["public"]["Enums"]["group_type"]
          updated_at: string
        }
        Insert: {
          allow_anonymous_join?: boolean | null
          app_id?: string | null
          code_expires_at?: string | null
          created_at?: string
          id?: string
          join_code: string
          name: string
          owner_id: string
          requires_approval?: boolean
          settings?: Json | null
          type: Database["public"]["Enums"]["group_type"]
          updated_at?: string
        }
        Update: {
          allow_anonymous_join?: boolean | null
          app_id?: string | null
          code_expires_at?: string | null
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          owner_id?: string
          requires_approval?: boolean
          settings?: Json | null
          type?: Database["public"]["Enums"]["group_type"]
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
          },
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          times_used: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_metrics: {
        Row: {
          complexity_score: number | null
          file_count: number | null
          id: string
          language: string
          last_analyzed_at: string | null
          lines_of_code: number | null
          project_name: string
        }
        Insert: {
          complexity_score?: number | null
          file_count?: number | null
          id?: string
          language: string
          last_analyzed_at?: string | null
          lines_of_code?: number | null
          project_name: string
        }
        Update: {
          complexity_score?: number | null
          file_count?: number | null
          id?: string
          language?: string
          last_analyzed_at?: string | null
          lines_of_code?: number | null
          project_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_metrics_project_name_fkey"
            columns: ["project_name"]
            isOneToOne: false
            referencedRelation: "kb_registry"
            referencedColumns: ["name"]
          },
        ]
      }
      kb_registry: {
        Row: {
          created_at: string | null
          id: string
          last_deployed_at: string | null
          live_url: string | null
          name: string
          platform: string
          status: string | null
          tech_stack: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_deployed_at?: string | null
          live_url?: string | null
          name: string
          platform: string
          status?: string | null
          tech_stack?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_deployed_at?: string | null
          live_url?: string | null
          name?: string
          platform?: string
          status?: string | null
          tech_stack?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string
          content_hash: string
          embedding: string | null
          file_path: string
          id: number
          ki_slug: string
          last_updated_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_hash: string
          embedding?: string | null
          file_path: string
          id?: never
          ki_slug: string
          last_updated_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_hash?: string
          embedding?: string | null
          file_path?: string
          id?: never
          ki_slug?: string
          last_updated_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          breadcrumb: string | null
          content: string
          content_hash: string
          created_at: string | null
          embedding: string
          file_path: string
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          breadcrumb?: string | null
          content: string
          content_hash: string
          created_at?: string | null
          embedding: string
          file_path: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          breadcrumb?: string | null
          content?: string
          content_hash?: string
          created_at?: string | null
          embedding?: string
          file_path?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
          severity: string
          status: string
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
          severity?: string
          status?: string
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
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outbox: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          record_id: string
          retry_count: number
          synced_at: string | null
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          record_id: string
          retry_count?: number
          synced_at?: string | null
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          record_id?: string
          retry_count?: number
          synced_at?: string | null
          table_name?: string
        }
        Relationships: []
      }
      pr_audit_logs: {
        Row: {
          action_taken: string
          confidence: number
          created_at: string | null
          file_path: string
          id: string
          line_number: number | null
          llm_model: string | null
          pr_number: number
          pr_title: string | null
          pr_url: string
          raw_llm_response: Json | null
          repo: string
          rule_id: string
          rule_name: string
          violation_summary: string
        }
        Insert: {
          action_taken?: string
          confidence: number
          created_at?: string | null
          file_path: string
          id?: string
          line_number?: number | null
          llm_model?: string | null
          pr_number: number
          pr_title?: string | null
          pr_url: string
          raw_llm_response?: Json | null
          repo?: string
          rule_id: string
          rule_name: string
          violation_summary: string
        }
        Update: {
          action_taken?: string
          confidence?: number
          created_at?: string | null
          file_path?: string
          id?: string
          line_number?: number | null
          llm_model?: string | null
          pr_number?: number
          pr_title?: string | null
          pr_url?: string
          raw_llm_response?: Json | null
          repo?: string
          rule_id?: string
          rule_name?: string
          violation_summary?: string
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
          content: string
          content_hash: string | null
          created_at: string
          deleted_at: string | null
          explanation: string | null
          is_published: boolean
          options: Json
          points: number
          question_id: string
          skill_id: string
          solution: Json
          sort_order: number | null
          status: Database["public"]["Enums"]["curriculum_status"]
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          app_id: string
          content: string
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          explanation?: string | null
          is_published?: boolean
          options?: Json
          points?: number
          question_id?: string
          skill_id: string
          solution: Json
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"]
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          app_id?: string
          content?: string
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          explanation?: string | null
          is_published?: boolean
          options?: Json
          points?: number
          question_id?: string
          skill_id?: string
          solution?: Json
          sort_order?: number | null
          status?: Database["public"]["Enums"]["curriculum_status"]
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
      security_logs: {
        Row: {
          app_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          id: string
          questions_attempted: number
          questions_correct: number
          skill_id: string | null
          started_at: string
          total_time_ms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          questions_attempted?: number
          questions_correct?: number
          skill_id?: string | null
          started_at?: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          questions_attempted?: number
          questions_correct?: number
          skill_id?: string | null
          started_at?: string
          total_time_ms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_progress: {
        Row: {
          correct_attempts: number
          created_at: string
          current_streak: number
          deleted_at: string | null
          id: string
          last_attempt_at: string | null
          longest_streak: number
          mastery_level: number
          skill_id: string
          total_attempts: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_attempts?: number
          created_at?: string
          current_streak?: number
          deleted_at?: string | null
          id?: string
          last_attempt_at?: string | null
          longest_streak?: number
          mastery_level?: number
          skill_id: string
          total_attempts?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          correct_attempts?: number
          created_at?: string
          current_streak?: number
          deleted_at?: string | null
          id?: string
          last_attempt_at?: string | null
          longest_streak?: number
          mastery_level?: number
          skill_id?: string
          total_attempts?: number
          total_points?: number
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
          domain_id: string
          is_published: boolean
          skill_id: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["curriculum_status"]
          title: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          domain_id: string
          is_published?: boolean
          skill_id?: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["curriculum_status"]
          title: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          domain_id?: string
          is_published?: boolean
          skill_id?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["curriculum_status"]
          title?: string
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
          },
        ]
      }
      spec_validations: {
        Row: {
          app_id: string
          created_at: string | null
          failed_checks: number | null
          findings: Json | null
          git_branch: string | null
          git_commit: string | null
          id: string
          passed_checks: number | null
          pr_number: number | null
          scope: string | null
          severity: string | null
          spec_id: string | null
          status: string
          target_entity: string
          total_checks: number | null
          triggered_by: string | null
          triggered_by_user: string | null
          validation_type: string
        }
        Insert: {
          app_id: string
          created_at?: string | null
          failed_checks?: number | null
          findings?: Json | null
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_checks?: number | null
          pr_number?: number | null
          scope?: string | null
          severity?: string | null
          spec_id?: string | null
          status: string
          target_entity: string
          total_checks?: number | null
          triggered_by?: string | null
          triggered_by_user?: string | null
          validation_type: string
        }
        Update: {
          app_id?: string
          created_at?: string | null
          failed_checks?: number | null
          findings?: Json | null
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_checks?: number | null
          pr_number?: number | null
          scope?: string | null
          severity?: string | null
          spec_id?: string | null
          status?: string
          target_entity?: string
          total_checks?: number | null
          triggered_by?: string | null
          triggered_by_user?: string | null
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spec_validations_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "spec_validations_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "specifications"
            referencedColumns: ["id"]
          },
        ]
      }
      specifications: {
        Row: {
          app_id: string
          author: string | null
          created_at: string | null
          deleted_at: string | null
          embedding: string | null
          entity_name: string
          entity_type: string
          id: string
          requirements: Json | null
          scope: string | null
          source_file: string | null
          spec_content: string
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          app_id: string
          author?: string | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          entity_name: string
          entity_type: string
          id?: string
          requirements?: Json | null
          scope?: string | null
          source_file?: string | null
          spec_content: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          app_id?: string
          author?: string | null
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          requirements?: Json | null
          scope?: string | null
          source_file?: string | null
          spec_content?: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specifications_app_id_fkey"
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
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          launch_date: string | null
          name: string
          slug: string
          status: string | null
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          launch_date?: string | null
          name: string
          slug: string
          status?: string | null
          subject_id?: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          launch_date?: string | null
          name?: string
          slug?: string
          status?: string | null
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_meta: {
        Row: {
          last_synced_at: string
          sync_version: number
          table_name: string
          updated_at: string
        }
        Insert: {
          last_synced_at?: string
          sync_version?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          last_synced_at?: string
          sync_version?: number
          table_name?: string
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
          },
        ]
      }
      user_subscriptions: {
        Row: {
          access_level: string | null
          app_id: string | null
          enrolled_at: string | null
          expires_at: string | null
          last_accessed_at: string | null
          subscription_id: string
          user_id: string | null
        }
        Insert: {
          access_level?: string | null
          app_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          last_accessed_at?: string | null
          subscription_id?: string
          user_id?: string | null
        }
        Update: {
          access_level?: string | null
          app_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          last_accessed_at?: string | null
          subscription_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
    }
    Views: {
      critical_spec_failures: {
        Row: {
          app_id: string | null
          app_name: string | null
          created_at: string | null
          entity_name: string | null
          entity_type: string | null
          findings: Json | null
          git_commit: string | null
          id: string | null
          pr_number: number | null
          severity: string | null
          status: string | null
          target_entity: string | null
          validation_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spec_validations_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
    }
    Functions: {
      batch_submit_attempts: {
        Args: { attempts_json: Json }
        Returns: {
          app_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_correct: boolean
          question_id: string
          response: Json
          score_awarded: number
          time_spent_ms: number | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "attempts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      consume_tenant_tokens: {
        Args: { p_app_id: string; p_token_count: number }
        Returns: Json
      }
      current_app_id: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      deactivate_invitation_code: {
        Args: { p_code_id: string }
        Returns: boolean
      }
      deactivate_own_account: { Args: never; Returns: undefined }
      delete_chunks_by_file: {
        Args: { target_file_path: string }
        Returns: number
      }
      delete_own_account: { Args: never; Returns: undefined }
      end_session: {
        Args: { session_id: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          id: string
          questions_attempted: number
          questions_correct: number
          skill_id: string | null
          started_at: string
          total_time_ms: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_invitation_code: {
        Args: { p_expires_days?: number; p_max_uses?: number }
        Returns: string
      }
      get_ai_system_summary: {
        Args: never
        Returns: {
          active_projects: string[]
          platform_distribution: Json
          total_apps: number
          total_loc: number
        }[]
      }
      get_auth_context: {
        Args: never
        Returns: {
          user_app_id: string
          user_id: string
          user_role: string
        }[]
      }
      get_my_group_memberships: { Args: never; Returns: string[] }
      get_table_schema: { Args: { p_table_name: string }; Returns: Json }
      get_user_progress_summary: { Args: never; Returns: Json }
      import_questions_bulk: {
        Args: { questions_data: Json }
        Returns: {
          inserted_count: number
          skipped_count: number
          success: boolean
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: never; Returns: boolean }
      join_group_by_code: { Args: { code: string }; Returns: Json }
      join_group_via_code: { Args: { join_code_input: string }; Returns: Json }
      jwt_is_admin: { Args: never; Returns: boolean }
      jwt_is_mentor: { Args: never; Returns: boolean }
      jwt_is_super_admin: { Args: never; Returns: boolean }
      log_error: {
        Args: {
          p_app_id?: string
          p_app_version?: string
          p_error_message: string
          p_error_type: string
          p_extra_context?: Json
          p_platform: string
          p_stack_trace?: string
          p_url?: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_app_id?: string
          p_event_type: string
          p_location?: string
          p_metadata?: Json
          p_severity: string
        }
        Returns: undefined
      }
      mark_session_imported: {
        Args: { p_imported_count: number; p_session_id: string }
        Returns: undefined
      }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          breadcrumb: string
          content: string
          file_path: string
          id: string
          similarity: number
        }[]
      }
      promote_error_to_issue: {
        Args: {
          p_error_id: string
          p_resolution?: string
          p_root_cause?: string
          p_title: string
        }
        Returns: string
      }
      prune_old_error_logs: { Args: never; Returns: number }
      publish_curriculum: { Args: { p_app_id?: string }; Returns: Json }
      pull_changes: {
        Args: { last_sync_time: string; table_name: string }
        Returns: Json
      }
      recover_student_identity: {
        Args: { recovery_phrase: string }
        Returns: string
      }
      start_session: {
        Args: { session_type: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          id: string
          questions_attempted: number
          questions_correct: number
          skill_id: string | null
          started_at: string
          total_time_ms: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_attempt_and_update_progress: {
        Args: { attempts_json: Json }
        Returns: {
          correct_attempts: number
          created_at: string
          current_streak: number
          deleted_at: string | null
          id: string
          last_attempt_at: string | null
          longest_streak: number
          mastery_level: number
          skill_id: string
          total_attempts: number
          total_points: number
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "skill_progress"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      use_invitation_code: { Args: { p_code: string }; Returns: boolean }
      validate_invitation_code: { Args: { p_code: string }; Returns: boolean }
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          app_id: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          type: string;
          unlocked_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          type: string;
          unlocked_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          type?: string;
          unlocked_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'achievements_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_generation_sessions: {
        Row: {
          app_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          difficulty_distribution: Json | null;
          generation_time_ms: number | null;
          id: string;
          model_used: string;
          prompt_text: string;
          questions_generated: number;
          questions_imported: number;
          raw_response: Json | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          skill_id: string | null;
          source_document_id: string | null;
          status: string | null;
          token_count: number | null;
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          created_by: string;
          deleted_at?: string | null;
          difficulty_distribution?: Json | null;
          generation_time_ms?: number | null;
          id?: string;
          model_used: string;
          prompt_text: string;
          questions_generated?: number;
          questions_imported?: number;
          raw_response?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          skill_id?: string | null;
          source_document_id?: string | null;
          status?: string | null;
          token_count?: number | null;
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          difficulty_distribution?: Json | null;
          generation_time_ms?: number | null;
          id?: string;
          model_used?: string;
          prompt_text?: string;
          questions_generated?: number;
          questions_imported?: number;
          raw_response?: Json | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          skill_id?: string | null;
          source_document_id?: string | null;
          status?: string | null;
          token_count?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_generation_sessions_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'ai_generation_sessions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generation_sessions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generation_sessions_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
          {
            foreignKeyName: 'ai_generation_sessions_source_document_id_fkey';
            columns: ['source_document_id'];
            isOneToOne: false;
            referencedRelation: 'source_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_token_usage: {
        Row: {
          app_id: string;
          created_at: string | null;
          id: string;
          operation: string;
          tokens_used: number;
          user_id: string | null;
        };
        Insert: {
          app_id: string;
          created_at?: string | null;
          id?: string;
          operation: string;
          tokens_used: number;
          user_id?: string | null;
        };
        Update: {
          app_id?: string;
          created_at?: string | null;
          id?: string;
          operation?: string;
          tokens_used?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_token_usage_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'ai_token_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      app_landing_pages: {
        Row: {
          app_id: string;
          created_at: string | null;
          cta_text: string | null;
          features: Json | null;
          hero_headline: string | null;
          hero_subheadline: string | null;
          is_published: boolean | null;
          landing_page_id: string | null;
          meta_description: string | null;
          meta_title: string | null;
          sections: Json | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          updated_at: string | null;
        };
        Insert: {
          app_id: string;
          created_at?: string | null;
          cta_text?: string | null;
          features?: Json | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          is_published?: boolean | null;
          landing_page_id?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          sections?: Json | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          updated_at?: string | null;
        };
        Update: {
          app_id?: string;
          created_at?: string | null;
          cta_text?: string | null;
          features?: Json | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          is_published?: boolean | null;
          landing_page_id?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          sections?: Json | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'app_landing_pages_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: true;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      approval_workflows: {
        Row: {
          assigned_to: string | null;
          comments: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          session_id: string;
          stage: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          comments?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          session_id: string;
          stage: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          comments?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          session_id?: string;
          stage?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'approval_workflows_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'approval_workflows_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'ai_generation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      apps: {
        Row: {
          ai_token_limit: number | null;
          app_id: string;
          branding: Json | null;
          created_at: string | null;
          description: string | null;
          display_name: string;
          features: Json | null;
          grade_level: string;
          grade_number: number | null;
          is_active: boolean | null;
          subdomain: string;
          subject_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          ai_token_limit?: number | null;
          app_id?: string;
          branding?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          features?: Json | null;
          grade_level: string;
          grade_number?: number | null;
          is_active?: boolean | null;
          subdomain: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ai_token_limit?: number | null;
          app_id?: string;
          branding?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          features?: Json | null;
          grade_level?: string;
          grade_number?: number | null;
          is_active?: boolean | null;
          subdomain?: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'apps_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['subject_id'];
          },
        ];
      };
      assignments: {
        Row: {
          completion_trigger: Json | null;
          created_at: string | null;
          due_date: string | null;
          group_id: string | null;
          id: string;
          scope: Database['public']['Enums']['assignment_scope'] | null;
          status: Database['public']['Enums']['assignment_status'] | null;
          student_id: string | null;
          target_id: string;
          type: Database['public']['Enums']['assignment_type'];
          updated_at: string | null;
        };
        Insert: {
          completion_trigger?: Json | null;
          created_at?: string | null;
          due_date?: string | null;
          group_id?: string | null;
          id?: string;
          scope?: Database['public']['Enums']['assignment_scope'] | null;
          status?: Database['public']['Enums']['assignment_status'] | null;
          student_id?: string | null;
          target_id: string;
          type: Database['public']['Enums']['assignment_type'];
          updated_at?: string | null;
        };
        Update: {
          completion_trigger?: Json | null;
          created_at?: string | null;
          due_date?: string | null;
          group_id?: string | null;
          id?: string;
          scope?: Database['public']['Enums']['assignment_scope'] | null;
          status?: Database['public']['Enums']['assignment_status'] | null;
          student_id?: string | null;
          target_id?: string;
          type?: Database['public']['Enums']['assignment_type'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      attempts: {
        Row: {
          app_id: string | null;
          confidence_rating: number | null;
          created_at: string;
          deleted_at: string | null;
          difficulty_perception: string | null;
          id: string;
          is_correct: boolean;
          question_id: string;
          response: Json;
          score_awarded: number;
          time_spent_ms: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_id?: string | null;
          confidence_rating?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          difficulty_perception?: string | null;
          id?: string;
          is_correct: boolean;
          question_id: string;
          response: Json;
          score_awarded?: number;
          time_spent_ms?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_id?: string | null;
          confidence_rating?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          difficulty_perception?: string | null;
          id?: string;
          is_correct?: boolean;
          question_id?: string;
          response?: Json;
          score_awarded?: number;
          time_spent_ms?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'attempts_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['question_id'];
          },
          {
            foreignKeyName: 'attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_validation_rules: {
        Row: {
          app_id: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          params: Json;
          rule_type: string;
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          params?: Json;
          rule_type: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          params?: Json;
          rule_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_validation_rules_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      curriculum_meta: {
        Row: {
          app_id: string;
          created_at: string;
          last_published_at: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          last_published_at?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          last_published_at?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'curriculum_meta_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: true;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      curriculum_snapshots: {
        Row: {
          app_id: string;
          content: Json;
          created_at: string;
          domains_count: number;
          id: string;
          published_at: string;
          published_by: string | null;
          questions_count: number;
          skills_count: number;
          updated_at: string;
          version: number;
        };
        Insert: {
          app_id: string;
          content?: Json;
          created_at?: string;
          domains_count?: number;
          id?: string;
          published_at?: string;
          published_by?: string | null;
          questions_count?: number;
          skills_count?: number;
          updated_at?: string;
          version: number;
        };
        Update: {
          app_id?: string;
          content?: Json;
          created_at?: string;
          domains_count?: number;
          id?: string;
          published_at?: string;
          published_by?: string | null;
          questions_count?: number;
          skills_count?: number;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'curriculum_snapshots_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'curriculum_snapshots_published_by_fkey';
            columns: ['published_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      domains: {
        Row: {
          app_id: string;
          color: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          domain_id: string;
          icon: string | null;
          slug: string;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          app_id: string;
          color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          domain_id?: string;
          icon?: string | null;
          slug: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          domain_id?: string;
          icon?: string | null;
          slug?: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'domains_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      error_logs: {
        Row: {
          app_id: string | null;
          app_version: string | null;
          created_at: string | null;
          error_message: string;
          error_type: string;
          extra_context: Json | null;
          id: string;
          occurred_at: string | null;
          platform: string;
          promoted_to_issue_id: string | null;
          stack_trace: string | null;
          status: string;
          url: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          app_id?: string | null;
          app_version?: string | null;
          created_at?: string | null;
          error_message: string;
          error_type: string;
          extra_context?: Json | null;
          id?: string;
          occurred_at?: string | null;
          platform: string;
          promoted_to_issue_id?: string | null;
          stack_trace?: string | null;
          status?: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_id?: string | null;
          app_version?: string | null;
          created_at?: string | null;
          error_message?: string;
          error_type?: string;
          extra_context?: Json | null;
          id?: string;
          occurred_at?: string | null;
          platform?: string;
          promoted_to_issue_id?: string | null;
          stack_trace?: string | null;
          status?: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'error_logs_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'error_logs_promoted_to_issue_id_fkey';
            columns: ['promoted_to_issue_id'];
            isOneToOne: false;
            referencedRelation: 'known_issues';
            referencedColumns: ['id'];
          },
        ];
      };
      generation_audit_log: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          session_id: string;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generation_audit_log_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'ai_generation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      group_join_requests: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          status: string | null;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          status?: string | null;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          status?: string | null;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_join_requests_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_join_requests_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string | null;
          nickname: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          student_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string | null;
          nickname?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          student_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string | null;
          nickname?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          allow_anonymous_join: boolean | null;
          app_id: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          join_code: string;
          name: string;
          owner_id: string;
          requires_approval: boolean | null;
          settings: Json | null;
          type: Database['public']['Enums']['group_type'];
          updated_at: string | null;
        };
        Insert: {
          allow_anonymous_join?: boolean | null;
          app_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          join_code: string;
          name: string;
          owner_id: string;
          requires_approval?: boolean | null;
          settings?: Json | null;
          type?: Database['public']['Enums']['group_type'];
          updated_at?: string | null;
        };
        Update: {
          allow_anonymous_join?: boolean | null;
          app_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          join_code?: string;
          name?: string;
          owner_id?: string;
          requires_approval?: boolean | null;
          settings?: Json | null;
          type?: Database['public']['Enums']['group_type'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invitation_codes: {
        Row: {
          app_id: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          max_uses: number | null;
          times_used: number | null;
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          times_used?: number | null;
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          times_used?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitation_codes_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'invitation_codes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      known_issues: {
        Row: {
          app_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          error_message: string | null;
          id: string;
          resolution: string | null;
          root_cause: string | null;
          sentry_link: string | null;
          severity: string;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          error_message?: string | null;
          id?: string;
          resolution?: string | null;
          root_cause?: string | null;
          sentry_link?: string | null;
          severity?: string;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          app_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          error_message?: string | null;
          id?: string;
          resolution?: string | null;
          root_cause?: string | null;
          sentry_link?: string | null;
          severity?: string;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'known_issues_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      platform_config: {
        Row: {
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          app_id: string | null;
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_test_account: boolean | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          is_test_account?: boolean | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_test_account?: boolean | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      purchases: {
        Row: {
          app_id: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          item_id: string;
          item_name: string;
          points_cost: number;
          purchased_at: string | null;
          user_id: string;
        };
        Insert: {
          app_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          item_id: string;
          item_name: string;
          points_cost: number;
          purchased_at?: string | null;
          user_id: string;
        };
        Update: {
          app_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          item_id?: string;
          item_name?: string;
          points_cost?: number;
          purchased_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchases_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'purchases_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      questions: {
        Row: {
          app_id: string;
          content: Json;
          content_hash: string | null;
          created_at: string;
          deleted_at: string | null;
          difficulty_level: number | null;
          eli10_text: string | null;
          explanation: string | null;
          hint_text: string | null;
          options: Json | null;
          points: number | null;
          question_id: string;
          rule_text: string | null;
          skill_id: string;
          solution: Json;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          type: Database['public']['Enums']['question_type'];
          updated_at: string;
        };
        Insert: {
          app_id: string;
          content: Json;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          difficulty_level?: number | null;
          eli10_text?: string | null;
          explanation?: string | null;
          hint_text?: string | null;
          options?: Json | null;
          points?: number | null;
          question_id?: string;
          rule_text?: string | null;
          skill_id: string;
          solution: Json;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          type: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          content?: Json;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          difficulty_level?: number | null;
          eli10_text?: string | null;
          explanation?: string | null;
          hint_text?: string | null;
          options?: Json | null;
          points?: number | null;
          question_id?: string;
          rule_text?: string | null;
          skill_id?: string;
          solution?: Json;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          type?: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'questions_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
        ];
      };
      security_logs: {
        Row: {
          app_id: string | null;
          created_at: string | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          severity: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          severity?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_id?: string | null;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          severity?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'security_logs_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      session_events: {
        Row: {
          app_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          question_id: string;
          type: Database['public']['Enums']['event_type'];
          user_id: string;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          question_id: string;
          type: Database['public']['Enums']['event_type'];
          user_id: string;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          question_id?: string;
          type?: Database['public']['Enums']['event_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_events_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'session_events_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['question_id'];
          },
          {
            foreignKeyName: 'session_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          app_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          ended_at: string | null;
          id: string;
          questions_attempted: number | null;
          questions_correct: number | null;
          skill_id: string | null;
          started_at: string;
          total_time_ms: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          ended_at?: string | null;
          id?: string;
          questions_attempted?: number | null;
          questions_correct?: number | null;
          skill_id?: string | null;
          started_at?: string;
          total_time_ms?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          ended_at?: string | null;
          id?: string;
          questions_attempted?: number | null;
          questions_correct?: number | null;
          skill_id?: string | null;
          started_at?: string;
          total_time_ms?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'sessions_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
        ];
      };
      skill_progress: {
        Row: {
          app_id: string | null;
          correct_attempts: number | null;
          created_at: string;
          current_streak: number | null;
          deleted_at: string | null;
          id: string;
          last_attempt_at: string | null;
          longest_streak: number | null;
          mastery_level: number | null;
          skill_id: string;
          total_attempts: number | null;
          total_points: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          app_id?: string | null;
          correct_attempts?: number | null;
          created_at?: string;
          current_streak?: number | null;
          deleted_at?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          longest_streak?: number | null;
          mastery_level?: number | null;
          skill_id: string;
          total_attempts?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          app_id?: string | null;
          correct_attempts?: number | null;
          created_at?: string;
          current_streak?: number | null;
          deleted_at?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          longest_streak?: number | null;
          mastery_level?: number | null;
          skill_id?: string;
          total_attempts?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'skill_progress_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'skill_progress_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
          {
            foreignKeyName: 'skill_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      skills: {
        Row: {
          app_id: string;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          difficulty_level: number | null;
          domain_id: string;
          skill_id: string;
          slug: string;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          domain_id: string;
          skill_id?: string;
          slug: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          domain_id?: string;
          skill_id?: string;
          slug?: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'skills_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['domain_id'];
          },
        ];
      };
      source_documents: {
        Row: {
          app_id: string | null;
          created_at: string;
          deleted_at: string | null;
          error_message: string | null;
          extracted_text: string | null;
          file_size: number;
          filename: string;
          id: string;
          mime_type: string;
          page_count: number | null;
          status: string | null;
          storage_path: string;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          error_message?: string | null;
          extracted_text?: string | null;
          file_size: number;
          filename: string;
          id?: string;
          mime_type: string;
          page_count?: number | null;
          status?: string | null;
          storage_path: string;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          error_message?: string | null;
          extracted_text?: string | null;
          file_size?: number;
          filename?: string;
          id?: string;
          mime_type?: string;
          page_count?: number | null;
          status?: string | null;
          storage_path?: string;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'source_documents_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'source_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      student_recovery_keys: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          key_hash: string;
          student_id: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash: string;
          student_id: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash?: string;
          student_id?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_recovery_keys_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subjects: {
        Row: {
          color_hex: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon_name: string | null;
          icon_url: string | null;
          slug: string;
          status: Database['public']['Enums']['curriculum_status'] | null;
          subject_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          icon_url?: string | null;
          slug: string;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          subject_id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          icon_url?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          subject_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tenant_quotas: {
        Row: {
          app_id: string;
          created_at: string;
          current_token_usage: number;
          id: string;
          is_throttled: boolean;
          last_reset_date: string;
          monthly_token_limit: number;
          updated_at: string;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          current_token_usage?: number;
          id?: string;
          is_throttled?: boolean;
          last_reset_date?: string;
          monthly_token_limit?: number;
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          current_token_usage?: number;
          id?: string;
          is_throttled?: boolean;
          last_reset_date?: string;
          monthly_token_limit?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_quotas_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: true;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      user_activity: {
        Row: {
          activity_date: string;
          app_id: string;
          created_at: string | null;
          id: string;
          points_earned: number | null;
          questions_attempted: number | null;
          time_spent_ms: number | null;
          user_id: string;
        };
        Insert: {
          activity_date: string;
          app_id: string;
          created_at?: string | null;
          id?: string;
          points_earned?: number | null;
          questions_attempted?: number | null;
          time_spent_ms?: number | null;
          user_id: string;
        };
        Update: {
          activity_date?: string;
          app_id?: string;
          created_at?: string | null;
          id?: string;
          points_earned?: number | null;
          questions_attempted?: number | null;
          time_spent_ms?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'user_activity_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_metadata: {
        Row: {
          app_id: string;
          daily_streak: number | null;
          hints_balance: number | null;
          id: string;
          last_active_date: string | null;
          points_balance: number | null;
          updated_at: string | null;
        };
        Insert: {
          app_id: string;
          daily_streak?: number | null;
          hints_balance?: number | null;
          id: string;
          last_active_date?: string | null;
          points_balance?: number | null;
          updated_at?: string | null;
        };
        Update: {
          app_id?: string;
          daily_streak?: number | null;
          hints_balance?: number | null;
          id?: string;
          last_active_date?: string | null;
          points_balance?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_metadata_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      batch_insert_session_events: {
        Args: { events_json: Json };
        Returns: undefined;
      };
      check_global_ai_quota: { Args: never; Returns: Json };
      check_group_membership: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: boolean;
      };
      check_sync_health: {
        Args: { client_version: string; schema_version: number };
        Returns: Json;
      };
      consume_tenant_tokens: {
        Args: { p_app_id: string; p_operation?: string; p_tokens_used: number };
        Returns: Json;
      };
      current_app_id: { Args: never; Returns: string };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      deactivate_invitation_code: {
        Args: { p_code_id: string };
        Returns: undefined;
      };
      deactivate_own_account: { Args: never; Returns: undefined };
      delete_own_account: { Args: never; Returns: undefined };
      generate_invitation_code: {
        Args: { p_expires_days?: number; p_max_uses?: number };
        Returns: string;
      };
      get_sync_integrity_stats: { Args: { p_app_id: string }; Returns: Json };
      import_questions_bulk: {
        Args: { questions_data: Json };
        Returns: {
          inserted_count: number;
          success: boolean;
        }[];
      };
      is_group_in_app: {
        Args: { p_app_id: string; p_group_id: string };
        Returns: boolean;
      };
      jwt_is_admin: { Args: never; Returns: boolean };
      jwt_is_mentor: { Args: never; Returns: boolean };
      jwt_is_super_admin: { Args: never; Returns: boolean };
      jwt_is_tenant_admin: { Args: never; Returns: boolean };
      list_curriculum_snapshots: {
        Args: { p_app_id: string };
        Returns: {
          domains_count: number;
          published_at: string;
          published_by: string;
          questions_count: number;
          skills_count: number;
          version: number;
        }[];
      };
      log_error: {
        Args: {
          p_app_id?: string;
          p_app_version?: string;
          p_error_message: string;
          p_error_type: string;
          p_extra_context?: Json;
          p_platform: string;
          p_stack_trace?: string;
          p_url?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      log_security_event: {
        Args: {
          p_app_id?: string;
          p_event_type: string;
          p_location?: string;
          p_metadata?: Json;
          p_severity: string;
        };
        Returns: undefined;
      };
      promote_error_to_issue: {
        Args: {
          p_error_id: string;
          p_resolution?: string;
          p_root_cause?: string;
          p_title: string;
        };
        Returns: string;
      };
      publish_curriculum: { Args: { p_app_id?: string }; Returns: Json };
      pull_changes: {
        Args: { last_sync_time?: string; table_name: string };
        Returns: Json;
      };
      role_is_super_admin: { Args: never; Returns: boolean };
      rollback_publish: {
        Args: { p_app_id: string; p_target_version: number };
        Returns: Json;
      };
      submit_attempt_and_update_progress: {
        Args: { attempts_json: Json };
        Returns: {
          app_id: string | null;
          correct_attempts: number | null;
          created_at: string;
          current_streak: number | null;
          deleted_at: string | null;
          id: string;
          last_attempt_at: string | null;
          longest_streak: number | null;
          mastery_level: number | null;
          skill_id: string;
          total_attempts: number | null;
          total_points: number | null;
          updated_at: string;
          user_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'skill_progress';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      user_can_access_assignment: {
        Args: { p_assignment_id: string; p_user_id: string };
        Returns: boolean;
      };
      validate_and_use_invitation_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
      validate_invitation_code: { Args: { p_code: string }; Returns: boolean };
    };
    Enums: {
      assignment_scope: 'mandatory' | 'suggested';
      assignment_status: 'pending' | 'completed' | 'late';
      assignment_type: 'skill_mastery' | 'time_goal' | 'custom';
      curriculum_status: 'draft' | 'published' | 'live';
      event_type: 'attempt' | 'skip' | 'flag' | 'hint_used' | 'rule_used' | 'eli10_used';
      group_type: 'class' | 'family';
      question_type: 'multiple_choice' | 'mcq_multi' | 'text_input' | 'boolean' | 'reorder_steps';
      user_role: 'super_admin' | 'admin' | 'student' | 'mentor';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      assignment_scope: ['mandatory', 'suggested'],
      assignment_status: ['pending', 'completed', 'late'],
      assignment_type: ['skill_mastery', 'time_goal', 'custom'],
      curriculum_status: ['draft', 'published', 'live'],
      event_type: ['attempt', 'skip', 'flag', 'hint_used', 'rule_used', 'eli10_used'],
      group_type: ['class', 'family'],
      question_type: ['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps'],
      user_role: ['super_admin', 'admin', 'student', 'mentor'],
    },
  },
} as const;
